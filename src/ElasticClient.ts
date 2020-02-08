import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from './logger';
import * as _ from 'lodash';
import * as elasticsearch from 'elasticsearch';
import { wait } from './wait';
import { retry } from './retry';
import ms from 'ms';

type ElasticConfiguration = {
  url: string;
  index: string;
};

export class ElasticClient {
  config: ElasticConfiguration;
  private client: elasticsearch.Client;

  constructor(config: ElasticConfiguration) {
    this.config = config;
    this.client = new elasticsearch.Client({
      host: this.config.url
    });
  }

  async waitForReady() {
    const retries = 10;
    for (const retry of _.range(0, retries)) {
      try {
        logger.info(
          `Waiting for elastic search to become ready. Try ${retry +
            1}/${retries}`
        );
        await this.client.cluster.health({ waitForStatus: 'yellow' });
        return;
      } catch (e) {
        await wait(1000);
      }
    }
    throw new Error(`Elastic search is not ready after ${retries} retries`);
  }

  async createIndex(index: string, indexDefinition: any) {
    await this.request({
      method: 'put',
      url: `/${index}`,
      body: indexDefinition
    });
    await this.request({
      method: 'get',
      url: '_cluster/health?wait_for_status=yellow'
    });
    logger.info(`ES index ${index} created`);
  }

  async bulkUpdate(body: any[]) {
    await this.client.bulk({
      body
    });
  }

  async deleteIndex(index: string) {
    logger.warn(`DELETE INDEX ${index}`);
    await this.request({
      method: 'delete',
      url: `/${index}`,
      ignoreErrorCodes: [404]
    });
  }

  async refreshIndex(index: string) {
    await this.request({
      method: 'get',
      url: `/${index}/_refresh`
    });
  }

  async getIndexMappings(index: string) {
    const response = await this.request<any>({
      method: 'get',
      url: `/${index}`,
      ignoreErrorCodes: [404]
    });
    if (!response) return undefined;

    return response![index];
  }

  async syncMappings(
    index: string,
    indexMappings: any
  ): Promise<{ updated: boolean }> {
    const currentMappings = await this.getIndexMappings(index);

    if (!currentMappings) {
      logger.info(`Creating index mappings ${index}`);
      await this.createIndex(index, indexMappings);
      return { updated: true };
    }

    const hasSameMappings = _.isEqual(
      currentMappings.mappings,
      indexMappings.mappings
    );

    if (!hasSameMappings) {
      logger.info(`Updating index mappings for ${index}`);
      await this.deleteIndex(index);
      await this.createIndex(index, indexMappings);
      return { updated: true };
    }

    logger.info(`Index ${index} was up to date`);
    return { updated: false };
  }

  async indexDocument(index: string, id: string, obj: any) {
    await retry(
      () =>
        this.request({
          method: 'put',
          url: `/${index}/_doc/${encodeURIComponent(id)}`,
          body: obj
        }),
      {
        maxRetries: 5,
        wait: ms('30s')
      }
    );
  }

  async indexDocuments(index: string, documents: Array<Document>) {
    const chunks = _.chunk(documents, 20);
    for (const chunk of chunks) {
      const body = _.flatMap(chunk, document => {
        return [
          {
            index: {
              _index: index,
              _type: '_doc',
              _id: document.id
            }
          },
          document
        ];
      });
      await retry(() => this.bulkUpdate(body), {
        maxRetries: 5,
        wait: ms('30s')
      });
    }
  }

  async findDocumentById<T>(index: string, id: string): Promise<T | undefined> {
    const response = await this.request<{ found: boolean; _source: any }>({
      method: 'get',
      url: `/${index}/_doc/${encodeURIComponent(id)}`,
      ignoreErrorCodes: [404]
    });
    if (!response) return undefined;
    if (!response.found) return undefined;
    return response._source;
  }

  async deleteDocumentById(index: string, id: string) {
    await this.request({
      method: 'delete',
      url: `/${index}/_doc/${encodeURIComponent(id)}`,
      ignoreErrorCodes: [404]
    });
  }

  async deleteByQuery(index: string, body: any) {
    await this.request({
      method: 'post',
      url: `/${index}/_delete_by_query`,
      body
    });
  }

  async search<Doc = any>(
    index: string,
    query: ElasticSearchQuery
  ): Promise<ESSearchResponse<Doc> | undefined> {
    const response = await this.request<ESSearchResponse<Doc>>({
      method: 'GET',
      url: `${index}/_search`,
      body: query
    });
    return response;
  }

  async *searchAllDocuments<Doc = any>(
    index: string,
    query: ElasticSearchQuery
  ) {
    let from = 0;
    const size = 10;
    while (true) {
      const response = await this.search(index, { ...query, from, size });
      yield response;
      if (!response) break;
      if (response.hits.hits.length === 0) break;
      from += size;
    }
  }

  private async request<R>(requestConfig: ElassticSearchRequestArgs) {
    const { body, ignoreErrorCodes, ...extra } = requestConfig;
    try {
      const response = await axios.request<R>(
        _.merge(
          {
            baseURL: this.config.url,
            headers: {
              'Content-Type': 'application/json'
            },
            data: body ? JSON.stringify(body) : undefined,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          },
          extra
        )
      );
      return response.data;
    } catch (error) {
      if (error.hasOwnProperty('response') && error.response) {
        const axiosError = error as AxiosError;
        const response = axiosError.response!;
        if (_.includes(ignoreErrorCodes, response.status)) {
          return undefined;
        }
        logger.error('Elastic search request error', {
          code: 'ELASTIC_SEARCH_REQUEST_ERROR',
          request: {
            method: requestConfig.method,
            url: requestConfig.url
          },
          response: {
            status: response.status,
            body: response.data
          }
        });
      }
      throw error;
    }
  }
}

type ElasticSearchQuery = {
  from?: number;
  size?: number;
  query: any;
  highlight?: Record<string, any>;
};

type Document = {
  id: string;
};

type ElassticSearchRequestArgs = AxiosRequestConfig & {
  body?: any;
  ignoreErrorCodes?: number[];
};

export type ESSearchResponse<T> = {
  took: number;
  timed_out: number;
  hits: {
    total: number;
    max_score: number | null;
    hits: Array<Hit<T>>;
  };
};

type Hit<S> = {
  _index: string;
  _type: string;
  _id: string;
  _source: S;
  _score: number | null;
  highlight?: Record<string, string[]>;
};
