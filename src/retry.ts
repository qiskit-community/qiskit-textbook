import { logger } from './logger';
import { wait } from './wait';

type RetryOptions = {
  maxRetries: number;
  wait?: number;
};

export async function retry(fn: () => Promise<any>, options: RetryOptions) {
  let retry = 0;
  while (retry < options.maxRetries) {
    try {
      const result = await fn();
      return result;
    } catch (e) {
      logger.error(e);
      retry += 1;
      logger.info(`Retrying ${retry} / ${options.maxRetries}`);

      if (options.wait && options.wait > 0) {
        await wait(options.wait);
      }
    }
  }
  throw new Error(`Process failed ${options.maxRetries} times`);
}
