import { isNumber } from 'lodash';

const environment = getEnv('NODE_ENV', 'production');
const isDevEnvironment = environment === 'development';

export const config = {
  app: {
    port: getEnvNumber('PORT', 3000)
  },
  liveReload: isDevEnvironment,
  htmlPreview: true,
  roleSwitcher: isDevEnvironment,
  iqx: {
    auth_url: getEnv('IQX_AUTH_URL', 'https://auth-dev.quantum-computing.ibm.com/api'),
    network_url: getEnv('IQX_NETWORK_URL', 'https://api-qcon-dev.quantum-computing.ibm.com/api')
  },
  logger: {
    level: getEnv('LOG_LEVEL', 'info')
  },
  elastic: {
    url: getRequiredEnv('ELASTIC_URL'),
    index: getEnv('ELASTIC_INDEX', 'documentation')
  }
};

function getEnv(envVarName: string, defaultValue: string): string {
  return process.env[envVarName] || defaultValue;
}

function getEnvNumber(envVarName: string, defaultValue: number) {
  const value = process.env[envVarName];
  if (value === undefined) return defaultValue;
  const number = parseFloat(value);
  return isNumber(number) ? number : defaultValue;
}

function getRequiredEnv(envVarName: string): string {
  if (!process.env[envVarName]) {
    throw new Error(`Environment variable ${envVarName} not defined`);
  }
  return process.env[envVarName]!;
}
