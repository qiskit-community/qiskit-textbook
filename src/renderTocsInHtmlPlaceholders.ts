import { Toc } from './Page';
import _ from 'lodash';

export function renderTocsInHtmlPlaceholders(html: string, tocs: Toc[]) {
  let tmp = html;
  _.forEach(tocs, (toc, tocIndex) => {
    tmp = tmp.replace(`<!-- toc[${tocIndex}] -->`, renderToc(toc));
  });
  return tmp;
}

export function renderToc(toc: Toc) {
  const nestedToc = toNestedToc(toc);
  const nestedTocHtml = renderNestedToc(nestedToc);
  return nestedTocHtml;
}


function renderNestedToc(nestedToc: NestedToc): string {
  if (nestedToc.length === 0) return '';

  const items = nestedToc.map(tocEntry => {
    return `
<li class="toctree-l${tocEntry.level}">
  <a href="${tocEntry.href}">${tocEntry.title}</a>${renderNestedToc(tocEntry.children)}
</li>    
    `;
  });

  return `<ul>${items.join('\n')}</ul>`;
}

function toNestedToc(toc: Toc): NestedToc {
  const nestedToc: NestedToc = _.map(toc, page => ({ ...page, children: [] }));
  _.forEach(nestedToc, (page, index) => {
    const parent = _.findLast(
      _.slice(nestedToc, 0, index),
      p => p.level === page.level - 1
    );
    if (parent) {
      parent.children.push(page);
    }
  });

  const topLevel = _.min(_.map(toc, page => page.level));
  return nestedToc.filter(page => page.level === topLevel);
}

type NestedTocEntry = {
  level: number;
  href: string;
  title: string;
  children: NestedToc;
};

type NestedToc = NestedTocEntry[];
