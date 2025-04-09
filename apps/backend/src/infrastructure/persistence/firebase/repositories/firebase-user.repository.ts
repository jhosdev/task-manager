import { IUserRepository } from '../../../../core/domain/user/user.repository';
import { User } from '../../../../core/domain/user/user.entity';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

import { getFirebaseAuth } from '../../../../config/firebase';
//import { CollectionReference, DocumentData, Firestore } from 'firebase-admin/firestore';
import { Auth, FirebaseAuthError } from 'firebase-admin/auth';
/**
 * Firestore implementation of the IUserRepository interface.
 */
export class FirebaseUserRepository implements IUserRepository {
  //private readonly collectionRef: CollectionReference<DocumentData>;
  //private readonly db: Firestore;
  private readonly auth: Auth;
  private readonly logContext = { class: 'FirebaseUserRepository' };

  constructor() {
    //this.db = getFirestoreDb();
    this.auth = getFirebaseAuth();
    //this.collectionRef = this.db.collection('users');
  }

  async findById(id: string): Promise<User | null> {
    logger.debug({ ...this.logContext, method: 'findById', userId: id }, 'Finding user by ID...');
    try {
      const userRecord = await this.auth.getUser(id);
      if (!userRecord) {
        logger.debug({ ...this.logContext, method: 'findById', userId: id }, 'User not found.');
        return null;
      }
      const user = new User(userRecord.uid, userRecord.email ?? '', userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime) : undefined);
      logger.debug({ ...this.logContext, method: 'findById', userId: id }, 'User found.');
      return user;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'findById', userId: id }, 'Error finding user by ID.');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
     logger.debug({ ...this.logContext, method: 'findByEmail', email }, 'Finding user by email...');
    try {
        const userRecord = await this.auth.getUserByEmail(email);
        
        const user = new User(userRecord.uid, userRecord.email ?? '', userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime) : undefined);
        logger.debug({ ...this.logContext, method: 'findByEmail', email, userId: user.id }, 'User found.');
        return user;
    } catch (error) {
      if (error instanceof FirebaseAuthError && error.code === 'auth/user-not-found') {
        logger.debug({ ...this.logContext, method: 'findByEmail', email }, 'User not found.');
        return null;
      }
      handleAndThrowError(logger, error, { ...this.logContext, method: 'findByEmail', email }, 'Error finding user by email.');
    }
  }

  async save(user: User): Promise<User> {
    const userData = {
      email: user.email,
    };
    logger.debug({ ...this.logContext, method: 'save', userId: user.id, data: userData }, 'Saving user...');
    try {
      const userRecord = await this.auth.createUser({
        uid: user.id,
        email: user.email,
        password: user.email, //temporary password
      });
      logger.info({ ...this.logContext, method: 'save', userId: userRecord.uid }, 'User saved successfully in Auth.');

      // Optionally, save additional user data to Firestore if needed
      // await this.collectionRef.doc(user.id).set(userData);
      // logger.info({ ...this.logContext, method: 'save', userId: user.id }, 'User data saved successfully in Firestore.');
      

      user.updateWithFirebaseAuth(new Date(userRecord.metadata.creationTime));
      return user; // Return the updated user entity
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'save', userId: user.id }, 'Error saving user.');
    }
  }
}