import cheerio from 'cheerio';

export function extractBody(html: string): string {
  const $ = cheerio.load(html);
  return $('body').html() ?? '';
}
