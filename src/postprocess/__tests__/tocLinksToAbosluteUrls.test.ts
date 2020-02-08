import { tocLinksToAbsoluteUrls } from '../tocLinksToAbsoluteUrls';
import { Toc } from '../../Page';

describe('tocLinksToAbsoluteUrls', () => {
  it('should convert relative to absolute image links', () => {
    const tocs: Toc[] = [
      [
        { href: 'a.html', title: 'A', level: 1 },
        { href: '/b.html', title: 'B', level: 2 },
        { href: 'http://www.external.com', title: 'External', level: 1 }
      ],
      [{ href: 'c.html', title: 'C', level: 1 }]
    ];
    const result = tocLinksToAbsoluteUrls(tocs);

    expect(result).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "href": "/a.html",
            "level": 1,
            "title": "A",
          },
          Object {
            "href": "/b.html",
            "level": 2,
            "title": "B",
          },
          Object {
            "href": "http://www.external.com",
            "level": 1,
            "title": "External",
          },
        ],
        Array [
          Object {
            "href": "/c.html",
            "level": 1,
            "title": "C",
          },
        ],
      ]
    `);
  });
});
