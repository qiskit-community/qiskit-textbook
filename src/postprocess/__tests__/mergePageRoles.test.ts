import { Toc } from '../../Page';
import { getMergedPageRoles } from '../mergePageRoles';
import { RolesByPath } from '../../RolesByPath';

describe('getMergedPageRoles', () => {
  it('should calculated merged pages roles', () => {
    const mainToc: Toc = [
      { level: 1, href: '/a.html', title: 'A' },
      { level: 2, href: '/a-1.html', title: 'A 1' },
      { level: 2, href: '/a-2.html', title: 'A 2' },
      { level: 3, href: '/a-2-1.html', title: 'A 2 1' },
      { level: 1, href: '/b.html', title: 'B' },
      { level: 1, href: '/c.html', title: 'C' },
      { level: 1, href: 'https://google.com', title: 'External' }
    ];

    const rolesByPath: RolesByPath = {
      'a.html': ['admin', 'hub-admin'],
      'a-1.html': [],
      'a-2.html': [],
      'a-2-1.html': ['admin'],
      'b.html': ['user'],
      'c.html': [],
      'noToc.html': []
    };

    const mergedPageRoles = getMergedPageRoles(mainToc, rolesByPath);

    expect(mergedPageRoles).toMatchInlineSnapshot(`
      Object {
        "a-1.html": Array [
          "admin",
          "hub-admin",
        ],
        "a-2-1.html": Array [
          "admin",
        ],
        "a-2.html": Array [
          "admin",
          "hub-admin",
        ],
        "a.html": Array [
          "admin",
          "hub-admin",
        ],
        "b.html": Array [
          "user",
        ],
        "c.html": Array [],
        "noToc.html": Array [],
      }
    `);
  });
});
