import type { AuthUser } from '../types';

const USERS_STORAGE_KEY = 'rules_management_users';

// Default users
const defaultUsers: AuthUser[] = [
  { username: 'admin', role: 'admin' },
  { username: 'user1', role: 'user' },
  { username: 'user2', role: 'user' },
];

/**
 * Initialize users in localStorage if not present
 */
export function initializeUsers(): void {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }
}

/**
 * Get all users from localStorage
 */
export function getUsers(): AuthUser[] {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    initializeUsers();
    return defaultUsers;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return defaultUsers;
  }
}

/**
 * Save users to localStorage
 */
function saveUsers(users: AuthUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Authenticate a user (simple check - in production, use proper authentication)
 */
export function authenticateUser(username: string): AuthUser | null {
  const users = getUsers();
  return users.find(u => u.username === username) || null;
}

/**
 * Create a new user
 */
export function createUser(user: AuthUser): void {
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(u => u.username === user.username)) {
    throw new Error('User already exists');
  }
  
  users.push(user);
  saveUsers(users);
}

/**
 * Update a user's role
 */
export function updateUserRole(username: string, newRole: 'admin' | 'user'): void {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  user.role = newRole;
  saveUsers(users);
}

/**
 * Delete a user
 */
export function deleteUser(username: string): void {
  const users = getUsers();
  
  // Prevent deleting the last admin
  const admins = users.filter(u => u.role === 'admin');
  const userToDelete = users.find(u => u.username === username);
  
  if (userToDelete?.role === 'admin' && admins.length === 1) {
    throw new Error('Cannot delete the last admin user');
  }
  
  const filteredUsers = users.filter(u => u.username !== username);
  saveUsers(filteredUsers);
}