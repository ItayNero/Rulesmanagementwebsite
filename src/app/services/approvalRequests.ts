import type { Rule, ApprovalRequest } from '../types';

const APPROVAL_REQUESTS_KEY = 'approval_requests';

/**
 * Get all approval requests from localStorage
 */
export function getApprovalRequests(): ApprovalRequest[] {
  const stored = localStorage.getItem(APPROVAL_REQUESTS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save approval requests to localStorage
 */
function saveApprovalRequests(requests: ApprovalRequest[]): void {
  localStorage.setItem(APPROVAL_REQUESTS_KEY, JSON.stringify(requests));
}

/**
 * Create a new approval request
 */
export function createApprovalRequest(
  operation: 'create' | 'update' | 'delete',
  requestedBy: string,
  ruleData: Rule,
  originalData?: Rule
): ApprovalRequest {
  const requests = getApprovalRequests();
  
  const newRequest: ApprovalRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operation,
    requestedBy,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    ruleData,
    originalData,
  };
  
  requests.push(newRequest);
  saveApprovalRequests(requests);
  
  return newRequest;
}

/**
 * Get approval requests for a specific user
 */
export function getUserRequests(username: string): ApprovalRequest[] {
  const requests = getApprovalRequests();
  return requests.filter(req => req.requestedBy === username);
}

/**
 * Approve an approval request
 */
export function approveRequest(requestId: string, approvedBy: string): void {
  const requests = getApprovalRequests();
  const request = requests.find(req => req.id === requestId);
  
  if (!request) {
    throw new Error('Request not found');
  }
  
  request.status = 'approved';
  request.reviewedBy = approvedBy;
  request.reviewedAt = new Date().toISOString();
  
  saveApprovalRequests(requests);
}

/**
 * Reject an approval request
 */
export function rejectRequest(requestId: string, rejectedBy: string, rejectionReason?: string): void {
  const requests = getApprovalRequests();
  const request = requests.find(req => req.id === requestId);
  
  if (!request) {
    throw new Error('Request not found');
  }
  
  request.status = 'rejected';
  request.reviewedBy = rejectedBy;
  request.reviewedAt = new Date().toISOString();
  request.rejectionReason = rejectionReason;
  
  saveApprovalRequests(requests);
}

/**
 * Delete an approval request
 */
export function deleteApprovalRequest(requestId: string): void {
  const requests = getApprovalRequests();
  const filteredRequests = requests.filter(req => req.id !== requestId);
  saveApprovalRequests(filteredRequests);
}

/**
 * Get pending approval requests (for admins)
 */
export function getPendingRequests(): ApprovalRequest[] {
  const requests = getApprovalRequests();
  return requests.filter(req => req.status === 'pending');
}
