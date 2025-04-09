import "./firebase";
import "./environment";

export { env } from "./environment";
export { firebaseAdmin, getFirestoreDb, getFirebaseAuth, SESSION_COOKIE_EXPIRES_IN } from "./firebase";