import { User } from '../../../domain/user/user.entity';


export class UserDto {
  id: string;
  email: string;
  createdAt: string;

  constructor(id: string, email: string, createdAt: string) {
    this.id = id;
    this.email = email;
    this.createdAt = createdAt;
  }

  static fromEntity(user: User): UserDto {
    return new UserDto(user.id, user.email, user.createdAt.toISOString());
  }
}
