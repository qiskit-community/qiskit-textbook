import cheerio from 'cheerio';
import _ from 'lodash';
import { Toc, TocEntry } from '../Page';

export function extractTocs(html: string): { tocs: Toc[]; html: string } {
  const $ = cheerio.load(html);
  const $tocs = $('.toctree-wrapper');
  const tocs = _.map($tocs, (toc, tocIndex) => {
    const $toc = $(toc);
    const entries = $(
      '.toctree-l1, .toctree-l2, .toctree-l3, .toctree-l4, .toctree-l5, .toctree-l6 ',
      $toc
    );
    const tocEntries: Toc = _.map(entries, entry => {
      const $entry = $(entry);
      const $link = $('a', $entry).first();
      const classes = $entry.attr('class')?.split(/\s+/) ?? [''];
      const clazz = classes.find(clazz => clazz.match(/toctree-l/))!;
      const level = parseInt(clazz.substring(`toctree-l`.length), 10);
      const href = $link.prop('href');
      const title = $link.text();
      const tocEntry: TocEntry = { level, href, title };
      return tocEntry;
    });

    $toc.replaceWith(`<!-- toc[${tocIndex}] -->`);

    return tocEntries;
  });

  const resultHtml = $('body').html() ?? '';

  return { tocs, html: resultHtml };
}
