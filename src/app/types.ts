/**
 * Central type exports for the Rules Management application
 */

// Re-export types from /src/types
export type { Rule } from '../types/rule';
export type { User, UserRole, AuthUser } from '../types/user';
export type { 
  RuleApproval, 
  ApprovalActionType, 
  ApprovalStatus 
} from '../types/approval';

// Additional application-specific types
export interface ProfileAlgorithmMapping {
  profile_name: string;
  algorithm: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
