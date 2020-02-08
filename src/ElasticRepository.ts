import { ElasticClient, ESSearchResponse } from './ElasticClient';
import { Page, Section, HeadingEntry, Role } from './Page';
import _ from 'lodash';
import memoizee from 'memoizee';
import { readJson } from './fsUtils';
import { logger } from './logger';
import {
  headingsIndexDefinition,
  pagesIndexDefinition,
  sectionsIndexDefinition,
  staticIndexDefinition
} from './elasticIndexDefinitions';
import { AppError } from './Errors';

export type SearchResult = SearchSections | SearchHeadings;
export type SearchSections = Section & { path: string };
export type SearchHeadings = HeadingEntry & { path: string };

export class ElasticRepository {
  private client: ElasticClient;
  readonly indexes: Indexes;

  constructor(elasticClient: ElasticClient) {
    this.client = elasticClient;
    this.indexes = {
      pages: `${this.client.config.index}_pages`,
      static: `${this.client.config.index}_static`,
      sections: `${this.client.config.index}_sections`,
      headings: `${this.client.config.index}_headings`
    };
  }

  findPageByPath = memoizee(
    (path: string) => {
      path = path.startsWith('/') ? path.slice(1) : path;
      return this.client.findDocumentById<Page>(this.indexes.pages, path);
    },
    { promise: true, length: 30 }
  );

  async getMainTocPage() {
    const mainTocPage = await this.findPageByPath('toc.html');
    if (!mainTocPage)
      throw new AppError('toc.html file not defined', 'Sync in progress');
    return mainTocPage;
  }

  getMainToc = memoizee(
    async () => {
      const mainTocPage = await this.getMainTocPage();
      const mainToc = _.first(mainTocPage.tocs);
      if (!mainToc)
        throw new AppError(
          'toc.html doesnt contains any toc',
          'Sync in progress'
        );
      return mainToc;
    },
    { promise: true }
  );

  async getPathRoles(path: string) {
    path = path.startsWith('/') ? path.slice(1) : path;
    const pageRoles = await this.getPageRoles();
    return pageRoles[path] ?? [];
  }

  private getPageRoles = memoizee(
    async () => {
      const roles = await this.client.findDocumentById<Record<string, Role[]>>(
        this.indexes.static,
        'roles'
      );
      if (!roles)
        throw new AppError('No roles pages found', 'Sync in progress');
      return roles;
    },
    { promise: true }
  );

  async *searchSections(query: string): AsyncGenerator<SearchSections[]> {
    const esQuery = {
      query: {
        match: {
          text: {
            query,
            analyzer: 'english',
            fuzziness: 'auto'
          }
        }
      },
      highlight: {
        fields: {
          text: {}
        },
        fragment_size: 40
      }
    };

    for await (const response of this.client.searchAllDocuments<SearchSections>(
      this.indexes.sections,
      esQuery
    )) {
      const mappedResponse = this.mapSearchResultWithHighlights(response);
      yield mappedResponse;
    }
  }

  async *searchHeadings(query: string): AsyncGenerator<SearchHeadings[]> {
    const esQuery = {
      query: {
        match: {
          title: {
            query,
            analyzer: 'english',
            fuzziness: 'auto'
          }
        }
      },
      highlight: {
        fields: {
          title: {}
        },
        fragment_size: 40
      }
    };

    for await (const response of this.client.searchAllDocuments<SearchSections>(
      this.indexes.headings,
      esQuery
    )) {
      const mappedResponse = this.mapSearchResultWithHighlights(response);
      yield mappedResponse;
    }
  }

  private mapSearchResultWithHighlights<Doc>(
    response: ESSearchResponse<Doc> | undefined
  ): Doc[] {
    if (!response) return [];
    return response.hits.hits.map(hit => {
      if (!hit.highlight) return hit._source;
      const highlight = _.mapValues(hit.highlight, highlights =>
        _.first(highlights)
      );
      return { ...hit._source, ...highlight };
    });
  }

  async sync() {
    type Hashes = Record<string, string>;

    const syncResults = await Promise.all([
      this.client.syncMappings(this.indexes.pages, pagesIndexDefinition),
      this.client.syncMappings(this.indexes.sections, sectionsIndexDefinition),
      this.client.syncMappings(this.indexes.headings, headingsIndexDefinition)
    ]);

    const someIndexUpdated = _.some(
      syncResults,
      syncResult => syncResult.updated
    );
    if (someIndexUpdated) {
      // Force a full sync
      await this.client.deleteIndex(this.indexes.static);
    }
    await this.client.syncMappings(this.indexes.static, staticIndexDefinition);

    const basePagesPath = `${process.cwd()}/dist/documentation/.pages/`;

    const newHashes = await readJson<Hashes>(`${basePagesPath}/.hashes.json`);

    let oldHashes: Hashes =
      (await this.client.findDocumentById<Hashes>(
        this.indexes.static,
        'hashes'
      )) ?? {};

    const deletedPaths = _.difference(_.keys(oldHashes), _.keys(newHashes));
    const newPaths = _.difference(_.keys(newHashes), _.keys(oldHashes));
    const updatedPaths = _.keys(oldHashes).filter(path => {
      if (!newHashes[path]) return false;
      return oldHashes[path] !== newHashes[path];
    });

    for (const deletedPath of deletedPaths) {
      logger.info(`Deleting document ${deletedPath}`);

      await this.client.deleteDocumentById(this.indexes.pages, deletedPath);
      await this.client.deleteByQuery(this.indexes.sections, {
        query: { term: { path: { value: deletedPath } } }
      });
      await this.client.deleteByQuery(this.indexes.headings, {
        query: { term: { path: { value: deletedPath } } }
      });
    }

    for (const path of [...newPaths, ...updatedPaths]) {
      logger.info(`Indexing document ${path}`);

      const page = await readJson<Page>(`${basePagesPath}/${path}.json`);
      const sectionDocuments = page.sections.map(section => ({
        id: `${page.path}#${section.heading.slug}`,
        path: page.path,
        ...section
      }));
      const headingDocuments = page.headings.map(heading => ({
        id: `${page.path}#${heading.slug}`,
        path: page.path,
        ...heading
      }));

      await this.client.indexDocument(this.indexes.pages, page.path, page);
      await this.client.indexDocuments(this.indexes.sections, sectionDocuments);
      await this.client.indexDocuments(this.indexes.headings, headingDocuments);
    }

    // write hashes
    logger.info('Writing hashes document');
    await this.client.indexDocument(this.indexes.static, 'hashes', newHashes);

    // write roles
    logger.info('Writing roles document');
    const roles = await readJson<Hashes>(`${basePagesPath}/.roles.merged.json`);
    await this.client.indexDocument(this.indexes.static, 'roles', roles);

    this.clearCache();

    logger.info('Sync done');
  }

  clearCache() {
    this.findPageByPath.clear();
    this.getMainToc.clear();
    this.getPageRoles.clear();
  }
}

type Indexes = {
  pages: string;
  static: string;
  sections: string;
  headings: string;
};
