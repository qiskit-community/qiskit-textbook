import cheerio from 'cheerio';
import _ from 'lodash';
import isAbsoluteUrl from 'is-absolute-url';
import { getDirName } from '../pathUtils';

export function relativeToAbsoluteImages(
  htmlContent: string,
  filePath: string,
  baseUrl: string
): string {
  const $ = cheerio.load(htmlContent);
  const $images = $('img');

  const fileDir = getDirName(filePath);

  _.forEach($images, image => {
    const $image = $(image);
    const src = $image.attr('src');
    if (src && !isAbsoluteUrl(src)) {
      const newSrc = src.startsWith('/')
        ? `${baseUrl}${src}`
        : `${baseUrl}/${fileDir}/${src}`;
      $image.attr('src', newSrc);
    }
  });

  return $('body').html() ?? '';
}
