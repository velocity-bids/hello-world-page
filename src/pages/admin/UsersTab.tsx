import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { TablePagination } from '@/components/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { setUserRole } from '@/db/mutations';
import { getAllUsers, type AdminUser } from '@/db/queries';

const PAGE_SIZE = 10;

const paginateData = <T,>(data: T[], page: number) => {
  const start = (page - 1) * PAGE_SIZE;
  return data.slice(start, start + PAGE_SIZE);
};

const getTotalPages = (totalItems: number) =>
  Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

type UsersTabProps = {
  currentUserId?: string;
};

export function UsersTab({ currentUserId }: UsersTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await getAllUsers();
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'admin' | 'user';
    }) => {
      const { error } = await setUserRole(userId, role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    },
  });

  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.display_name?.toLowerCase().includes(search) ||
        user.user_id.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearch]);

  const paginatedUsers = paginateData(filteredUsers, usersPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View and manage user accounts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or ID..."
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <button
                              onClick={() => navigate(`/user/${user.user_id}`)}
                              className="text-left font-medium text-primary hover:underline"
                            >
                              {user.display_name || 'Anonymous'}
                            </button>
                            <div className="text-xs text-muted-foreground">
                              {user.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.member_since).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.verified ? (
                          <Badge variant="default">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.rating?.toFixed(1) || '-'}</TableCell>
                      <TableCell>{user.vehicles_sold || 0}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || 'user'}
                          onValueChange={(role) => {
                            updateUserRoleMutation.mutate({
                              userId: user.user_id,
                              role: role as 'admin' | 'user',
                            });
                          }}
                          disabled={user.user_id === currentUserId}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              currentPage={usersPage}
              totalPages={getTotalPages(filteredUsers.length)}
              totalItems={filteredUsers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setUsersPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
