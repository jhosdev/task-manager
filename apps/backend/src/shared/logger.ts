import pino from 'pino';
import { env } from '../config';

let loggerInstance: pino.Logger | undefined;


export function initializeLogger(): void {
  if (loggerInstance) {
    return;
  }

  loggerInstance = pino({
    level: env.LOG_LEVEL || 'info',
    transport: env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    } : undefined,
  });

  loggerInstance.info('Logger initialized.');
}

/**
 * Gets the initialized logger instance.
 * Throws an error if the logger hasn't been initialized.
 * @returns {pino.Logger} The logger instance.
 */
function getLogger(): pino.Logger {
  if (!loggerInstance) {
    return pino({ level: 'error' });
  }
  return loggerInstance;
}

export default {
  get info() { return getLogger().info.bind(getLogger()); },
  get warn() { return getLogger().warn.bind(getLogger()); },
  get error() { return getLogger().error.bind(getLogger()); },
  get fatal() { return getLogger().fatal.bind(getLogger()); },
  get debug() { return getLogger().debug.bind(getLogger()); },
  get trace() { return getLogger().trace.bind(getLogger()); },
} as unknown as pino.Logger;

export { loggerInstance };
