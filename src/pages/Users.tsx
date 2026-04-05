import { useState } from 'react';
import { Search, MoreHorizontal, Edit, Shield, UserCog } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/data/mockData';
import { UserRoleModal } from '@/components/modals/FormModals';
import { User, UserRole } from '@/types';
import { Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  const filtered = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = (userId: string, role: UserRole) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role } : user
    ));
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super-admin':
        return <Shield className="w-3 h-3" />;
      case 'admin':
        return <UserCog className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Users"
        description={isSuperAdmin ? "Manage platform users and their roles" : "View platform users"}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super-admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <DataTableWrapper>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-8 h-8 text-muted-foreground" />}
            title="No users found"
            description="No users match your search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'super-admin' ? 'default' : user.role === 'admin' ? 'info' : 'secondary'}
                      className="capitalize gap-1"
                    >
                      {getRoleIcon(user.role)}
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status as any} className="capitalize">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setRoleModal({ open: true, user })}>
                            <Edit className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      {/* Role Modal */}
      {roleModal.user && (
        <UserRoleModal
          open={roleModal.open}
          onOpenChange={(open) => setRoleModal({ ...roleModal, open })}
          userId={roleModal.user.id}
          userName={roleModal.user.name}
          currentRole={roleModal.user.role}
          onSave={handleRoleChange}
        />
      )}
    </DashboardLayout>
  );
}
