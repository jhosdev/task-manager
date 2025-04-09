import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });
  console.log(`Loading .env file from: ${envPath}`);
} else {
    console.log('Running in production mode, skipping .env file loading.');
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000), // Coerce to number
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  CORS_ORIGIN: z.string().url().optional().default('http://localhost:4200'), // Make URL optional or provide a default
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1, 'GOOGLE_APPLICATION_CREDENTIALS path is required.'),
  SESSION_COOKIE_EXPIRES_IN_MS: z.coerce.number().int().positive('SESSION_COOKIE_EXPIRES_IN_MS must be a positive integer.'), // Coerce and validate
});

const parseResult = environmentSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables configuration.');
}

export const env = parseResult.data;

console.log('Environment variables loaded and validated successfully.');
console.log(`NODE_ENV: ${env.NODE_ENV}`);
console.log(`PORT: ${env.PORT}`);
console.log(`LOG_LEVEL: ${env.LOG_LEVEL}`);
console.log(`CORS_ORIGIN: ${env.CORS_ORIGIN}`);
console.log(`SESSION_COOKIE_EXPIRES_IN_MS: ${env.SESSION_COOKIE_EXPIRES_IN_MS}`);
