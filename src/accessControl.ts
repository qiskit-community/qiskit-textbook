import { Page, Toc, Role, TocEntry } from './Page';
import _ from 'lodash';
import isAbsoluteUrl from 'is-absolute-url';
import { ElasticRepository, SearchResult } from './ElasticRepository';
import { relativeToAbsolutePath } from './relativeToAbsolutePath';

export async function userCanSeePage(
  elasticRepository: ElasticRepository,
  page: Page,
  userRoles: Role[]
): Promise<boolean> {
  return userCanSeePath(elasticRepository, page.path, userRoles);
}

export async function userCanSeePath(
  elasticRepository: ElasticRepository,
  path: string,
  userRoles: Role[]
): Promise<boolean> {
  const pageRoles = await elasticRepository.getPathRoles(path);
  if (pageRoles.length === 0) return true;
  return _.intersection(pageRoles, userRoles).length > 0;
}

export async function filterTocByUserRoles(
  elasticRepository: ElasticRepository,
  toc: Toc,
  userRoles: Role[],
  filePath: string
): Promise<Toc> {
  const filteredToc: Toc = [];
  for (const tocEntry of toc) {
    if (isAbsoluteUrl(tocEntry.href)) {
      filteredToc.push(tocEntry);
      continue;
    }
    const absolutePath = relativeToAbsolutePath(tocEntry.href, filePath);
    if (await userCanSeePath(elasticRepository, absolutePath, userRoles)) {
      filteredToc.push(tocEntry);
    }
  }
  return filteredToc;
}

export function filterTocsByUserRoles(
  elasticRepository: ElasticRepository,
  tocs: Toc[],
  userRoles: Role[],
  filePath: string
): Promise<Toc[]> {
  return Promise.all(
    _.map(tocs, toc => filterTocByUserRoles(elasticRepository, toc, userRoles, filePath))
  );
}

export async function filterSearchResultsByUserRoles(
  elasticRepository: ElasticRepository,
  searchResults: SearchResult[],
  userRoles: Role[]
): Promise<SearchResult[]> {
  const filteredSearchResults: SearchResult[] = [];
  for (const searchResult of searchResults) {
    if (await userCanSeePath(elasticRepository, searchResult.path, userRoles)) {
      filteredSearchResults.push(searchResult);
    }
  }
  return filteredSearchResults;
}
