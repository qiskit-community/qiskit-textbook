import { promisify } from 'util';
import fs from 'fs';
import c from 'crypto';
import { processMathjax } from './mathjax';
import { extractHeadings } from './extractHeadings';
import { extractTocs } from './extractTocs';
import { relativeToAbsoluteImages } from './relativeToAbsoluteImages';
import path from 'path';
import { Page } from '../Page';
import { extractSections } from './extractSections';
import { removeAnchorLinks } from './removeAnchorLinks';
import globby from 'globby';
import { extractMetadata } from './extractMetadata';
import { extractBody } from './extractBody';
import mkdirp from 'mkdirp';
import _ from 'lodash';
import { RolesByPath } from '../RolesByPath';
import { HashByPath } from '../HashByPath';
import { getMergedPageRoles } from './mergePageRoles';
import { getDirName, getFileName } from '../pathUtils';
import { tocLinksToAbsoluteUrls } from './tocLinksToAbsoluteUrls';

const mkdirpAsync = promisify(mkdirp);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const BASE_DIR = `${__dirname}/../../dist/documentation`;
const PAGES_DIR = `${BASE_DIR}/.pages`;
const HASHES_FILE = `${PAGES_DIR}/.hashes.json`;
const ROLES_FILE = `${PAGES_DIR}/.roles.json`;
const MAIN_TOC_FILENAME = 'toc';
const FILES_EXCLUDED_FROM_SEARCH = [MAIN_TOC_FILENAME];

async function main() {
  await mkdirpAsync(PAGES_DIR);

  const files = await globby([
    `${BASE_DIR}/**/toc.html`,
    `${BASE_DIR}/**/*.html`
  ]);
  let hashes: HashByPath = await readJsonSafe<HashByPath>(HASHES_FILE, {});
  let roles: RolesByPath = await readJsonSafe<RolesByPath>(ROLES_FILE, {});

  for (const file of files) {
    const filePath = path.relative(BASE_DIR, file);

    let fileContent = await readFile(file, 'utf-8');
    let fileHash = md5(fileContent);

    if (isLiveReloadEnabled() && fileHash === hashes[filePath]) {
      // file hasn't change, skip the process
      continue;
    }

    console.log(`Postprocessing file ${filePath}`);

    const meta = await extractMetadata(fileContent, filePath);


    fileContent = await processMathjax(fileContent);
    const headings = extractHeadings(fileContent);
    let { html, tocs } = extractTocs(extractBody(fileContent));

    const sections = FILES_EXCLUDED_FROM_SEARCH.find(f => f === filePath)
      ? []
      : extractSections(html);

    if (process.env.BASE_URL) {
      html = relativeToAbsoluteImages(html, filePath, process.env.BASE_URL);
    }

    if (getFileName(filePath) === MAIN_TOC_FILENAME) {
      tocs = tocLinksToAbsoluteUrls(tocs);
      tocs = removeAnchorLinks(tocs);
    }

    const page: Page = {
      path: filePath,
      meta,
      headings,
      tocs,
      html,
      sections,
      hash: fileHash
    };

    if (!isLiveReloadEnabled()) {
      const pageHash = md5(JSON.stringify(page));
      page.hash = pageHash;
      fileHash = pageHash;
    }

    await writePage(`${PAGES_DIR}/${filePath}.json`, page);
    hashes[filePath] = fileHash;
    roles[filePath] = meta.roles;
  }

  const tocPage = await readJson<Page>(`${PAGES_DIR}/toc.html.json`);
  const mainToc = _.first(tocPage.tocs);
  if (!mainToc)  {
    throw new Error('toc.rst file is not defined');
  }

  await writeJson(HASHES_FILE, hashes);
  await writeJson(ROLES_FILE, roles);
  await writeJson(`${PAGES_DIR}/.roles.merged.json`, getMergedPageRoles(mainToc, roles));
}

async function writePage(path: string, page: Page) {
  await writeJson(path, page);
}

async function readJsonSafe<T>(path: string, defaultValue: T): Promise<T> {
  try {
    const json = await readFile(path, 'utf-8');
    return JSON.parse(json);
  } catch (e) {
    return defaultValue;
  }
}

async function readJson<T>(path: string): Promise<T> {
  const json = await readFile(path, 'utf-8');
  return JSON.parse(json);
}

async function writeJson(absPath: string, obj: any) {
  await mkdirpAsync(getDirName(absPath));
  await writeFile(absPath, JSON.stringify(obj));
}

function isLiveReloadEnabled() {
  return process.env.LIVE_RELOAD === 'true';
}

function md5(str: string) {
  return c
    .createHash('md5')
    .update(str, 'utf8')
    .digest('hex');
}

main().catch(e => console.error(e));
