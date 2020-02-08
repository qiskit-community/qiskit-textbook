import express from 'express';
import { getLogger } from './logger';
import { config } from './config';
import { Server } from 'http';
import path from 'path';
import { Page, Role } from './Page';
import { renderTocsInHtmlPlaceholders } from './renderTocsInHtmlPlaceholders';
import { isValidRole } from './roles';
import cookieParser from 'cookie-parser';
import {
  filterSearchResultsByUserRoles,
  filterTocByUserRoles,
  filterTocsByUserRoles,
  userCanSeePage
} from './accessControl';
import { renderPreviewHtml } from './renderPreviewHtml';
import { PageOut } from './PageOut';
import { getPrevNextLinks } from './getPrevNextLinks';
import { getRolesForAccessToken } from './iqx';
import cors from 'cors';
import { tocsHrefsToAbsolute } from './tocToAbsoluteUrls';
import socketio from 'socket.io';
import _ from 'lodash';
import { ElasticRepository, SearchResult } from './ElasticRepository';
import { AppError } from './Errors';

const logger = getLogger('server');

const CSS_PATH = `./dist/css`;

let server: Server | undefined;

function handleError(res: express.Response, error: Error) {
  logger.error(error);
  let message = 'Internal Error';

  if (error instanceof AppError && error.publicMessage) {
    message = error.publicMessage;
  }
  res.status(500).send(message);
}

export function startServer(elasticRepository: ElasticRepository) {
  const app = express();
  app.use(cors());
  app.use(cookieParser());

  app.use('/css', express.static(CSS_PATH));

  app.get('/search', async (req, res) => {
    try {
      const query: string = req.query.query || '';
      if (query.trim().length === 0) {
        res.json({});
        return;
      }

      const userRoles = await getUserRoles(req, res);

      const SEARCH_RESULT_LIMIT = 10;
      let searchResults: SearchResult[] = [];

      for await (const headingPage of elasticRepository.searchHeadings(query)) {
        const filteredResults = await filterSearchResultsByUserRoles(
          elasticRepository,
          headingPage,
          userRoles
        );
        searchResults = [...searchResults, ...filteredResults];
        if (searchResults.length >= SEARCH_RESULT_LIMIT) break;
      }

      if (searchResults.length < SEARCH_RESULT_LIMIT) {
        for await (const sectionsPage of elasticRepository.searchSections(query)) {
          const filteredResults = await filterSearchResultsByUserRoles(
            elasticRepository,
            sectionsPage,
            userRoles
          );
          searchResults = [...searchResults, ...filteredResults];
          if (searchResults.length >= SEARCH_RESULT_LIMIT) break;
        }
      }

      const limitedResults = searchResults.slice(0, SEARCH_RESULT_LIMIT);

      res.json(limitedResults);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get('*', async (req, res, next) => {
    try {
      if (!req.path) return next();

      let page: Page | undefined;

      if (req.path.endsWith('.html')) {
        const match = req.path.match(/^\/(.*)\.html$/)!;
        page = await elasticRepository.findPageByPath(`${match[1]}.html`);
      } else {
        const match = req.path.match(/^\/(.*)$/)!;
        page =
          (await elasticRepository.findPageByPath(`${match[1]}.html`)) ||
          (await elasticRepository.findPageByPath(`${[match[1]]}index.html`));
      }
      if (!page) return next();

      const userRoles = await getUserRoles(req, res);
      if (!await userCanSeePage(elasticRepository, page, userRoles)) {
        res.sendStatus(401);
        return;
      }

      const tocs = await filterTocsByUserRoles(elasticRepository, page.tocs, userRoles, page.path);
      const mainTocPage = await elasticRepository.getMainTocPage();
      const filteredMainToc = await filterTocByUserRoles(
        elasticRepository,
        await elasticRepository.getMainToc(),
        userRoles,
        mainTocPage.path
      );
      const links = getPrevNextLinks(filteredMainToc, page.path);

      const pageOut: PageOut = {
        path: page.path,
        meta: _.omit(page.meta, 'roles'),
        html: renderTocsInHtmlPlaceholders(page.html, tocs),
        tocs: tocs,
        headings: page.headings,
        ...links
      };

      if (config.htmlPreview && req.query.format !== 'json') {
        res.send(await renderPreviewHtml(elasticRepository, pageOut, userRoles));
      } else {
        res.json(pageOut);
      }
    } catch (error) {
      handleError(res, error);
    }
  });

  app.use(express.static(path.join(process.cwd(), './dist/documentation')));

  const http = require('http').createServer(app);

  if (config.liveReload) {
    socketio(http);
  }

  return new Promise(resolve => {
    const port = config.app.port;
    server = http.listen(port, () => {
      logger.info(`Server running at port ${port}`);
      resolve();
    });
  });
}

async function getUserRoles(
  req: express.Request,
  res: express.Response
): Promise<Role[]> {
  const accessToken = req.query.access_token ?? req.header('x-access-token');
  if (accessToken) {
    try {
      return await getRolesForAccessToken(accessToken);
    } catch (e) {
      return [];
    }
  } else if (config.roleSwitcher) {
    if (isValidRole(req.query.role)) {
      res.cookie('role', req.query.role);
      return [req.query.role];
    } else if (req.query.role === '') {
      res.clearCookie('role');
      return [];
    }
    if (req.cookies.role) {
      return [req.cookies.role];
    }
    return [];
  } else {
    return [];
  }
}

export async function stopServer() {
  if (server) {
    server.close();
  }
}
