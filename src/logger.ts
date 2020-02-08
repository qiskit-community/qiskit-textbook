import { format, createLogger, transports } from 'winston';
import { config } from './config';

export const logger = createLogger({
  level: config.logger.level,
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.colorize(),
    format.simple()
  ),
  transports: [new transports.Console()]
});

export function getLogger(service: string, metadata = {}) {
  return logger.child({ service, ...metadata });
}
