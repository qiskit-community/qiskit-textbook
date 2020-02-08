import { Role } from './Page';
import _ from 'lodash';
import { renderTocsInHtmlPlaceholders } from './renderTocsInHtmlPlaceholders';
import { filterTocsByUserRoles } from './accessControl';
import { PageOut } from './PageOut';
import { config } from './config';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ElasticRepository } from './ElasticRepository';

export async function renderPreviewHtml(
  elasticRepository: ElasticRepository,
  page: PageOut,
  userRoles: Role[]
) {
  const mainTocPage = await elasticRepository.getMainTocPage();
  const mainTocHtml = renderTocsInHtmlPlaceholders(
    mainTocPage.html,
    await filterTocsByUserRoles(
      elasticRepository,
      mainTocPage.tocs,
      userRoles,
      mainTocPage.path
    )
  );

  let roleSwitcher;
  if (config.roleSwitcher) {
    const role = _.first(userRoles) ?? '';
    roleSwitcher = (
      <form className="role-selector">
        View page as
        <select name="role" defaultValue={role}>
          <option value="">Unauthenticated</option>
          <option value="user">Authenticated</option>
          <option value="admin">Admin</option>
          <option value="hub-admin">Hub Admin</option>
          <option value="group-admin">Group Admin</option>
        </select>
      </form>
    );
  }

  const app = (
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/css/style.css" />
        <link rel="stylesheet" type="text/css" href="/css/app.css" />
        {config.liveReload && <script src="/socket.io/socket.io.js"></script>}
      </head>
      <body>
        <div className="reload-indicator">Building new changes...</div>
        {roleSwitcher}
        <div className="app-container">
          <div
            className="menu"
            dangerouslySetInnerHTML={{ __html: mainTocHtml }}
          />
          <div className="content iqx-documentation">
            <div dangerouslySetInnerHTML={{ __html: page.html }} />
            {page.meta.showFooterNavigation && (
              <div className="links">
                {page.previous && (
                  <a href={page.previous.href}>{page.previous.title}</a>
                )}
                {page.next && <a href={page.next.href}>{page.next.title}</a>}
              </div>
            )}
          </div>
        </div>
        {config.roleSwitcher && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
          document.querySelector('.role-selector select').addEventListener('change', function() {
            document.querySelector('.role-selector').submit();
          });                
        `
            }}
          ></script>
        )}
        {config.liveReload && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
var socket = io({ reconnectionDelay: 50, reconnectionDelayMax: 100 });
socket.on('disconnect', () => {
  document.querySelector('.reload-indicator').classList.add('visible')
})
socket.on('reconnect', () => {
  window.location.reload();
});        
`
            }}
          ></script>
        )}
      </body>
    </html>
  );

  return renderToString(app);
}
