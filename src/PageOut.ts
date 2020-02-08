import { HeadingEntry, Toc, PageRef, Meta } from './Page';

export type PageOut = {
  path: string;
  html: string;
  headings: HeadingEntry[];
  tocs: Toc[];
  level: number | null;
  next: PageRef | null;
  previous: PageRef | null;
  meta: Omit<Meta, 'roles'>
};
