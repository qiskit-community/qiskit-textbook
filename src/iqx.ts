import axios from 'axios';
import { config } from './config';
import { Role } from './Page';
import _ from 'lodash';
import memoized from 'memoizee';
import ms from 'ms';

export const getRolesForAccessToken = memoized(_getRolesForAccessToken, {
  maxAge: ms('10min'),
  preFetch: true,
  promise: true
});

async function _getRolesForAccessToken(accessToken: string) {
  const meResponse = await axios.request<MeResponse>({
    baseURL: config.iqx.auth_url,
    url: 'users/me',
    headers: getHeaders(accessToken)
  });

  const roles: Role[] = ['user'];

  if (meResponse.data.roles.includes('admin')) {
    roles.unshift('admin');
    return roles;
  }

  if (meResponse.data.ibmQNetwork) {
    const networkResponse = await axios.request<NetworkAllResponse>({
      baseURL: config.iqx.network_url,
      url: 'network/all',
      headers: getHeaders(accessToken)
    });

    const userId = meResponse.data.id;

    const groups = _.flatMap(networkResponse.data, hub => _.values(hub.groups));
    const isGroupAdmin = _.some(
      groups,
      group => group.users[userId].role === 'admin'
    );

    if (isGroupAdmin) {
      roles.unshift('group-admin');
    }

    const isHubAdmin = _.some(
      networkResponse.data,
      hub => hub.users[meResponse.data.id].role === 'admin'
    );
    if (isHubAdmin) {
      roles.unshift('hub-admin');
    }
  }

  return roles;
}

function getHeaders(accessToken: string) {
  return {
    'x-access-token': accessToken
  };
}

type MeResponse = {
  id: string;
  email: string;
  roles: string[];
  ibmQNetwork: boolean;
};

type NetworkAllResponse = Array<{
  users: Record<string, { role: string }>;
  groups: Record<
    string,
    {
      users: Record<string, { role: string }>;
    }
  >;
}>;
