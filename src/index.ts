import { startServer } from './server';
import { getLogger } from './logger';
import { ElasticClient } from './ElasticClient';
import { config } from './config';
import { ElasticRepository } from './ElasticRepository';
import { retry } from './retry';
import ms from 'ms';

const logger = getLogger('main');

async function main() {
  const client = new ElasticClient(config.elastic);
  const elasticRepository = new ElasticRepository(client);

  await client.waitForReady();

  if (config.liveReload) {
    logger.info('Synchronizing elastic search content');
    await elasticRepository.sync();
  }

  logger.info('Initializing server');
  await startServer(elasticRepository);

  if (!config.liveReload) {
    logger.info('Synchronizing elastic search content');

    try {
      await retry(() => elasticRepository.sync(), {
        maxRetries: 5,
        wait: ms('1m')
      });
    } catch (e) {
      logger.info('Error Synchronizing elastic search');
      logger.error(e);
    }
  }
}

main().catch(e => {
  logger.error(e);
  process.exit(1);
});
