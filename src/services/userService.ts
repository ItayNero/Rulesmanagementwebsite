import { User, AuthUser } from '../types/user';

// ============================================================================
// CONSTANTS
// ============================================================================

const USERS_STORAGE_KEY = 'rules_management_users';
const USERS_VERSION_KEY = 'rules_management_users_version';
const CURRENT_VERSION = '4'; // Increment this to force reset

// Default users with different roles
const defaultUsers: User[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    username: 'user',
    password: 'user123',
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function getUsers(): User[] {
  try {
    const version = localStorage.getItem(USERS_VERSION_KEY);
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    
    // If version mismatch or no data, reset to defaults
    if (version !== CURRENT_VERSION || !stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
      localStorage.setItem(USERS_VERSION_KEY, CURRENT_VERSION);
      return defaultUsers;
    }
    
    const users = JSON.parse(stored);
    
    // Ensure default users exist
    let updated = false;
    for (const defaultUser of defaultUsers) {
      if (!users.some((u: User) => u.username === defaultUser.username)) {
        users.push(defaultUser);
        updated = true;
      }
    }
    
    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    
    return users;
  } catch (error) {
    console.error('Failed to load users:', error);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    localStorage.setItem(USERS_VERSION_KEY, CURRENT_VERSION);
    return defaultUsers;
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export function authenticateUser(username: string, password: string): AuthUser | null {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    return {
      username: user.username,
      role: user.role
    };
  }
  
  return null;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export function getAllUsers(): Omit<User, 'password'>[] {
  return getUsers().map(({ password, ...user }) => user);
}

export function createUser(username: string, password: string, role: 'admin' | 'user'): void {
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(u => u.username === username)) {
    throw new Error('User already exists');
  }
  
  const newUser: User = {
    username,
    password,
    role,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
}

export function deleteUser(username: string): void {
  const users = getUsers();
  
  // Prevent deleting the last admin
  const admins = users.filter(u => u.role === 'admin');
  if (admins.length === 1 && admins[0].username === username) {
    throw new Error('Cannot delete the last admin user');
  }
  
  const filteredUsers = users.filter(u => u.username !== username);
  saveUsers(filteredUsers);
}

export function updateUserPassword(username: string, newPassword: string): void {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.username === username);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].password = newPassword;
  saveUsers(users);
}