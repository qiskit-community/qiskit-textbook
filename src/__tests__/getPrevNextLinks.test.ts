import { getPrevNextLinks } from '../getPrevNextLinks';
import { Toc } from '../Page';

describe('getPrevNextLinks', () => {
  it('should return empty links if toc is undefined', () => {
    const result = getPrevNextLinks(undefined, 'index.html');
    expect(result).toEqual({
      level: null,
      next: null,
      previous: null
    });
  });

  it('should return empty links if path is not referenced on the toc', () => {
    const toc: Toc = [
      { level: 1, href: 'index.html', title: 'Getting started '}
    ];

    const result = getPrevNextLinks(toc, 'advanced.html');
    expect(result).toEqual({
      level: null,
      next: null,
      previous: null
    });
  });

  it('should return prev and next links', () => {
    const toc: Toc = [
      { level: 1, href: 'a.html', title: 'A'},
      { level: 2, href: 'b.html', title: 'B'},
      { level: 3, href: 'c.html', title: 'C'}
    ];

    expect(getPrevNextLinks(toc, 'a.html')).toEqual({
      level: 1,
      next: toc[1],
      previous: null
    });

    expect(getPrevNextLinks(toc, 'b.html')).toEqual({
      level: 2,
      next: toc[2],
      previous: toc[0]
    });

    expect(getPrevNextLinks(toc, 'c.html')).toEqual({
      level: 3,
      next: null,
      previous: toc[1]
    });

  });

  it('should return prev and next links if toc is main toc with absolute paths', () => {
    const toc: Toc = [
      { level: 1, href: '/a.html', title: 'A'},
      { level: 2, href: '/b.html', title: 'B'},
      { level: 3, href: '/c.html', title: 'C'}
    ];

    expect(getPrevNextLinks(toc, 'a.html')).toEqual({
      level: 1,
      next: toc[1],
      previous: null
    });

    expect(getPrevNextLinks(toc, 'b.html')).toEqual({
      level: 2,
      next: toc[2],
      previous: toc[0]
    });

    expect(getPrevNextLinks(toc, 'c.html')).toEqual({
      level: 3,
      next: null,
      previous: toc[1]
    });

  });

});
