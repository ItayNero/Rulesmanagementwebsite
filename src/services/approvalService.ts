import { RuleApproval, ApprovalActionType } from '../types/approval';
import { Rule } from '../types/rule';

// ============================================================================
// CONSTANTS
// ============================================================================

const APPROVALS_STORAGE_KEY = 'rules_management_approvals';

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function getApprovals(): RuleApproval[] {
  try {
    const stored = localStorage.getItem(APPROVALS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load approvals:', error);
    return [];
  }
}

function saveApprovals(approvals: RuleApproval[]): void {
  localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(approvals));
}

// ============================================================================
// APPROVAL MANAGEMENT
// ============================================================================

export function createApprovalRequest(
  actionType: ApprovalActionType,
  requestedBy: string,
  rule: Rule,
  originalRule?: Rule
): RuleApproval {
  const approvals = getApprovals();
  
  const newApproval: RuleApproval = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    actionType,
    requestedBy,
    requestedAt: new Date().toISOString(),
    rule,
    originalRule,
    status: 'pending'
  };
  
  approvals.push(newApproval);
  saveApprovals(approvals);
  
  return newApproval;
}

export function getPendingApprovals(): RuleApproval[] {
  return getApprovals().filter(a => a.status === 'pending');
}

export function getAllApprovals(): RuleApproval[] {
  return getApprovals();
}

export function approveRequest(approvalId: string, reviewedBy: string): void {
  const approvals = getApprovals();
  const approval = approvals.find(a => a.id === approvalId);
  
  if (!approval) {
    throw new Error('Approval request not found');
  }
  
  approval.status = 'approved';
  approval.reviewedBy = reviewedBy;
  approval.reviewedAt = new Date().toISOString();
  
  saveApprovals(approvals);
}

export function rejectRequest(approvalId: string, reviewedBy: string, comments?: string): void {
  const approvals = getApprovals();
  const approval = approvals.find(a => a.id === approvalId);
  
  if (!approval) {
    throw new Error('Approval request not found');
  }
  
  approval.status = 'rejected';
  approval.reviewedBy = reviewedBy;
  approval.reviewedAt = new Date().toISOString();
  approval.reviewComments = comments;
  
  saveApprovals(approvals);
}

export function deleteApproval(approvalId: string): void {
  const approvals = getApprovals();
  const filtered = approvals.filter(a => a.id !== approvalId);
  saveApprovals(filtered);
}
