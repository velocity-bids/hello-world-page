import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { getAllVehiclesAdmin, getAllUsers, getReports, type AdminUser, type Report } from '@/db/queries';
import { updateVehicleApprovalStatus, updateReportStatus, setUserRole } from '@/db/mutations';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft, Users, Flag, Car, Shield, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TablePagination } from '@/components/common';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Vehicle } from '@/types';

type AdminVehicle = Vehicle & {
  admin_notes: string | null;
};

const PAGE_SIZE = 10;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState<AdminVehicle | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'decline' | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<string>('pending');
  
  // Pagination state
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [declinedPage, setDeclinedPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);

  // Fetch vehicles
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: async () => {
      const { data, error } = await getAllVehiclesAdmin();
      if (error) throw error;
      return data as AdminVehicle[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await getAllUsers();
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Fetch reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports', reportFilter],
    queryFn: async () => {
      const { data, error } = await getReports(reportFilter === 'all' ? undefined : reportFilter);
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({
      vehicleId,
      status,
      notes,
    }: {
      vehicleId: string;
      status: string;
      notes?: string;
    }) => {
      const { error } = await updateVehicleApprovalStatus(vehicleId, status, notes);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      toast.success('Vehicle status updated successfully');
      setDialogOpen(false);
      setSelectedVehicle(null);
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('Error updating vehicle:', error);
      toast.error('Failed to update vehicle status');
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
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

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes?: string }) => {
      const { error } = await updateReportStatus(reportId, status, notes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Report status updated');
    },
    onError: (error) => {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    },
  });

  const handleAction = (vehicle: AdminVehicle, action: 'approve' | 'decline') => {
    setSelectedVehicle(vehicle);
    setAdminNotes(vehicle.admin_notes || '');
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedVehicle || !dialogAction) return;

    updateVehicleMutation.mutate({
      vehicleId: selectedVehicle.id,
      status: dialogAction === 'approve' ? 'approved' : 'declined',
      notes: adminNotes,
    });
  };

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingVehicles = vehicles?.filter((v) => v.approval_status === 'pending') || [];
  const approvedVehicles = vehicles?.filter((v) => v.approval_status === 'approved') || [];
  const declinedVehicles = vehicles?.filter((v) => v.approval_status === 'declined') || [];

  const filteredUsers = useMemo(() => {
    const filtered = users?.filter((u) =>
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.user_id.toLowerCase().includes(userSearch.toLowerCase())
    ) || [];
    // Reset to page 1 when search changes
    return filtered;
  }, [users, userSearch]);

  // Paginated data helpers
  const paginateData = <T,>(data: T[], page: number): T[] => {
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  };

  const getTotalPages = (totalItems: number): number => Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Paginated lists
  const paginatedPending = paginateData<AdminVehicle>(pendingVehicles, pendingPage);
  const paginatedApproved = paginateData<AdminVehicle>(approvedVehicles, approvedPage);
  const paginatedDeclined = paginateData<AdminVehicle>(declinedVehicles, declinedPage);
  const paginatedUsers = paginateData<AdminUser>(filteredUsers, usersPage);
  const paginatedReports = paginateData<Report>(reports || [], reportsPage);

  const renderVehicleTable = (vehicleList: AdminVehicle[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Seller</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Mileage</TableHead>
          <TableHead>Reserve Price</TableHead>
          <TableHead>Submitted</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicleList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 7 : 6} className="text-center text-muted-foreground">
              No vehicles found
            </TableCell>
          </TableRow>
        ) : (
          vehicleList.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {vehicle.images?.[0] && (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="h-12 w-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <button
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                      className="font-medium text-primary hover:underline text-left"
                    >
                      {vehicle.make} {vehicle.model}
                    </button>
                    <div className="text-xs text-muted-foreground">ID: {vehicle.id.slice(0, 8)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <button
                  onClick={() => navigate(`/user/${vehicle.seller_id}`)}
                  className="text-sm text-primary hover:underline"
                >
                  View Profile
                </button>
              </TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.mileage.toLocaleString()} mi</TableCell>
              <TableCell>${vehicle.reserve_price?.toLocaleString()}</TableCell>
              <TableCell>{new Date(vehicle.created_at || '').toLocaleDateString()}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAction(vehicle, 'approve')}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(vehicle, 'decline')}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage listings, users, and reports</p>
        </div>

        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicles" className="gap-2">
              <Car className="h-4 w-4" />
              Vehicles
              <Badge variant="secondary">{pendingVehicles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
              <Badge variant="secondary">{users?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              Reports
              <Badge variant="secondary">{reports?.filter(r => r.status === 'pending').length || 0}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="mt-6">
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({pendingVehicles.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approved ({approvedVehicles.length})
                </TabsTrigger>
                <TabsTrigger value="declined" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Declined ({declinedVehicles.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>Review and approve or decline vehicle listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {vehiclesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {renderVehicleTable(paginatedPending, true)}
                        <TablePagination
                          currentPage={pendingPage}
                          totalPages={getTotalPages(pendingVehicles.length)}
                          totalItems={pendingVehicles.length}
                          pageSize={PAGE_SIZE}
                          onPageChange={setPendingPage}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Approved Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehiclesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {renderVehicleTable(paginatedApproved, false)}
                        <TablePagination
                          currentPage={approvedPage}
                          totalPages={getTotalPages(approvedVehicles.length)}
                          totalItems={approvedVehicles.length}
                          pageSize={PAGE_SIZE}
                          onPageChange={setApprovedPage}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="declined" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Declined Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehiclesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {renderVehicleTable(paginatedDeclined, false)}
                        <TablePagination
                          currentPage={declinedPage}
                          totalPages={getTotalPages(declinedVehicles.length)}
                          totalItems={declinedVehicles.length}
                          pageSize={PAGE_SIZE}
                          onPageChange={setDeclinedPage}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
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
                      onChange={(e) => setUserSearch(e.target.value)}
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
                          paginatedUsers.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={u.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {u.display_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <button
                                      onClick={() => navigate(`/user/${u.user_id}`)}
                                      className="font-medium text-primary hover:underline text-left"
                                    >
                                      {u.display_name || 'Anonymous'}
                                    </button>
                                    <div className="text-xs text-muted-foreground">
                                      {u.user_id.slice(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(u.member_since).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {u.verified ? (
                                  <Badge variant="default">Verified</Badge>
                                ) : (
                                  <Badge variant="secondary">Unverified</Badge>
                                )}
                              </TableCell>
                              <TableCell>{u.rating?.toFixed(1) || '-'}</TableCell>
                              <TableCell>{u.vehicles_sold || 0}</TableCell>
                              <TableCell>
                                <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                                  {u.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={u.role || 'user'}
                                  onValueChange={(role: 'admin' | 'user') => {
                                    updateUserRoleMutation.mutate({ userId: u.user_id, role });
                                  }}
                                  disabled={u.user_id === user?.id}
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
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reported Listings</CardTitle>
                    <CardDescription>Review reports from users</CardDescription>
                  </div>
                  <Select value={reportFilter} onValueChange={setReportFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle ID</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reported</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReports.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No reports found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedReports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>
                                <button
                                  onClick={() => navigate(`/vehicle/${report.vehicle_id}`)}
                                  className="font-medium text-primary hover:underline"
                                >
                                  {report.vehicle_id.slice(0, 8)}...
                                </button>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {report.reason}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {report.description || '-'}
                              </TableCell>
                              <TableCell>
                                {new Date(report.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    report.status === 'pending'
                                      ? 'secondary'
                                      : report.status === 'resolved'
                                      ? 'default'
                                      : 'outline'
                                  }
                                >
                                  {report.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {report.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() =>
                                        updateReportMutation.mutate({
                                          reportId: report.id,
                                          status: 'resolved',
                                        })
                                      }
                                    >
                                      Resolve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateReportMutation.mutate({
                                          reportId: report.id,
                                          status: 'dismissed',
                                        })
                                      }
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      currentPage={reportsPage}
                      totalPages={getTotalPages((reports || []).length)}
                      totalItems={(reports || []).length}
                      pageSize={PAGE_SIZE}
                      onPageChange={setReportsPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'approve' ? 'Approve' : 'Decline'} Vehicle Listing
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle && (
                <>
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes {dialogAction === 'decline' && '(Required)'}</Label>
              <Textarea
                id="notes"
                placeholder={
                  dialogAction === 'decline'
                    ? 'Please provide a reason for declining this listing...'
                    : 'Add any notes about this approval...'
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={dialogAction === 'approve' ? 'default' : 'destructive'}
              disabled={updateVehicleMutation.isPending || (dialogAction === 'decline' && !adminNotes.trim())}
            >
              {updateVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {dialogAction === 'approve' ? 'Approval' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
