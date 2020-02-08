import { PageRef, Toc } from './Page';

export type Links = {
  level: number | null;
  next: PageRef | null;
  previous: PageRef | null;
};

export function getPrevNextLinks(toc: Toc | undefined, path: string): Links {
  if (!toc) {
    return {
      level: null,
      next: null,
      previous: null
    };
  }

  const tocIndex = toc.findIndex(tocEntry => tocEntry.href === path || tocEntry.href === `/${path}`);

  if (tocIndex === -1) {
    return {
      level: null,
      next: null,
      previous: null
    };
  }

  const tocEntry = toc[tocIndex];
  const nextEntry = toc[tocIndex + 1];
  const prevEntry = toc[tocIndex - 1];

  return {
    level: tocEntry.level,
    next: nextEntry ?? null,
    previous: prevEntry ?? null
  };
}
