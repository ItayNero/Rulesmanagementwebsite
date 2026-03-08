import { useState, useEffect } from 'react';
import type { Rule } from '../../types/rule';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Search, Edit2, Trash2, ArrowUpDown, Filter, CheckCircle, XCircle, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { algoApi } from '../services/api';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLUMN_WIDTHS = {
  CHECKBOX: 'w-12',
  RULE_NAME: 'w-[200px]',
  ALGORITHM: 'w-[150px]',
  PRIORITY: 'w-[100px]',
  CUSTOMER: 'w-[120px]',
  ACTIVE: 'w-[80px]',
  CREATED: 'w-[120px]',
  MODIFIED: 'w-[120px]',
  ACTIONS: 'w-[80px]',
} as const;

const ANIMATION_DURATION_MS = 1000;

const PRIORITY_CONSTRAINTS = {
  MIN: 2,
  MAX: 10,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface RulesListProps {
  rules: Rule[];
  onToggleActive: (ruleName: string) => void;
  onUpdateRule: (rule: Rule) => void;
  onDelete: (ruleName: string) => void;
  onDeleteSelected: (ruleNames: string[]) => void;
  onActivateSelected: (ruleNames: string[]) => void;
  onDeactivateSelected: (ruleNames: string[]) => void;
}

type SortOrder = 'asc' | 'desc' | null;
type ActiveFilter = 'all' | 'active' | 'inactive';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RulesList({
  rules,
  onToggleActive,
  onUpdateRule,
  onDelete,
  onDeleteSelected,
  onActivateSelected,
  onDeactivateSelected,
}: RulesListProps) {
  
  // --------------------------------------------------------------------------
  // STATE - Search & Filter
  // --------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  
  // --------------------------------------------------------------------------
  // STATE - Selection
  // --------------------------------------------------------------------------
  const [selectedRuleNames, setSelectedRuleNames] = useState<Set<string>>(new Set());
  
  // --------------------------------------------------------------------------
  // STATE - Sorting
  // --------------------------------------------------------------------------
  const [prioritySortOrder, setPrioritySortOrder] = useState<SortOrder>(null);
  const [createdDateSortOrder, setCreatedDateSortOrder] = useState<SortOrder>(null);
  const [modifiedDateSortOrder, setModifiedDateSortOrder] = useState<SortOrder>(null);
  
  // --------------------------------------------------------------------------
  // STATE - Rule Details View/Edit
  // --------------------------------------------------------------------------
  const [selectedRuleForDetails, setSelectedRuleForDetails] = useState<Rule | null>(null);
  const [isInEditMode, setIsInEditMode] = useState(false);
  const [ruleBeingEdited, setRuleBeingEdited] = useState<Rule | null>(null);
  
  // --------------------------------------------------------------------------
  // STATE - Bulk Edit
  // --------------------------------------------------------------------------
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditFormData, setBulkEditFormData] = useState<Partial<Rule>>({});
  const [selectedBulkEditFields, setSelectedBulkEditFields] = useState<Set<string>>(new Set());
  
  // --------------------------------------------------------------------------
  // STATE - Delete Dialogs
  // --------------------------------------------------------------------------
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteSelectedDialogOpen, setIsDeleteSelectedDialogOpen] = useState(false);
  const [ruleNameToDelete, setRuleNameToDelete] = useState<string | null>(null);
  
  // --------------------------------------------------------------------------
  // STATE - Profile/Algorithm Mapping
  // --------------------------------------------------------------------------
  const [profileToAlgorithmMap, setProfileToAlgorithmMap] = useState<Record<string, string>>({});
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  
  // --------------------------------------------------------------------------
  // STATE - UI Feedback
  // --------------------------------------------------------------------------
  const [rulesWithPendingToggle, setRulesWithPendingToggle] = useState<Set<string>>(new Set());

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------
  
  useEffect(() => {
    loadProfileAlgorithmMappingData();
  }, []);

  async function loadProfileAlgorithmMappingData() {
    try {
      const [mapping, profiles] = await Promise.all([
        algoApi.getProfileAlgorithmMapping(),
        algoApi.getProfiles()
      ]);
      setProfileToAlgorithmMap(mapping);
      setAvailableProfiles(profiles);
    } catch (error) {
      console.error('Failed to load profile-algorithm mapping:', error);
    }
  }

  // --------------------------------------------------------------------------
  // COMPUTED VALUES - Filtered & Sorted Rules
  // --------------------------------------------------------------------------
  
  const filteredRules = filterRules(rules, searchTerm, activeFilter);
  const sortedAndFilteredRules = sortRules(
    filteredRules,
    prioritySortOrder,
    createdDateSortOrder,
    modifiedDateSortOrder
  );

  // --------------------------------------------------------------------------
  // SELECTION HANDLERS
  // --------------------------------------------------------------------------

  function handleSelectAllRules() {
    if (isAllVisibleRulesSelected()) {
      setSelectedRuleNames(new Set());
    } else {
      setSelectedRuleNames(new Set(sortedAndFilteredRules.map(rule => rule.rule_name)));
    }
  }

  function handleToggleRuleSelection(ruleName: string) {
    const updatedSelection = new Set(selectedRuleNames);
    if (updatedSelection.has(ruleName)) {
      updatedSelection.delete(ruleName);
    } else {
      updatedSelection.add(ruleName);
    }
    setSelectedRuleNames(updatedSelection);
  }

  function isAllVisibleRulesSelected(): boolean {
    return sortedAndFilteredRules.length > 0 && selectedRuleNames.size === sortedAndFilteredRules.length;
  }

  function clearSelection() {
    setSelectedRuleNames(new Set());
  }

  // --------------------------------------------------------------------------
  // SORTING HANDLERS
  // --------------------------------------------------------------------------

  function handleTogglePrioritySort() {
    setPrioritySortOrder(getNextSortOrder(prioritySortOrder));
    setCreatedDateSortOrder(null);
    setModifiedDateSortOrder(null);
  }

  function handleToggleCreatedDateSort() {
    setCreatedDateSortOrder(getNextSortOrder(createdDateSortOrder));
    setPrioritySortOrder(null);
    setModifiedDateSortOrder(null);
  }

  function handleToggleModifiedDateSort() {
    setModifiedDateSortOrder(getNextSortOrder(modifiedDateSortOrder));
    setPrioritySortOrder(null);
    setCreatedDateSortOrder(null);
  }

  // --------------------------------------------------------------------------
  // DELETE HANDLERS
  // --------------------------------------------------------------------------

  function handleOpenDeleteDialog(ruleName: string) {
    setRuleNameToDelete(ruleName);
    setIsDeleteDialogOpen(true);
  }

  function handleConfirmDeleteSingleRule() {
    if (ruleNameToDelete) {
      onDelete(ruleNameToDelete);
      setIsDeleteDialogOpen(false);
      setRuleNameToDelete(null);
    }
  }

  function handleOpenDeleteSelectedDialog() {
    setIsDeleteSelectedDialogOpen(true);
  }

  function handleConfirmDeleteSelectedRules() {
    onDeleteSelected(Array.from(selectedRuleNames));
    clearSelection();
    setIsDeleteSelectedDialogOpen(false);
  }

  // --------------------------------------------------------------------------
  // ACTIVATE/DEACTIVATE HANDLERS
  // --------------------------------------------------------------------------

  function handleActivateSelectedRules() {
    const selectedRuleNamesArray = Array.from(selectedRuleNames);
    
    markRulesAsPendingToggle(selectedRuleNamesArray);
    onActivateSelected(selectedRuleNamesArray);
    clearSelection();
    
    scheduleRemovalOfPendingToggleState(selectedRuleNamesArray);
  }

  function handleDeactivateSelectedRules() {
    const selectedRuleNamesArray = Array.from(selectedRuleNames);
    
    markRulesAsPendingToggle(selectedRuleNamesArray);
    onDeactivateSelected(selectedRuleNamesArray);
    clearSelection();
    
    scheduleRemovalOfPendingToggleState(selectedRuleNamesArray);
  }

  function handleToggleSingleRuleActive(ruleName: string) {
    markRulesAsPendingToggle([ruleName]);
    onToggleActive(ruleName);
    scheduleRemovalOfPendingToggleState([ruleName]);
  }

  function markRulesAsPendingToggle(ruleNames: string[]) {
    setRulesWithPendingToggle(prev => {
      const updated = new Set(prev);
      ruleNames.forEach(name => updated.add(name));
      return updated;
    });
  }

  function scheduleRemovalOfPendingToggleState(ruleNames: string[]) {
    setTimeout(() => {
      setRulesWithPendingToggle(prev => {
        const updated = new Set(prev);
        ruleNames.forEach(name => updated.delete(name));
        return updated;
      });
    }, ANIMATION_DURATION_MS);
  }

  // --------------------------------------------------------------------------
  // RULE DETAILS VIEW/EDIT HANDLERS
  // --------------------------------------------------------------------------

  function handleOpenRuleDetails(rule: Rule) {
    setSelectedRuleForDetails(rule);
    setIsInEditMode(false);
    setRuleBeingEdited(null);
  }

  function handleCloseRuleDetails() {
    setSelectedRuleForDetails(null);
    setIsInEditMode(false);
    setRuleBeingEdited(null);
  }

  function handleEnterEditMode() {
    setIsInEditMode(true);
    setRuleBeingEdited(selectedRuleForDetails);
  }

  function handleCancelEditMode() {
    setIsInEditMode(false);
    setRuleBeingEdited(null);
  }

  function handleSaveRuleChanges() {
    if (ruleBeingEdited) {
      onUpdateRule(ruleBeingEdited);
      handleCloseRuleDetails();
    }
  }

  function handleProfileChangeInEditMode(profileName: string) {
    const algorithmName = profileToAlgorithmMap[profileName] || '';
    setRuleBeingEdited(prev => prev ? {
      ...prev,
      profile_name: profileName,
      algorithm_name: algorithmName
    } : null);
  }

  function updateEditedRuleField<K extends keyof Rule>(field: K, value: Rule[K]) {
    setRuleBeingEdited(prev => prev ? { ...prev, [field]: value } : null);
  }

  // --------------------------------------------------------------------------
  // BULK EDIT HANDLERS
  // --------------------------------------------------------------------------

  function handleOpenBulkEditDialog() {
    setBulkEditFormData({});
    setSelectedBulkEditFields(new Set());
    setIsBulkEditDialogOpen(true);
  }

  function handleCloseBulkEditDialog() {
    setIsBulkEditDialogOpen(false);
    setBulkEditFormData({});
    setSelectedBulkEditFields(new Set());
  }

  function handleToggleBulkEditField(fieldName: string) {
    const updated = new Set(selectedBulkEditFields);
    if (updated.has(fieldName)) {
      updated.delete(fieldName);
    } else {
      updated.add(fieldName);
    }
    setSelectedBulkEditFields(updated);
  }

  function handleToggleProfileFields() {
    const updated = new Set(selectedBulkEditFields);
    const isCurrentlySelected = updated.has('profile_name');
    
    if (isCurrentlySelected) {
      updated.delete('profile_name');
      updated.delete('algorithm_name');
    } else {
      updated.add('profile_name');
      updated.add('algorithm_name');
    }
    
    setSelectedBulkEditFields(updated);
  }

  function handleBulkProfileChange(profileName: string) {
    const algorithmName = profileToAlgorithmMap[profileName] || '';
    setBulkEditFormData(prev => ({
      ...prev,
      profile_name: profileName,
      algorithm_name: algorithmName
    }));
  }

  function handleApplyBulkEdit() {
    const selectedRuleNamesArray = Array.from(selectedRuleNames);
    
    selectedRuleNamesArray.forEach(ruleName => {
      const rule = rules.find(r => r.rule_name === ruleName);
      if (rule) {
        const updatedRule = { ...rule };
        
        selectedBulkEditFields.forEach(fieldName => {
          if (fieldName in bulkEditFormData) {
            (updatedRule as any)[fieldName] = (bulkEditFormData as any)[fieldName];
          }
        });
        
        onUpdateRule(updatedRule);
      }
    });
    
    handleCloseBulkEditDialog();
    clearSelection();
  }

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <SearchAndFilterControls
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
      />
      
      {/* Bulk Actions Toolbar */}
      {selectedRuleNames.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedRuleNames.size}
          onActivate={handleActivateSelectedRules}
          onDeactivate={handleDeactivateSelectedRules}
          onEdit={handleOpenBulkEditDialog}
          onDelete={handleOpenDeleteSelectedDialog}
        />
      )}

      {/* Rules Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <RulesTableHeader
            isAllSelected={isAllVisibleRulesSelected()}
            hasRules={sortedAndFilteredRules.length > 0}
            onSelectAll={handleSelectAllRules}
            onTogglePrioritySort={handleTogglePrioritySort}
            onToggleCreatedSort={handleToggleCreatedDateSort}
            onToggleModifiedSort={handleToggleModifiedDateSort}
          />
          <TableBody>
            {sortedAndFilteredRules.length === 0 ? (
              <EmptyTableRow />
            ) : (
              sortedAndFilteredRules.map((rule) => (
                <RuleTableRow
                  key={rule.rule_name}
                  rule={rule}
                  isSelected={selectedRuleNames.has(rule.rule_name)}
                  isPendingToggle={rulesWithPendingToggle.has(rule.rule_name)}
                  onToggleSelection={handleToggleRuleSelection}
                  onToggleActive={handleToggleSingleRuleActive}
                  onViewDetails={handleOpenRuleDetails}
                  onDelete={handleOpenDeleteDialog}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Selected Dialog */}
      <DeleteSelectedRulesDialog
        isOpen={isDeleteSelectedDialogOpen}
        selectedCount={selectedRuleNames.size}
        onClose={() => setIsDeleteSelectedDialogOpen(false)}
        onConfirm={handleConfirmDeleteSelectedRules}
      />

      {/* Delete Single Rule Dialog */}
      <DeleteSingleRuleDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDeleteSingleRule}
      />

      {/* Rule Details/Edit Dialog */}
      <RuleDetailsDialog
        rule={selectedRuleForDetails}
        isEditMode={isInEditMode}
        editedRule={ruleBeingEdited}
        availableProfiles={availableProfiles}
        onClose={handleCloseRuleDetails}
        onEnterEditMode={handleEnterEditMode}
        onCancelEdit={handleCancelEditMode}
        onSave={handleSaveRuleChanges}
        onProfileChange={handleProfileChangeInEditMode}
        onFieldChange={updateEditedRuleField}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={isBulkEditDialogOpen}
        selectedCount={selectedRuleNames.size}
        formData={bulkEditFormData}
        selectedFields={selectedBulkEditFields}
        availableProfiles={availableProfiles}
        onClose={handleCloseBulkEditDialog}
        onToggleField={handleToggleBulkEditField}
        onToggleProfileFields={handleToggleProfileFields}
        onProfileChange={handleBulkProfileChange}
        onFormDataChange={setBulkEditFormData}
        onApply={handleApplyBulkEdit}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --------------------------------------------------------------------------
