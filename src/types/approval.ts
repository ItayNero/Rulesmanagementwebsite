import { Rule } from './rule';

export type ApprovalActionType = 'create' | 'update' | 'delete';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface RuleApproval {
  id: string;
  actionType: ApprovalActionType;
  requestedBy: string;
  requestedAt: string;
  rule: Rule;
  originalRule?: Rule; // For updates, this is the current state
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
}
