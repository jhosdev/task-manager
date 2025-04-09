import * as admin from 'firebase-admin';
import { Auth } from 'firebase-admin/auth';
import { env } from './environment';
import logger from '../shared/logger';
import { Firestore } from 'firebase-admin/firestore';



let serviceAccount: object;
let isFirebaseInitialized = false; 

try {
  // Use require for simplicity with JSON, or fs.readFileSync + JSON.parse
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  serviceAccount = require(env.GOOGLE_APPLICATION_CREDENTIALS);
  logger.info({ path: env.GOOGLE_APPLICATION_CREDENTIALS }, 'Service account credentials loaded successfully.');
} catch (error: any) {
  logger.fatal({ path: env.GOOGLE_APPLICATION_CREDENTIALS, error: error.message }, 'Failed to load Google Application Credentials JSON file.');
  throw new Error(`Could not load service account credentials from path: ${env.GOOGLE_APPLICATION_CREDENTIALS}. Error: ${error.message}`);
}

console.log('Service account credentials loaded successfully.');

export function initializeFirebaseAdmin() {
  console.log('Initializing Firebase Admin SDK');
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFirebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      logger.fatal({ error: error.message, stack: error.stack }, 'Firebase Admin SDK initialization failed.');
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  } else {
    logger.debug('Firebase Admin SDK already initialized.');
  }
}

function ensureInitialized(): void {
  if (!isFirebaseInitialized || !admin.apps.length) {
    console.log('Initializing Firebase Admin SDK');
    initializeFirebaseAdmin();
  }
}

export function getFirestoreDb(): Firestore {
  ensureInitialized();
  return admin.firestore();
}

export function getFirebaseAuth(): Auth {
  ensureInitialized();
  return admin.auth();
}

export const firebaseAdmin = admin;
export const SESSION_COOKIE_EXPIRES_IN = env.SESSION_COOKIE_EXPIRES_IN_MS;
