import { Role, Toc } from '../Page';
import _ from 'lodash';
import { RolesByPath } from '../RolesByPath';

export function getMergedPageRoles(mainToc: Toc, rolesByPath: RolesByPath) {
  const computedRoles = _.mapValues(rolesByPath, (roles, path) => {
    return pathRole(mainToc, rolesByPath, path);
  });
  return computedRoles;
}

function pathRole(
  mainToc: Toc,
  rolesByPath: RolesByPath,
  path: string
): Role[] {
  if (!rolesByPath[path]) {
    // Page does not exists
    return [];
  }

  const mainTocPathEntryIndex = mainToc.findIndex(
    tocEntry => tocEntry.href === `/${path}` || tocEntry.href === path
  );
  const mainTocPathEntry = mainToc[mainTocPathEntryIndex];

  if (!mainTocPathEntry) {
    return rolesByPath[path];
  }

  const prevTocEntries = mainToc.slice(0, mainTocPathEntryIndex);
  const previousLevels = _.range(1, mainTocPathEntry.level);

  const parentEntries = _.compact(
    _.map(previousLevels, parentLevel =>
      _.findLast(prevTocEntries, entry => entry.level === parentLevel)
    )
  );

  const parentPagesRoles = _.map(
    parentEntries,
    tocEntry => rolesByPath[tocEntry.href.substring(1)]
  );

  let hierarchyRoles = [rolesByPath[path], ...parentPagesRoles];

  hierarchyRoles = hierarchyRoles.filter(roles => roles.length > 0);

  return _.intersection(...hierarchyRoles);
}
