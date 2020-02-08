import cheerio from 'cheerio';
import _ from 'lodash';
import { sentences as splitSentences } from 'sbd';
import { extractHeadingEntry } from './extractHeadings';
import { HeadingEntry, Section } from '../Page';

export function extractSections(htmlContent: string): Section[] {
  const $ = cheerio.load(htmlContent);

  $('.toctree-wrapper').remove();
  $('pre').remove();

  const sections: Array<Section> = [];

  const $headings = $('h1, h2, h3, h4, h5, h6');
  if ($headings.toArray().length === 0) return [];

  _.forEach($headings, heading => {
    const $heading = $(heading);
    const $container = $($heading.parent());

    const headingEntry = extractHeadingEntry($, heading);

    const $clonedContainer = $container.clone();

    // remove inner sections
    $clonedContainer.find('.section').remove();

    // remove current heading
    $clonedContainer.find('h1, h2, h3, h4, h5, h6').remove();

    sections.push({
      heading: headingEntry,
      text: $clonedContainer.text().trim()
    });
  });

  return sections;
}
