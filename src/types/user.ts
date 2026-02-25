export type UserRole = 'admin' | 'editor';

export interface User {
  username: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthUser {
  username: string;
  role: UserRole;
}