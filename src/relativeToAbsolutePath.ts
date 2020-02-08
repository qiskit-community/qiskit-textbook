import isAbsoluteUrl from 'is-absolute-url';
import { getDirName } from './pathUtils';

export function relativeToAbsolutePath(href: string, filePath: string) {
  if (isAbsoluteUrl(href)) return href;
  if (href.startsWith('/')) return href;
  const dirname = getDirName(filePath);
  return `${dirname}/${href}`;
}
