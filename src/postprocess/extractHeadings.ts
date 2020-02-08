import cheerio from 'cheerio';
import _ from 'lodash';
import { HeadingEntry } from '../Page';

export function extractHeadings(htmlContent: string): HeadingEntry[] {
  const $ = cheerio.load(htmlContent);
  const headings = $('h1, h2, h3, h4, h5, h6');
  const processedHeadings = _.map(headings, (heading: CheerioElement) => {
    return extractHeadingEntry($, heading);
  });
  return processedHeadings;
}

export function extractHeadingEntry($: CheerioStatic, el: CheerioElement) {
  const $heading = $(el);
  const $link = $('a', $heading);
  const slug = $link.attr('href')?.substring(1);
  $link.remove();
  const level = parseInt(el.name.substring(1), 10);
  const title = $heading.text()!.trim();
  const titleHtml = $heading.html()!.trim();
  const entry: HeadingEntry = { level, slug, title, titleHtml };
  return entry;
}
