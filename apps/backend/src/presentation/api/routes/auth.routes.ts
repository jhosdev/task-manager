import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { sessionLoginSchema, signUpSchema } from '../validators/auth.validators';

import { LoginUserUseCase } from '../../../core/application/user/use-cases/login-user.usecase';
import { CreateUserUseCase } from '../../../core/application/user/use-cases/create-user.usecase';
import { FirebaseUserRepository } from '../../../infrastructure/persistence/firebase/repositories/firebase-user.repository';
import { FirebaseAuthService } from '../../../infrastructure/auth/firebase-auth.service';
import { GetUserByEmailUseCase } from '../../../core/application/user/use-cases/get-user-by-email.usecase';

const userRepository = new FirebaseUserRepository();
const firebaseAuthService = new FirebaseAuthService();
const loginUserUseCase = new LoginUserUseCase(userRepository);
const createUserUseCase = new CreateUserUseCase(userRepository);
const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);
const authController = new AuthController(loginUserUseCase, createUserUseCase, firebaseAuthService, getUserByEmailUseCase);


const router: Router = Router();

// Public routes
router.post(
  '/session-login',
  validateRequest(sessionLoginSchema),
  (req, res) => authController.sessionLogin(req, res)
);

router.post(
  '/session-logout',
  (req, res) => authController.sessionLogout(req, res)
);

router.post(
  '/sign-up',
  validateRequest(signUpSchema),
  (req, res) => authController.signUp(req, res)
);

// Custom endpoint to get user by email
router.get(
  '/user-by-email/:email',
  (req, res) => authController.getUserByEmail(req, res)
);


// Protected routes
router.get(
  '/me',
  AuthMiddleware, // Apply authentication middleware
  (req, res) => authController.getMyProfile(req, res)
);

router.get(
  '/validate-session',
  AuthMiddleware,
  (req, res) => authController.validateSession(req, res)
);


export default router;