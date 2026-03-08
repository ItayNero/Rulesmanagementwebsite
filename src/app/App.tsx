import 'reflect-metadata';
import { useState, useEffect } from 'react';
import { Database, Plus, List, LogOut, Shield, Users, FileCheck, ClipboardList } from 'lucide-react';
import { loadConfig } from '../config/configLoader';
import { configService } from '../config/configService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { RulesList } from './components/RulesList';
import { RuleForm } from './components/RuleForm';
import { LoginPage } from './components/LoginPage';
import { UsersManagement } from './components/UsersManagement';
import { ApprovalsManagement } from './components/ApprovalsManagement';
import { MyRequests } from './components/MyRequests';
import { rulesApi } from './services/api';
import { createApprovalRequest } from './services/approvalRequests';
import type { Rule, AuthUser } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_STORAGE_KEY = 'rules_management_auth';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function App() {
  // --------------------------------------------------------------------------
  // STATE - Authentication
  // --------------------------------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // --------------------------------------------------------------------------
  // STATE - Rules Management
  // --------------------------------------------------------------------------
  const [rules, setRules] = useState<Rule[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------------------------------
  // STATE - Admin Section
  // --------------------------------------------------------------------------
  const [adminSubTab, setAdminSubTab] = useState('users');

  // --------------------------------------------------------------------------
  // STATE - Config Loading
  // --------------------------------------------------------------------------
  const [configLoaded, setConfigLoaded] = useState(false);

  // --------------------------------------------------------------------------
  // EFFECTS - Load configuration on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    loadConfig()
      .then(() => setConfigLoaded(true))
      .catch(error => {
        console.error('Failed to load configuration:', error);
        toast.error('Failed to load application configuration');
      });
  }, []);

  // --------------------------------------------------------------------------
  // EFFECTS - Check for existing authentication
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!configLoaded) return;
    
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const { username, role, timestamp } = JSON.parse(savedAuth);
        // Check if session is still valid (24 hours)
        const isSessionValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
        if (isSessionValid) {
          setCurrentUser({ username, role });
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [configLoaded]);

  // --------------------------------------------------------------------------
  // EFFECTS - Load rules when authenticated
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated) {
      loadRules();
    }
  }, [isAuthenticated]);

  // --------------------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // --------------------------------------------------------------------------
  function handleLoginSuccess(user: AuthUser) {
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      username: user.username,
      role: user.role,
      timestamp: Date.now()
    }));
    
    toast.success(`Welcome back, ${user.username}!`);
  }

  function handleLogout() {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    toast.success('Logged out successfully');
  }

  // --------------------------------------------------------------------------
  // RULES CRUD HANDLERS
  // --------------------------------------------------------------------------
  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await rulesApi.getAllRules();
      setRules(data);
    } catch (error) {
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  // Filter rules based on user role
  const getFilteredRules = () => {
    if (!currentUser) return [];
    
    // Admin can see all rules
    if (currentUser.role === 'admin') {
      return rules;
    }
    
    // Users can only see their own rules
    return rules.filter(rule => rule.username === currentUser.username);
  };

  const handleCreateRule = async (rule: Rule) => {
    try {
      if (!currentUser) return;
      
      // Create approval request instead of directly creating the rule
      createApprovalRequest('create', currentUser.username, rule);
      
      toast.success('Rule creation request submitted for approval');
      setActiveTab('requests');
    } catch (error) {
      toast.error('Failed to submit rule creation request');
    }
  };

  const handleUpdateRule = async (rule: Rule) => {
    try {
      if (!currentUser) return;
      
      // Find the original rule for comparison
      const originalRule = rules.find(r => r.rule_name === rule.rule_name);
      
      // Create approval request instead of directly updating the rule
      createApprovalRequest('update', currentUser.username, rule, originalRule);
      
      toast.success('Rule update request submitted for approval');
    } catch (error) {
      toast.error('Failed to submit rule update request');
    }
  };

  const handleDeleteRule = async (ruleName: string) => {
    try {
      if (!currentUser) return;
      
      // Find the rule to delete
      const ruleToDelete = rules.find(r => r.rule_name === ruleName);
      if (!ruleToDelete) return;
      
      // Create approval request instead of directly deleting the rule
      createApprovalRequest('delete', currentUser.username, ruleToDelete);
      
      toast.success('Rule deletion request submitted for approval');
    } catch (error) {
      toast.error('Failed to submit rule deletion request');
    }
  };

  const handleDeleteSelected = async (ruleNames: string[]) => {
    try {
      if (!currentUser) return;
      
      // Create deletion requests for each selected rule
      for (const ruleName of ruleNames) {
        const ruleToDelete = rules.find(r => r.rule_name === ruleName);
        if (ruleToDelete) {
          createApprovalRequest('delete', currentUser.username, ruleToDelete);
        }
      }
      
      toast.success(`${ruleNames.length} deletion request${ruleNames.length !== 1 ? 's' : ''} submitted for approval`);
    } catch (error) {
      toast.error('Failed to submit deletion requests');
    }
  };

  const handleActivateSelected = async (ruleNames: string[]) => {
    // Optimistic update
    setRules(prevRules => 
      prevRules.map(rule => 
        ruleNames.includes(rule.rule_name) && !rule.is_active
          ? { ...rule, is_active: true }
          : rule
      )
    );

    try {
      for (const ruleName of ruleNames) {
        const rule = rules.find(r => r.rule_name === ruleName);
        if (rule && !rule.is_active) {
          await rulesApi.toggleRuleActive(ruleName);
        }
      }
      toast.success(`${ruleNames.length} rule${ruleNames.length !== 1 ? 's' : ''} activated successfully`);
    } catch (error) {
      toast.error('Failed to activate selected rules');
      await loadRules(); // Reload on error to get correct state
    }
  };

  const handleDeactivateSelected = async (ruleNames: string[]) => {
    // Optimistic update
    setRules(prevRules => 
      prevRules.map(rule => 
        ruleNames.includes(rule.rule_name) && rule.is_active
          ? { ...rule, is_active: false }
          : rule
      )
    );

    try {
      for (const ruleName of ruleNames) {
        const rule = rules.find(r => r.rule_name === ruleName);
        if (rule && rule.is_active) {
          await rulesApi.toggleRuleActive(ruleName);
        }
      }
      toast.success(`${ruleNames.length} rule${ruleNames.length !== 1 ? 's' : ''} deactivated successfully`);
    } catch (error) {
      toast.error('Failed to deactivate selected rules');
      await loadRules(); // Reload on error to get correct state
    }
  };

  const handleToggleActive = async (ruleName: string) => {
    // Optimistic update
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.rule_name === ruleName 
          ? { ...rule, is_active: !rule.is_active }
          : rule
      )
    );

    try {
      await rulesApi.toggleRuleActive(ruleName);
      toast.success('Rule status updated');
    } catch (error) {
      // Revert on error
      setRules(prevRules => 
        prevRules.map(rule => 
          rule.rule_name === ruleName 
            ? { ...rule, is_active: !rule.is_active }
            : rule
        )
      );
      toast.error('Failed to update rule status');
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header with Logout */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  <h1 className="text-3xl">Rules Management</h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    Welcome, <span className="font-medium text-gray-900">{currentUser?.username}</span>
                    {currentUser?.role === 'admin' && (
                      <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {currentUser?.role === 'user' && (
                      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                        <Users className="h-3 w-3 mr-1" />
                        User
                      </Badge>
                    )}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground">
                Manage Elasticsearch rules - Create, view, update, and delete rules
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  View All
                </TabsTrigger>
                <TabsTrigger value="create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  My Requests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Rules</CardTitle>
                    <CardDescription>
                      View and manage all rules. Toggle active status, edit, or delete rules.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : (
                      <RulesList
                        rules={getFilteredRules()}
                        onToggleActive={handleToggleActive}
                        onUpdateRule={handleUpdateRule}
                        onDelete={handleDeleteRule}
                        onDeleteSelected={handleDeleteSelected}
                        onActivateSelected={handleActivateSelected}
                        onDeactivateSelected={handleDeactivateSelected}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="create" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                  {/* Form Card - Takes more space (60%) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Rule</CardTitle>
                      <CardDescription>
                        Fill in the form below to create a new rule. Priority must be between 2 and 10.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RuleForm
                        onSubmit={handleCreateRule}
                        onCancel={() => setActiveTab('list')}
                        currentUsername={currentUser?.username}
                      />
                    </CardContent>
                  </Card>

                  {/* Map Viewer Card - Takes less space (40%) */}
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Map Viewer</CardTitle>
                      <CardDescription>
                        Interactive map for rule location context
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-5rem)]">
                      <div className="w-full h-full border rounded-lg overflow-hidden bg-gray-100">
                        <iframe
                          src={configService.getMapViewerIframeUrl()}
                          title="Map Viewer"
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="requests" className="mt-6">
                <MyRequests currentUsername={currentUser?.username || ''} />
              </TabsContent>
            </Tabs>

            {/* Admin Section */}
            {currentUser?.role === 'admin' && (
              <div className="mt-10">
                <Tabs value={adminSubTab} onValueChange={setAdminSubTab}>
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="users">
                      <Users className="h-4 w-4 mr-2" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="approvals">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Approvals
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="users" className="mt-6">
                    <UsersManagement currentUsername={currentUser?.username || ''} />
                  </TabsContent>

                  <TabsContent value="approvals" className="mt-6">
                    <ApprovalsManagement 
                      currentUsername={currentUser?.username || ''}
                      onApprovalProcessed={loadRules}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      )}
      <Toaster />
    </>
  );
}