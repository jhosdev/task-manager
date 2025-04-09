import { env } from './config';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import logger, { initializeLogger, loggerInstance } from './shared/logger';
import { authRoutes, taskRoutes } from './presentation/api/routes';
import { initializeFirebaseAdmin } from './config/firebase';

async function bootstrap() {
  initializeLogger();
  console.log('Initializing Firebase Admin SDK');
  initializeFirebaseAdmin();
  const app = express();
  const port = env.PORT;


  app.use(helmet());

  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger: loggerInstance }));

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  // --- Global Error Handler ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Log the error with context
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        statusCode: err.statusCode
    }, 'Unhandled error occurred.');

    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    // Use validated NODE_ENV
    const message = env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred'; // Provide a default message

    // Avoid sending stack trace in production response
    res.status(statusCode).json({ message });
  });

  // --- Start Server ---
  const server = app.listen(port, () => {
    logger.info(`🚀 Backend service listening on port ${port}`);
  });

  // --- Graceful Shutdown ---
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info(`${signal} signal received: closing HTTP server`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  });

}

bootstrap().catch(err => {
  logger.fatal({ error: err.message, stack: err.stack }, 'Failed to bootstrap application');
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});