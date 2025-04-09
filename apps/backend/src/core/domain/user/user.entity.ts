import { randomUUID } from 'crypto';

export class User {
  public readonly id: string;
  public readonly email: string;
  public createdAt: Date;

  constructor(id: string | null, email: string, createdAt?: Date) {
    if (!email || !/\S+@\S+\.\S+/.test(email)) throw new Error('Invalid email format.');

    this.id = id || randomUUID();
    this.email = email;
    this.createdAt = createdAt || new Date();
  }

  public updateWithFirebaseAuth(createdAt: Date) {
    this.createdAt = createdAt;
  }
}