import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { UserPlus, Trash2, Shield, User as UserIcon, AlertCircle } from 'lucide-react';
import { getAllUsers, createUser, deleteUser } from '../../services/userService';
import { toast } from 'sonner';
import type { User } from '../../types/user';

// ============================================================================
// TYPES
// ============================================================================

interface UsersManagementProps {
  currentUsername: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UsersManagement({ currentUsername }: UsersManagementProps) {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  }

  function handleOpenAddDialog() {
    setNewUsername('');
    setNewPassword('');
    setNewRole('editor');
    setError('');
    setIsAddDialogOpen(true);
  }

  function handleCloseAddDialog() {
    setIsAddDialogOpen(false);
    setError('');
  }

  async function handleAddUser() {
    setError('');

    // Validation
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }
    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!newPassword) {
      setError('Password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      createUser(newUsername.trim(), newPassword, newRole);
      toast.success(`User "${newUsername}" created successfully`);
      loadUsers();
      handleCloseAddDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
    }
  }

  function handleOpenDeleteDialog(username: string) {
    setSelectedUser(username);
    setIsDeleteDialogOpen(true);
  }

  function handleCloseDeleteDialog() {
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;

    try {
      deleteUser(selectedUser);
      toast.success(`User "${selectedUser}" deleted successfully`);
      loadUsers();
      handleCloseDeleteDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
      handleCloseDeleteDialog();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-sm">Username</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Role</th>
              <th className="text-left px-4 py-3 font-medium text-sm">Created At</th>
              <th className="text-right px-4 py-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.username} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{user.username}</span>
                      {user.username === currentUsername && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded">
                            Admin
                          </span>
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            Editor
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteDialog(user.username)}
                      disabled={user.username === currentUsername}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with username, password, and role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username (min 3 characters)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={(value: 'admin' | 'editor') => setNewRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newRole === 'admin' 
                  ? 'Admins can manage users and approve rule changes'
                  : 'Editors can create, edit, and delete rules (requires admin approval)'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAddDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{selectedUser}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}