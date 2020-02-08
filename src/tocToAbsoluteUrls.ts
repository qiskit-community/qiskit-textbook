import { Toc } from './Page';
import _ from 'lodash';
import { relativeToAbsolutePath } from './relativeToAbsolutePath';

export function tocsHrefsToAbsolute(tocs: Toc[], baseUrl: string) {
  return _.map(tocs, toc => tocHrefsToAbsolute(toc, baseUrl));
}

export function tocHrefsToAbsolute(toc: Toc, baseUrl: string) {
  return _.map(toc, page => {
    return { ...page, href: relativeToAbsolutePath(page.href, baseUrl) };
  });
}
