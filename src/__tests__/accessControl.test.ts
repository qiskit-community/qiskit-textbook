import { filterTocByUserRoles } from '../accessControl';
import { Toc } from '../Page';
import { RolesByPath } from '../RolesByPath';
import { ElasticRepository } from '../ElasticRepository';

describe('accessControl', () => {
  describe('filterTocByUserRoles', () => {
    it('should filter the toc based on roles', async () => {
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
        'a-1.html': ['admin', 'hub-admin'],
        'a-2.html': ['admin', 'hub-admin'],
        'a-2-1.html': ['admin'],
        'b.html': ['user'],
        'c.html': [],
        'noToc.html': []
      };

      const elasticClientMock = createElasticClientMock(rolesByPath);

      expect(await filterTocByUserRoles(elasticClientMock, mainToc, [], '/'))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "href": "/c.html",
            "level": 1,
            "title": "C",
          },
          Object {
            "href": "https://google.com",
            "level": 1,
            "title": "External",
          },
        ]
      `);

      expect(
        await filterTocByUserRoles(elasticClientMock, mainToc, ['user'], '/')
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "href": "/b.html",
            "level": 1,
            "title": "B",
          },
          Object {
            "href": "/c.html",
            "level": 1,
            "title": "C",
          },
          Object {
            "href": "https://google.com",
            "level": 1,
            "title": "External",
          },
        ]
      `);

      expect(
        await filterTocByUserRoles(
          elasticClientMock,
          mainToc,
          ['hub-admin'],
          '/'
        )
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "href": "/a.html",
            "level": 1,
            "title": "A",
          },
          Object {
            "href": "/a-1.html",
            "level": 2,
            "title": "A 1",
          },
          Object {
            "href": "/a-2.html",
            "level": 2,
            "title": "A 2",
          },
          Object {
            "href": "/c.html",
            "level": 1,
            "title": "C",
          },
          Object {
            "href": "https://google.com",
            "level": 1,
            "title": "External",
          },
        ]
      `);

      expect(
        await filterTocByUserRoles(elasticClientMock, mainToc, ['admin'], '/')
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "href": "/a.html",
            "level": 1,
            "title": "A",
          },
          Object {
            "href": "/a-1.html",
            "level": 2,
            "title": "A 1",
          },
          Object {
            "href": "/a-2.html",
            "level": 2,
            "title": "A 2",
          },
          Object {
            "href": "/a-2-1.html",
            "level": 3,
            "title": "A 2 1",
          },
          Object {
            "href": "/c.html",
            "level": 1,
            "title": "C",
          },
          Object {
            "href": "https://google.com",
            "level": 1,
            "title": "External",
          },
        ]
      `);
    });

    it('should filter the toc of a nested page', async () => {
      const toc: Toc = [
        { level: 1, href: 'index.html', title: 'private' },
        { level: 2, href: 'secret.html', title: 'secret' },
        { level: 2, href: 'public.html', title: 'public' }
      ];

      const rolesByPath: RolesByPath = {
        'private/index.html': ['admin'],
        'private/secret.html': ['admin'],
        'private/public.html': []
      };

      const elasticClientMock = createElasticClientMock(rolesByPath);

      expect(
        await filterTocByUserRoles(
          elasticClientMock,
          toc,
          ['admin'],
          'private/index.html'
        )
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "href": "index.html",
            "level": 1,
            "title": "private",
          },
          Object {
            "href": "secret.html",
            "level": 2,
            "title": "secret",
          },
          Object {
            "href": "public.html",
            "level": 2,
            "title": "public",
          },
        ]
      `);
      expect(
        await filterTocByUserRoles(
          elasticClientMock,
          toc,
          [],
          'private/index.html'
        )
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "href": "public.html",
            "level": 2,
            "title": "public",
          },
        ]
      `);
    });
  });
});

function createElasticClientMock(rolesByPath: RolesByPath) {
  const elasticClientMock: ElasticRepository = {
    async getPathRoles(path: string) {
      path = path.startsWith('/') ? path.slice(1) : path;
      return rolesByPath[path];
    }
  } as any;
  return elasticClientMock;
}
