import { Role } from './Page';

export const ROLES: Role[] = ['user', 'admin', 'hub-admin', 'group-admin'];

export function isValidRole(role: string): role is Role {
  return (ROLES as string[]).includes(role);
}
