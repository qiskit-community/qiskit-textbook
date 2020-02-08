import { removeAnchorLinks } from '../removeAnchorLinks';

describe('removeAnchorLinks', () => {
  it('should remove anchor links from a toc', () => {
    const tocs = [
      [
        { href: 'a.html', title: 'A', level: 1 },
        { href: 'b.html#section', title: 'B', level: 2 }
      ],
      [{ href: 'c.html', title: 'C', level: 1 }]
    ];

    const result = removeAnchorLinks(tocs);
    expect(result).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "href": "a.html",
            "level": 1,
            "title": "A",
          },
        ],
        Array [
          Object {
            "href": "c.html",
            "level": 1,
            "title": "C",
          },
        ],
      ]
    `);
  });
});
