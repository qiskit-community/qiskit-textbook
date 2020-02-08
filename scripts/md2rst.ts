import { promisify } from 'util';
// @ts-ignore
import node_pandoc from 'node-pandoc';

const pandoc = promisify(node_pandoc);

export function normalizeImages(markdown: string): string {
  markdown = markdown.replace(/<img\s+src=\"([^"]*)\"\s+alt=\"([^"]*)\"\s*>/g, `\n![$2]($1)\n`);
  markdown = markdown.replace(/<img\s+src=\"([^"]*)\"[^>]*>/g, `\n![]($1)\n`);
  return markdown;
}

export async function md2rst(md: string): Promise<string> {
  return await pandoc(normalizeImages(md), ['-f', 'markdown', '-t', 'rst']);
}
