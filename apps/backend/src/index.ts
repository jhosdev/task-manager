/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
// Import the createExpressApp function from your backend source
import { createExpressApp } from "./main";

// Create the Express app instance
const mainApp = createExpressApp();

// Export the Express app as an onRequest function
// Firebase Functions will handle starting the server and routing requests
logger.info('Starting Firebase Functions');
export const api = onRequest(mainApp);


// Example of another function (optional)
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });