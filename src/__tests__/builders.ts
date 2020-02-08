import { Page } from '../Page';
import _ from 'lodash';

export function buildPage(page: Partial<Page>): Page {
  return _.merge(
    {
      hash: '1',
      html: '',
      path: '',
      tocs: [],
      headings: [],
      sections: [],
      meta: {
        roles: []
      }
    },
    page
  );
}
