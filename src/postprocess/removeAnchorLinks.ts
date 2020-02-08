import _ from 'lodash';
import { Toc } from '../Page';

export function removeAnchorLinks(tocs: Toc[]): Toc[] {
  return _.map(tocs, toc =>
    _.filter(toc, page => {
      return !page.href.includes('#');
    })
  );
}