// Search & Filter Controls
// --------------------------------------------------------------------------

interface SearchAndFilterControlsProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  activeFilter: ActiveFilter;
  onActiveFilterChange: (filter: ActiveFilter) => void;
}

function SearchAndFilterControls({
  searchTerm,
  onSearchTermChange,
  activeFilter,
  onActiveFilterChange
}: SearchAndFilterControlsProps) {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by rule name, algorithm, customer, profile, or username..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={activeFilter} onValueChange={(value: ActiveFilter) => onActiveFilterChange(value)}>
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Rules</SelectItem>
          <SelectItem value="active">Active Only</SelectItem>
          <SelectItem value="inactive">Inactive Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// --------------------------------------------------------------------------
// Bulk Actions Toolbar
// --------------------------------------------------------------------------

interface BulkActionsToolbarProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BulkActionsToolbar({
  selectedCount,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete
}: BulkActionsToolbarProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onActivate}>
        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
        Activate Selected ({selectedCount})
      </Button>
      <Button variant="outline" onClick={onDeactivate}>
        <XCircle className="h-4 w-4 mr-2 text-red-600" />
        Deactivate Selected ({selectedCount})
      </Button>
      <Button variant="outline" onClick={onEdit}>
        <Edit2 className="h-4 w-4 mr-2" />
        Edit Selected ({selectedCount})
      </Button>
      <Button variant="destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Selected ({selectedCount})
      </Button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Table Header
// --------------------------------------------------------------------------

interface RulesTableHeaderProps {
  isAllSelected: boolean;
  hasRules: boolean;
  onSelectAll: () => void;
  onTogglePrioritySort: () => void;
  onToggleCreatedSort: () => void;
  onToggleModifiedSort: () => void;
}

function RulesTableHeader({
  isAllSelected,
  hasRules,
  onSelectAll,
  onTogglePrioritySort,
  onToggleCreatedSort,
  onToggleModifiedSort
}: RulesTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className={COLUMN_WIDTHS.CHECKBOX}>
          <Checkbox checked={hasRules && isAllSelected} onCheckedChange={onSelectAll} />
        </TableHead>
        <TableHead className={COLUMN_WIDTHS.RULE_NAME}>Rule Name</TableHead>
        <TableHead className={COLUMN_WIDTHS.ALGORITHM}>Algorithm</TableHead>
        <TableHead className={COLUMN_WIDTHS.PRIORITY}>
          <Button variant="ghost" size="sm" onClick={onTogglePrioritySort} className="h-8 px-2">
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className={COLUMN_WIDTHS.CUSTOMER}>Customer</TableHead>
        <TableHead className={COLUMN_WIDTHS.ACTIVE}>Active</TableHead>
        <TableHead className={COLUMN_WIDTHS.CREATED}>
          <Button variant="ghost" size="sm" onClick={onToggleCreatedSort} className="h-8 px-2">
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className={COLUMN_WIDTHS.MODIFIED}>
          <Button variant="ghost" size="sm" onClick={onToggleModifiedSort} className="h-8 px-2">
            Modified
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className={`text-right ${COLUMN_WIDTHS.ACTIONS}`}>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

// --------------------------------------------------------------------------
// Empty Table Row
// --------------------------------------------------------------------------

function EmptyTableRow() {
  return (
    <TableRow>
      <TableCell colSpan={9} className="text-center text-muted-foreground">
        No rules found
      </TableCell>
    </TableRow>
  );
}

// --------------------------------------------------------------------------
// Rule Table Row
// --------------------------------------------------------------------------

interface RuleTableRowProps {
  rule: Rule;
  isSelected: boolean;
  isPendingToggle: boolean;
  onToggleSelection: (ruleName: string) => void;
  onToggleActive: (ruleName: string) => void;
  onViewDetails: (rule: Rule) => void;
  onDelete: (ruleName: string) => void;
}

function RuleTableRow({
  rule,
  isSelected,
  isPendingToggle,
  onToggleSelection,
  onToggleActive,
  onViewDetails,
  onDelete
}: RuleTableRowProps) {
  const rowBackgroundClass = rule.is_active 
    ? 'bg-green-50 hover:bg-green-100' 
    : 'bg-red-50 hover:bg-red-100';
  
  const pendingClass = isPendingToggle ? 'animate-pulse opacity-60' : '';

  return (
    <TableRow className={`${rowBackgroundClass} ${pendingClass} cursor-pointer`}>
      {/* Checkbox */}
      <TableCell onClick={(e) => e.stopPropagation()} className={COLUMN_WIDTHS.CHECKBOX}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(rule.rule_name)}
        />
      </TableCell>

      {/* Rule Name */}
      <TableCell 
        className={`font-medium ${COLUMN_WIDTHS.RULE_NAME} max-w-[200px] truncate`}
        onClick={() => onViewDetails(rule)}
        title={rule.rule_name}
      >
        {rule.rule_name}
      </TableCell>

      {/* Algorithm */}
      <TableCell 
        className={`${COLUMN_WIDTHS.ALGORITHM} max-w-[150px] truncate`}
        onClick={() => onViewDetails(rule)}
        title={rule.algorithm_name}
      >
        {rule.algorithm_name}
      </TableCell>

      {/* Priority */}
      <TableCell onClick={() => onViewDetails(rule)} className={COLUMN_WIDTHS.PRIORITY}>
        <Badge variant="outline">{rule.priority}</Badge>
      </TableCell>

      {/* Customer */}
      <TableCell 
        className={`${COLUMN_WIDTHS.CUSTOMER} max-w-[120px] truncate`}
        onClick={() => onViewDetails(rule)}
        title={rule.customer || '-'}
      >
        {rule.customer || '-'}
      </TableCell>

      {/* Active Toggle */}
      <TableCell onClick={(e) => e.stopPropagation()} className={COLUMN_WIDTHS.ACTIVE}>
        <Switch
          checked={rule.is_active}
          onCheckedChange={() => onToggleActive(rule.rule_name)}
          disabled={isPendingToggle}
        />
      </TableCell>

      {/* Created Date */}
      <TableCell 
        className={`text-sm text-muted-foreground ${COLUMN_WIDTHS.CREATED} max-w-[120px]`}
        onClick={() => onViewDetails(rule)}
      >
        {formatDateTime(rule.creation_time)}
      </TableCell>

      {/* Modified Date */}
      <TableCell 
        className={`text-sm text-muted-foreground ${COLUMN_WIDTHS.MODIFIED} max-w-[120px]`}
        onClick={() => onViewDetails(rule)}
      >
        {formatDateTime(rule.update_time)}
      </TableCell>

      {/* Actions */}
      <TableCell className={`text-right ${COLUMN_WIDTHS.ACTIONS}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(rule.rule_name)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// --------------------------------------------------------------------------
// Delete Dialogs
// --------------------------------------------------------------------------

interface DeleteSelectedRulesDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteSelectedRulesDialog({
  isOpen,
  selectedCount,
  onClose,
  onConfirm
}: DeleteSelectedRulesDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Selected Rules</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedCount} selected rule{selectedCount !== 1 ? 's' : ''}? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete Selected
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteSingleRuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteSingleRuleDialog({ isOpen, onClose, onConfirm }: DeleteSingleRuleDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Rule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this rule? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete Rule
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --------------------------------------------------------------------------
// Rule Details Dialog
// --------------------------------------------------------------------------

interface RuleDetailsDialogProps {
  rule: Rule | null;
  isEditMode: boolean;
  editedRule: Rule | null;
  availableProfiles: string[];
  onClose: () => void;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onProfileChange: (profileName: string) => void;
  onFieldChange: <K extends keyof Rule>(field: K, value: Rule[K]) => void;
}

function RuleDetailsDialog({
  rule,
  isEditMode,
  editedRule,
  availableProfiles,
  onClose,
  onEnterEditMode,
  onCancelEdit,
  onSave,
  onProfileChange,
  onFieldChange
}: RuleDetailsDialogProps) {
  if (!rule) return null;

  return (
    <Dialog open={!!rule} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] !max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{isEditMode ? 'Edit Rule' : 'Rule Details'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? `Editing ${rule.rule_name}` : `Complete information about ${rule.rule_name}`}
              </DialogDescription>
            </div>
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={isEditMode ? onCancelEdit : onEnterEditMode}
            >
              {isEditMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Column - Rule Information */}
          <div className="overflow-y-auto pr-2">
            <RuleDetailsForm
              rule={rule}
              isEditMode={isEditMode}
              editedRule={editedRule}
              availableProfiles={availableProfiles}
              onProfileChange={onProfileChange}
              onFieldChange={onFieldChange}
            />
          </div>

          {/* Right Column - Map Viewer */}
          <RuleMapViewer />
        </div>
        
        {isEditMode && (
          <DialogFooter>
            <Button variant="default" onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Rule Details Form
// --------------------------------------------------------------------------

interface RuleDetailsFormProps {
  rule: Rule;
  isEditMode: boolean;
  editedRule: Rule | null;
  availableProfiles: string[];
  onProfileChange: (profileName: string) => void;
  onFieldChange: <K extends keyof Rule>(field: K, value: Rule[K]) => void;
}

function RuleDetailsForm({
  rule,
  isEditMode,
  editedRule,
  availableProfiles,
  onProfileChange,
  onFieldChange
}: RuleDetailsFormProps) {
  const displayRule = isEditMode && editedRule ? editedRule : rule;

  return (
    <div className="space-y-4">
      {/* Rule Name & Status */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Rule Name" value={displayRule.rule_name} />
        <div>
          <Label className="text-muted-foreground">Status</Label>
          <div className="mt-1">
            <Badge variant={displayRule.is_active ? "default" : "secondary"}>
              {displayRule.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Algorithm & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">
            Algorithm Name {isEditMode && '(Auto-set by Profile)'}
          </Label>
          {isEditMode ? (
            <Input
              value={displayRule.algorithm_name || ''}
              readOnly
              disabled
              className="mt-1 bg-gray-100"
              placeholder="Select a profile first"
            />
          ) : (
            <p className="font-medium mt-1">{displayRule.algorithm_name || '-'}</p>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground">Priority ({PRIORITY_CONSTRAINTS.MIN}-{PRIORITY_CONSTRAINTS.MAX})</Label>
          {isEditMode ? (
            <Input
              type="number"
              min={PRIORITY_CONSTRAINTS.MIN}
              max={PRIORITY_CONSTRAINTS.MAX}
              value={displayRule.priority || ''}
              onChange={(e) => onFieldChange('priority', parseInt(e.target.value))}
              className="mt-1"
            />
          ) : (
            <p className="font-medium mt-1">{displayRule.priority}</p>
          )}
        </div>
      </div>

      {/* Customer & Profile */}
      <div className="grid grid-cols-2 gap-4">
        <EditableFormField
          label="Customer"
          value={displayRule.customer || ''}
          isEditMode={isEditMode}
          onChange={(value) => onFieldChange('customer', value)}
        />
        <div>
          <Label className="text-muted-foreground">Profile Name</Label>
          {isEditMode ? (
            <Select value={displayRule.profile_name || ''} onValueChange={onProfileChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableProfiles.map(profile => (
                  <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="font-medium mt-1">{displayRule.profile_name || '-'}</p>
          )}
        </div>
      </div>

      {/* Username & Hebrew Rule Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Username (Cannot be changed)</Label>
          <Input
            value={displayRule.username || ''}
            readOnly
            disabled
            className="mt-1 bg-gray-100"
          />
        </div>
        <EditableFormField
          label="Hebrew Rule Name"
          value={displayRule.hebrew_rule_name || ''}
          isEditMode={isEditMode}
          onChange={(value) => onFieldChange('hebrew_rule_name', value)}
        />
      </div>

      {/* Minimum & Maximum Resolution */}
      <div className="grid grid-cols-2 gap-4">
        <EditableNumberField
          label="Minimum Resolution"
          value={displayRule.minimum_resolution}
          isEditMode={isEditMode}
          onChange={(value) => onFieldChange('minimum_resolution', value)}
        />
        <EditableNumberField
          label="Maximum Resolution"
          value={displayRule.maximum_resolution}
          isEditMode={isEditMode}
          onChange={(value) => onFieldChange('maximum_resolution', value)}
        />
      </div>

      {/* Location WKT */}
      <EditableFormField
        label="Location WKT"
        value={displayRule.location_wkt || ''}
        isEditMode={isEditMode}
        onChange={(value) => onFieldChange('location_wkt', value)}
        multiline
      />

      {/* Location GeoJSON */}
      <FormField
        label="Location GeoJSON"
        value={displayRule.location_geojson ? JSON.stringify(displayRule.location_geojson) : '-'}
        multiline
      />

      {/* Sensor & Color Types */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Sensor Types"
          value={displayRule.sensor_types?.length ? displayRule.sensor_types.join(', ') : '-'}
        />
        <FormField
          label="Color Types"
          value={displayRule.color_types?.length ? displayRule.color_types.join(', ') : '-'}
        />
      </div>

      {/* Sensor Names */}
      <FormField
        label="Sensor Names"
        value={displayRule.sensor_names ? JSON.stringify(displayRule.sensor_names) : '-'}
      />

      {/* Created & Modified Dates */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Created" value={formatDateTime(displayRule.creation_time)} />
        <FormField label="Modified" value={formatDateTime(displayRule.update_time)} />
      </div>

      {/* Additional Flags */}
      <RuleAdditionalFlags
        rule={displayRule}
        isEditMode={isEditMode}
        onFieldChange={onFieldChange}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// Form Fields
// --------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  value: string | number;
  multiline?: boolean;
}

function FormField({ label, value, multiline }: FormFieldProps) {
  const textClass = multiline ? 'text-sm break-all' : '';
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <p className={`font-medium mt-1 ${textClass}`}>{value}</p>
    </div>
  );
}

interface EditableFormFieldProps {
  label: string;
  value: string;
  isEditMode: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
}

function EditableFormField({ label, value, isEditMode, onChange, multiline }: EditableFormFieldProps) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      {isEditMode ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
        />
      ) : (
        <p className={`font-medium mt-1 ${multiline ? 'text-sm break-all' : ''}`}>{value || '-'}</p>
      )}
    </div>
  );
}

interface EditableNumberFieldProps {
  label: string;
  value?: number;
  isEditMode: boolean;
  onChange: (value: number) => void;
}

function EditableNumberField({ label, value, isEditMode, onChange }: EditableNumberFieldProps) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      {isEditMode ? (
        <Input
          type="number"
          min={0}
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? undefined : parseFloat(val));
          }}
          className="mt-1"
        />
      ) : (
        <p className="font-medium mt-1">{value ?? '-'}</p>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Rule Additional Flags
// --------------------------------------------------------------------------

interface RuleAdditionalFlagsProps {
  rule: Rule;
  isEditMode: boolean;
  onFieldChange: <K extends keyof Rule>(field: K, value: Rule[K]) => void;
}

function RuleAdditionalFlags({ rule, isEditMode, onFieldChange }: RuleAdditionalFlagsProps) {
  const flags = [
    { field: 'should_send_warmup_request' as const, label: 'Send Warmup Request' },
    { field: 'run_every_other_image' as const, label: 'Run Every Other Image' },
    { field: 'is_real_time' as const, label: 'Real Time' },
    { field: 'should_check_in_vip' as const, label: 'Check in VIP' },
    { field: 'is_photo_old' as const, label: 'Photo Old' },
  ];

  return (
    <div className="border-t pt-4">
      <Label className="text-muted-foreground mb-2 block">Additional Flags</Label>
      <div className="grid grid-cols-2 gap-2">
        {flags.map(({ field, label }) => (
          <div key={field} className="flex items-center gap-2">
            <Checkbox
              checked={rule[field] || false}
              onCheckedChange={(checked) => isEditMode && onFieldChange(field, checked as boolean)}
              disabled={!isEditMode}
            />
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Map Viewer
// --------------------------------------------------------------------------

function RuleMapViewer() {
  return (
    <div className="flex flex-col h-full">
      <Label className="text-muted-foreground mb-2 block">Map Viewer</Label>
      <div className="w-full flex-1 border rounded-lg overflow-hidden bg-gray-100">
        <iframe
          src="about:blank"
          title="Map Viewer"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Bulk Edit Dialog
// --------------------------------------------------------------------------

interface BulkEditDialogProps {
  isOpen: boolean;
  selectedCount: number;
  formData: Partial<Rule>;
  selectedFields: Set<string>;
  availableProfiles: string[];
  onClose: () => void;
  onToggleField: (fieldName: string) => void;
  onToggleProfileFields: () => void;
  onProfileChange: (profileName: string) => void;
  onFormDataChange: (data: Partial<Rule>) => void;
  onApply: () => void;
}

function BulkEditDialog({
  isOpen,
  selectedCount,
  formData,
  selectedFields,
  availableProfiles,
  onClose,
  onToggleField,
  onToggleProfileFields,
  onProfileChange,
  onFormDataChange,
  onApply
}: BulkEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] !max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Edit ({selectedCount} Rules Selected)</DialogTitle>
          <DialogDescription>
            Check the fields you want to update and set their values. Changes will apply to all selected rules.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto flex-1 pr-2">
          {/* Left Column - Form Fields */}
          <div className="space-y-4">
            {/* Priority Field */}
            <BulkEditField
              fieldName="priority"
              label={`Priority (${PRIORITY_CONSTRAINTS.MIN}-${PRIORITY_CONSTRAINTS.MAX})`}
              isSelected={selectedFields.has('priority')}
              onToggle={() => onToggleField('priority')}
            >
              <Input
                type="number"
                min={PRIORITY_CONSTRAINTS.MIN}
                max={PRIORITY_CONSTRAINTS.MAX}
                value={formData.priority ?? ''}
                onChange={(e) => onFormDataChange({ ...formData, priority: parseInt(e.target.value) })}
                disabled={!selectedFields.has('priority')}
                className={!selectedFields.has('priority') ? 'opacity-50' : ''}
              />
            </BulkEditField>

            {/* Profile + Algorithm Fields */}
            <BulkEditField
              fieldName="profile_name"
              label="Profile & Algorithm"
              isSelected={selectedFields.has('profile_name')}
              onToggle={onToggleProfileFields}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Profile Name</Label>
                  <Select
                    value={formData.profile_name || ''}
                    onValueChange={onProfileChange}
                    disabled={!selectedFields.has('profile_name')}
                  >
                    <SelectTrigger className={!selectedFields.has('profile_name') ? 'opacity-50' : ''}>
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfiles.map(profile => (
                        <SelectItem key={profile} value={profile}>{profile}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Algorithm (Auto-set)</Label>
                  <Input
                    value={formData.algorithm_name || ''}
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </BulkEditField>

            {/* Customer Field */}
            <BulkEditField
              fieldName="customer"
              label="Customer"
              isSelected={selectedFields.has('customer')}
              onToggle={() => onToggleField('customer')}
            >
              <Input
                value={formData.customer || ''}
                onChange={(e) => onFormDataChange({ ...formData, customer: e.target.value })}
                disabled={!selectedFields.has('customer')}
                className={!selectedFields.has('customer') ? 'opacity-50' : ''}
              />
            </BulkEditField>

            {/* Username Field */}
            <BulkEditField
              fieldName="username"
              label="Username"
              isSelected={selectedFields.has('username')}
              onToggle={() => onToggleField('username')}
            >
              <Input
                value={formData.username || ''}
                onChange={(e) => onFormDataChange({ ...formData, username: e.target.value })}
                disabled={!selectedFields.has('username')}
                className={!selectedFields.has('username') ? 'opacity-50' : ''}
              />
            </BulkEditField>

            {/* Minimum Resolution Field */}
            <BulkEditField
              fieldName="minimum_resolution"
              label="Minimum Resolution"
              isSelected={selectedFields.has('minimum_resolution')}
              onToggle={() => onToggleField('minimum_resolution')}
            >
              <Input
                type="number"
                min={0}
                value={formData.minimum_resolution ?? ''}
                onChange={(e) => onFormDataChange({ ...formData, minimum_resolution: parseFloat(e.target.value) })}
                disabled={!selectedFields.has('minimum_resolution')}
                className={!selectedFields.has('minimum_resolution') ? 'opacity-50' : ''}
              />
            </BulkEditField>

            {/* Maximum Resolution Field */}
            <BulkEditField
              fieldName="maximum_resolution"
              label="Maximum Resolution"
              isSelected={selectedFields.has('maximum_resolution')}
              onToggle={() => onToggleField('maximum_resolution')}
            >
              <Input
                type="number"
                min={0}
                value={formData.maximum_resolution ?? ''}
                onChange={(e) => onFormDataChange({ ...formData, maximum_resolution: parseFloat(e.target.value) })}
                disabled={!selectedFields.has('maximum_resolution')}
                className={!selectedFields.has('maximum_resolution') ? 'opacity-50' : ''}
              />
            </BulkEditField>

            {/* Location WKT Field */}
            <BulkEditField
              fieldName="location_wkt"
              label="Location WKT"
              isSelected={selectedFields.has('location_wkt')}
              onToggle={() => onToggleField('location_wkt')}
            >
              <Input
                value={formData.location_wkt || ''}
                onChange={(e) => onFormDataChange({ ...formData, location_wkt: e.target.value })}
                disabled={!selectedFields.has('location_wkt')}
                className={!selectedFields.has('location_wkt') ? 'opacity-50' : ''}
                placeholder="POLYGON((...))"
              />
            </BulkEditField>
          </div>

          {/* Right Column - Map Viewer */}
          <RuleMapViewer />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={onApply} disabled={selectedFields.size === 0}>
            <Save className="h-4 w-4 mr-2" />
            Apply to {selectedCount} Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Bulk Edit Field
// --------------------------------------------------------------------------

interface BulkEditFieldProps {
  fieldName: string;
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function BulkEditField({ label, isSelected, onToggle, children }: BulkEditFieldProps) {
  return (
    <div className="flex items-center gap-4">
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      <div className="flex-1">
        <Label>{label}</Label>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function filterRules(
  rules: Rule[],
  searchTerm: string,
  activeFilter: ActiveFilter
): Rule[] {
  return rules.filter(rule => {
    const matchesSearch = ruleMatchesSearchTerm(rule, searchTerm);
    const matchesFilter = ruleMatchesActiveFilter(rule, activeFilter);
    return matchesSearch && matchesFilter;
  });
}

function ruleMatchesSearchTerm(rule: Rule, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  const search = searchTerm.toLowerCase();
  const searchableFields = [
    rule.rule_name,
    rule.algorithm_name,
    rule.customer,
    rule.profile_name,
    rule.username,
  ];

  return searchableFields.some(field => 
    field?.toLowerCase().includes(search)
  );
}

function ruleMatchesActiveFilter(rule: Rule, filter: ActiveFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return rule.is_active;
  return !rule.is_active;
}

function sortRules(
  rules: Rule[],
  prioritySortOrder: SortOrder,
  createdSortOrder: SortOrder,
  modifiedSortOrder: SortOrder
): Rule[] {
  const sorted = [...rules];
  
  if (prioritySortOrder) {
    return sorted.sort((a, b) => 
      prioritySortOrder === 'asc' ? a.priority - b.priority : b.priority - a.priority
    );
  }
  
  if (createdSortOrder) {
    return sorted.sort((a, b) => {
      const dateA = a.creation_time ? new Date(a.creation_time).getTime() : 0;
      const dateB = b.creation_time ? new Date(b.creation_time).getTime() : 0;
      return createdSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }
  
  if (modifiedSortOrder) {
    return sorted.sort((a, b) => {
      const dateA = a.update_time ? new Date(a.update_time).getTime() : 0;
      const dateB = b.update_time ? new Date(b.update_time).getTime() : 0;
      return modifiedSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }
  
  return sorted;
}

function getNextSortOrder(current: SortOrder): SortOrder {
  if (current === null) return 'asc';
  if (current === 'asc') return 'desc';
  return null;
}

function formatDateTime(timestamp?: string): string | React.ReactNode {
  if (!timestamp) return '-';
  
  const date = new Date(timestamp);
  return (
    <>
      {date.toLocaleDateString()}<br />
      <span className="text-xs">{date.toLocaleTimeString()}</span>
    </>
  );
}