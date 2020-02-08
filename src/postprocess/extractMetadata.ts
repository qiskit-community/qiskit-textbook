import { Meta } from '../Page';
import cheerio from 'cheerio';
import _ from 'lodash';
import { ROLES } from '../roles';

type MetaValues = MetaValue[];
type MetaValue = { name: string; content: string };

export function extractMetadata(html: string, path: string): Meta {
  const metadata = getMetadata(html);
  return {
    roles: parseListMeta(metadata, 'roles', ROLES, path),
    fullWidth: parseBooleanMeta(metadata, 'fullWidth', false),
    showFooterNavigation: parseBooleanMeta(
      metadata,
      'showFooterNavigation',
      true
    )
  };
}

function getMetadata(html: string) {
  const $ = cheerio.load(html);
  const $meta = $('meta');
  const metadata: MetaValues = $meta.toArray().map(el => {
    const $el = $(el);
    return { name: $el.attr('name') || '', content: $el.attr('content') || '' };
  });
  return metadata;
}

function parseBooleanMeta(
  metadata: MetaValues,
  name: string,
  defaultValue: boolean
): boolean {
  const value = metadata.find(value => value.name === name);
  if (!value) return defaultValue;
  const content = value.content.toLowerCase();
  if (content === 'true') return true;
  if (content === 'false') return false;
  return defaultValue;
}

function parseListMeta<T extends string>(
  metadata: MetaValues,
  name: string,
  validValues: T[],
  path: string // this parameter is used to have better diagnostic info
): T[] {
  const value = metadata.find(value => value.name === name);
  if (!value) return [];
  let listItems = value.content.split(',').map(item => item.trim());
  const validItems: T[] = [];

  function isValidItem(listItem: string): listItem is T {
    return (validValues as string[]).includes(listItem);
  }

  _.forEach(listItems, listItem => {
    if (isValidItem(listItem)) {
      validItems.push(listItem);
    } else {
      console.warn(
        `Ignoring invalid ${name} ${listItem} declared on ${path}. The valid values are ${validValues.join(
          ', '
        )}`
      );
    }
  });

  return validItems;
}
