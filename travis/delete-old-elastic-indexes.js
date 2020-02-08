const _ = require('lodash');
const { loadProjectConfig } = require('@quantum/dploy/dist/ProjectConfig');
const { loadGlobalConfig } = require('@quantum/dploy/dist/GlobalConfig');
const { getDeletedReleases } = require('@quantum/dploy/dist/commands/down');

const github = require('@quantum/dploy/dist/lib/github');
const travis = require('@quantum/dploy/dist/lib/travis');
const environment = require('@quantum/dploy/dist/lib/environment');

const axios = require('axios').default;

async function main() {
  const cwd = process.cwd();
  const projectConfig = await loadProjectConfig(cwd);
  const globalConfig = await loadGlobalConfig();
  let deletedReleases = await getDeletedReleases(projectConfig, globalConfig, cwd);

  const gitHubToken = await github.getOrRequestGithubToken(globalConfig);
  const slug = await travis.getSlug(cwd);

  const envVars = await environment.getEnvVars(gitHubToken, slug);
  const ELASTIC_URL = envVars['ELASTIC_URL'];

  async function deleteIndex(index) {
    try {
      console.log(`Deleting index ${index}`);
      await axios({
        method: 'delete',
        baseURL: ELASTIC_URL,
        url: `/${index}`,
      });
      console.log(`Index ${index} deleted`);
    } catch (e) {
      if (_.get(e, 'response.status') === 404) {
        console.log(`Index ${index} not found`);
      } else {
        console.error(`Error deleting index ${index}`);
      }
    }
  }

  for (const release of deletedReleases) {
    await deleteIndex(`documentation-pr-${release}_pages`);
    await deleteIndex(`documentation-pr-${release}_static`);
    await deleteIndex(`documentation-pr-${release}_sections`);
    await deleteIndex(`documentation-pr-${release}_headings`);
  }
}

main().catch(e => console.error(e));
