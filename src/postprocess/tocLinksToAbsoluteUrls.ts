import _ from 'lodash';
import isAbsoluteUrl from 'is-absolute-url';
import { Toc } from '../Page';

export function tocLinksToAbsoluteUrls(tocs: Toc[]): Toc[] {
  return _.map(tocs, toc =>
    _.map(toc, page => {
      let href = page.href;
      if (href && !isAbsoluteUrl(href) && !href.startsWith('/')) {
        href = `/${href}`;
      }
      return {
        ...page,
        href
      };
    })
  );
}
