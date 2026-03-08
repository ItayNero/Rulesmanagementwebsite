import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { CheckCircle, XCircle, Clock, Eye, FileText, FilePlus, FileEdit, Trash2 } from 'lucide-react';
import { getPendingApprovals, approveRequest, rejectRequest } from '../services/approvalRequests';
import { rulesApi } from '../services/api';
import { toast } from 'sonner';
import type { RuleApproval, Rule } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface ApprovalsManagementProps {
  currentUsername: string;
  onApprovalProcessed: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApprovalsManagement({ currentUsername, onApprovalProcessed }: ApprovalsManagementProps) {
  const [approvals, setApprovals] = useState<RuleApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<RuleApproval | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  function loadApprovals() {
    const pending = getPendingApprovals();
    // Sort by most recent first
    pending.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    setApprovals(pending);
  }

  function handleOpenDetails(approval: RuleApproval) {
    setSelectedApproval(approval);
    setIsDetailsDialogOpen(true);
  }

  function handleCloseDetails() {
    setIsDetailsDialogOpen(false);
    setSelectedApproval(null);
  }

  function handleOpenRejectDialog(approval: RuleApproval) {
    setSelectedApproval(approval);
    setIsRejectDialogOpen(true);
  }

  function handleCloseRejectDialog() {
    setIsRejectDialogOpen(false);
    setSelectedApproval(null);
  }

  async function handleApprove(approval: RuleApproval) {
    try {
      // Execute the actual action
      if (approval.actionType === 'create') {
        await rulesApi.createRule(approval.rule);
      } else if (approval.actionType === 'update') {
        await rulesApi.updateRule(approval.rule);
      } else if (approval.actionType === 'delete') {
        await rulesApi.deleteRule(approval.rule.rule_name);
      }

      // Mark as approved
      approveRequest(approval.id, currentUsername);
      
      toast.success(`${approval.actionType.charAt(0).toUpperCase() + approval.actionType.slice(1)} request approved`);
      loadApprovals();
      onApprovalProcessed();
    } catch (error) {
      toast.error(`Failed to approve ${approval.actionType} request`);
    }
  }

  async function handleReject() {
    if (!selectedApproval) return;

    try {
      rejectRequest(selectedApproval.id, currentUsername, '');
      toast.success('Request rejected');
      loadApprovals();
      handleCloseRejectDialog();
      onApprovalProcessed();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  }

  function getActionIcon(actionType: string) {
    switch (actionType) {
      case 'create': return <FilePlus className="h-4 w-4" />;
      case 'update': return <FileEdit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  }

  function getActionColor(actionType: string) {
    switch (actionType) {
      case 'create': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Pending Approvals</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve or reject rule change requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">{approvals.length}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center gap-2 mb-1">
            <FilePlus className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Create Requests</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {approvals.filter(a => a.actionType === 'create').length}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center gap-2 mb-1">
            <FileEdit className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Update Requests</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {approvals.filter(a => a.actionType === 'update').length}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">Delete Requests</span>
          </div>
          <div className="text-2xl font-bold text-red-900">
            {approvals.filter(a => a.actionType === 'delete').length}
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm">Action</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Rule Name</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Requested By</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Requested At</th>
              <th className="text-right px-4 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {approvals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No pending approval requests
                </td>
              </tr>
            ) : (
              approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Badge className={getActionColor(approval.actionType)}>
                      <span className="flex items-center gap-1">
                        {getActionIcon(approval.actionType)}
                        {approval.actionType.charAt(0).toUpperCase() + approval.actionType.slice(1)}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{approval.rule.rule_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{approval.requestedBy}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(approval.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetails(approval)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(approval)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleOpenRejectDialog(approval)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="!max-w-[95vw] !max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Approval Request Details</DialogTitle>
            <DialogDescription>
              Review the complete details of this {selectedApproval?.actionType} request
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {selectedApproval && (
              <div className="space-y-4">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Action Type</div>
                    <Badge className={getActionColor(selectedApproval.actionType)}>
                      {getActionIcon(selectedApproval.actionType)}
                      <span className="ml-1">
                        {selectedApproval.actionType.charAt(0).toUpperCase() + selectedApproval.actionType.slice(1)}
                      </span>
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Requested By</div>
                    <div className="font-medium">{selectedApproval.requestedBy}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Requested At</div>
                    <div className="font-medium">{new Date(selectedApproval.requestedAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>

                {/* Changes Summary - Only for Update Requests */}
                {selectedApproval.actionType === 'update' && selectedApproval.originalRule && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-900 mb-3">📝 Changes Summary</h3>
                    <ChangesSummary 
                      original={selectedApproval.originalRule} 
                      updated={selectedApproval.rule} 
                    />
                  </div>
                )}

                {/* Comprehensive Rule Details */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold mb-3">
                    {selectedApproval.actionType === 'update' ? 'New ' : ''}Rule Details
                  </h3>
                  
                  <RuleDetailsSection rule={selectedApproval.rule} />
                </div>

                {/* Original Rule (for updates) */}
                {selectedApproval.actionType === 'update' && selectedApproval.originalRule && (
                  <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                    <h3 className="font-semibold mb-3">Original Rule (Before Update)</h3>
                    <RuleDetailsSection rule={selectedApproval.originalRule} />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDetails}>
              Close
            </Button>
            {selectedApproval && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleCloseDetails();
                    handleOpenRejectDialog(selectedApproval);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleApprove(selectedApproval);
                    handleCloseDetails();
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this {selectedApproval?.actionType} request for rule "{selectedApproval?.rule.rule_name}"?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCloseRejectDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Yes, Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RuleDetailsSectionProps {
  rule: Rule;
}

function RuleDetailsSection({ rule }: RuleDetailsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Rule Name & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Rule Name</Label>
          <p className="font-medium mt-1">{rule.rule_name}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Status</Label>
          <div className="mt-1">
            <Badge variant={rule.is_active ? "default" : "secondary"}>
              {rule.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Algorithm & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Algorithm Name</Label>
          <p className="font-medium mt-1">{rule.algorithm_name || '-'}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Priority</Label>
          <p className="font-medium mt-1">{rule.priority}</p>
        </div>
      </div>

      {/* Customer & Profile */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Customer</Label>
          <p className="font-medium mt-1">{rule.customer || '-'}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Profile Name</Label>
          <p className="font-medium mt-1">{rule.profile_name || '-'}</p>
        </div>
      </div>

      {/* Username & Hebrew Rule Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Username</Label>
          <p className="font-medium mt-1">{rule.username || '-'}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Hebrew Rule Name</Label>
          <p className="font-medium mt-1">{rule.hebrew_rule_name || '-'}</p>
        </div>
      </div>

      {/* Minimum & Maximum Resolution */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Minimum Resolution</Label>
          <p className="font-medium mt-1">{rule.minimum_resolution ?? '-'}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Maximum Resolution</Label>
          <p className="font-medium mt-1">{rule.maximum_resolution ?? '-'}</p>
        </div>
      </div>

      {/* Location WKT */}
      <div>
        <Label className="text-muted-foreground">Location WKT</Label>
        <p className="font-medium mt-1 text-sm break-all">{rule.location_wkt || '-'}</p>
      </div>

      {/* Location GeoJSON */}
      <div>
        <Label className="text-muted-foreground">Location GeoJSON</Label>
        <p className="font-medium mt-1 text-sm break-all">
          {rule.location_geojson ? JSON.stringify(rule.location_geojson) : '-'}
        </p>
      </div>

      {/* Sensor & Color Types */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Sensor Types</Label>
          <p className="font-medium mt-1">{rule.sensor_types?.length ? rule.sensor_types.join(', ') : '-'}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Color Types</Label>
          <p className="font-medium mt-1">{rule.color_types?.length ? rule.color_types.join(', ') : '-'}</p>
        </div>
      </div>

      {/* Sensor Names */}
      <div>
        <Label className="text-muted-foreground">Sensor Names</Label>
        <p className="font-medium mt-1 text-sm break-all">
          {rule.sensor_names ? JSON.stringify(rule.sensor_names) : '-'}
        </p>
      </div>

      {/* Created & Modified Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Created</Label>
          <p className="font-medium mt-1">{formatDateTime(rule.creation_time)}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Modified</Label>
          <p className="font-medium mt-1">{formatDateTime(rule.update_time)}</p>
        </div>
      </div>

      {/* Additional Flags */}
      <div className="border-t pt-4">
        <Label className="text-muted-foreground mb-2 block">Additional Flags</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={rule.should_send_warmup_request || false} disabled />
            <span className="text-sm">Send Warmup Request</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={rule.run_every_other_image || false} disabled />
            <span className="text-sm">Run Every Other Image</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={rule.is_real_time || false} disabled />
            <span className="text-sm">Real Time</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={rule.should_check_in_vip || false} disabled />
            <span className="text-sm">Check in VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={rule.is_photo_old || false} disabled />
            <span className="text-sm">Photo Old</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDateTime(timestamp?: string): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

// ============================================================================
// Changes Summary Component
// ============================================================================

interface ChangesSummaryProps {
  original: Rule;
  updated: Rule;
}

function ChangesSummary({ original, updated }: ChangesSummaryProps) {
  const changes: { key: string, original: string, updated: string }[] = [];

  // Helper function to add changes
  function addChange(key: string, originalValue: any, updatedValue: any) {
    if (originalValue !== updatedValue) {
      changes.push({
        key,
        original: originalValue ? originalValue.toString() : '-',
        updated: updatedValue ? updatedValue.toString() : '-'
      });
    }
  }

  // Add changes for each field
  addChange('Rule Name', original.rule_name, updated.rule_name);
  addChange('Status', original.is_active ? 'Active' : 'Inactive', updated.is_active ? 'Active' : 'Inactive');
  addChange('Algorithm Name', original.algorithm_name, updated.algorithm_name);
  addChange('Priority', original.priority, updated.priority);
  addChange('Customer', original.customer, updated.customer);
  addChange('Profile Name', original.profile_name, updated.profile_name);
  addChange('Username', original.username, updated.username);
  addChange('Hebrew Rule Name', original.hebrew_rule_name, updated.hebrew_rule_name);
  addChange('Minimum Resolution', original.minimum_resolution, updated.minimum_resolution);
  addChange('Maximum Resolution', original.maximum_resolution, updated.maximum_resolution);
  addChange('Location WKT', original.location_wkt, updated.location_wkt);
  addChange('Location GeoJSON', JSON.stringify(original.location_geojson), JSON.stringify(updated.location_geojson));
  addChange('Sensor Types', original.sensor_types?.join(', '), updated.sensor_types?.join(', '));
  addChange('Color Types', original.color_types?.join(', '), updated.color_types?.join(', '));
  addChange('Sensor Names', JSON.stringify(original.sensor_names), JSON.stringify(updated.sensor_names));
  addChange('Created', formatDateTime(original.creation_time), formatDateTime(updated.creation_time));
  addChange('Modified', formatDateTime(original.update_time), formatDateTime(updated.update_time));
  addChange('Send Warmup Request', original.should_send_warmup_request ? 'Yes' : 'No', updated.should_send_warmup_request ? 'Yes' : 'No');
  addChange('Run Every Other Image', original.run_every_other_image ? 'Yes' : 'No', updated.run_every_other_image ? 'Yes' : 'No');
  addChange('Real Time', original.is_real_time ? 'Yes' : 'No', updated.is_real_time ? 'Yes' : 'No');
  addChange('Check in VIP', original.should_check_in_vip ? 'Yes' : 'No', updated.should_check_in_vip ? 'Yes' : 'No');
  addChange('Photo Old', original.is_photo_old ? 'Yes' : 'No', updated.is_photo_old ? 'Yes' : 'No');

  return (
    <div className="space-y-2">
      {changes.length === 0 ? (
        <p className="text-sm text-blue-800">No changes detected</p>
      ) : (
        changes.map((change, index) => (
          <div key={index} className="grid grid-cols-[150px_1fr_20px_1fr] gap-2 items-center">
            <div className="text-sm font-medium text-blue-900">{change.key}:</div>
            <div className="text-sm text-red-600 line-through truncate" title={change.original}>
              {change.original}
            </div>
            <div className="text-sm text-blue-700">→</div>
            <div className="text-sm text-green-600 font-medium truncate" title={change.updated}>
              {change.updated}
            </div>
          </div>
        ))
      )}
    </div>
  );
}