export type Page = {
  hash: string;
  path: string;

  html: string;
  meta: Meta;

  sections: Section[];
  headings: HeadingEntry[];
  tocs: Toc[];
};

export type PageRef = { level: number; href: string; title: string };

export type TocEntry = { level: number; href: string; title: string };

export type Toc = TocEntry[];

export type Section = {
  heading: HeadingEntry;
  text: string;
};

export type HeadingEntry = {
  level: number;
  slug: string | undefined;
  title: string;
  titleHtml: string;
};

export type Meta = {
  roles: Role[];
  showFooterNavigation: boolean;
  fullWidth: boolean;
};

export type Role = 'admin' | 'hub-admin' | 'user' | 'group-admin';
