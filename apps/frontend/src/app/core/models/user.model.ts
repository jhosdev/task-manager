export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface SignUpResponse {
  customToken: string;
  user: User;
}