import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { TablePagination } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { updateVehicleApprovalStatus } from '@/db/mutations';
import { getAllVehiclesAdmin } from '@/db/queries';
import { getVehicleTitle } from '@/lib/utils';
import type { Vehicle } from '@/types';

type AdminVehicle = Vehicle & {
  admin_notes: string | null;
};

const PAGE_SIZE = 10;

const paginateData = <T,>(data: T[], page: number) => {
  const start = (page - 1) * PAGE_SIZE;
  return data.slice(start, start + PAGE_SIZE);
};

const getTotalPages = (totalItems: number) =>
  Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

export function VehiclesTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState<AdminVehicle | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'decline' | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [declinedPage, setDeclinedPage] = useState(1);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<AdminVehicle[]>({
    queryKey: ['admin-vehicles'],
    queryFn: async () => {
      const { data, error } = await getAllVehiclesAdmin();
      if (error) throw error;
      return (data ?? []) as AdminVehicle[];
    },
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

  const pendingVehicles = vehicles.filter((vehicle) => vehicle.approval_status === 'pending');
  const approvedVehicles = vehicles.filter((vehicle) => vehicle.approval_status === 'approved');
  const declinedVehicles = vehicles.filter((vehicle) => vehicle.approval_status === 'declined');

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
            <TableCell
              colSpan={showActions ? 7 : 6}
              className="text-center text-muted-foreground"
            >
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
                      alt={getVehicleTitle(vehicle)}
                      className="h-12 w-16 rounded object-cover"
                    />
                  )}
                  <div>
                    <button
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                      className="text-left font-medium text-primary hover:underline"
                    >
                      {getVehicleTitle(vehicle)}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      ID: {vehicle.id.slice(0, 8)}
                    </div>
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
              <TableCell>
                {new Date(vehicle.created_at || '').toLocaleDateString()}
              </TableCell>
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
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Vehicle Management</h2>
          {pendingVehicles.length > 0 && (
            <Badge variant="destructive">
              {pendingVehicles.length} Pending Review{pendingVehicles.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

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
                <CardDescription>
                  Review and approve or decline vehicle listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehiclesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {renderVehicleTable(paginateData(pendingVehicles, pendingPage), true)}
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
                    {renderVehicleTable(paginateData(approvedVehicles, approvedPage), false)}
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
                    {renderVehicleTable(paginateData(declinedVehicles, declinedPage), false)}
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
              <Label htmlFor="vehicle-admin-notes">
                Admin Notes {dialogAction === 'decline' && '(Required)'}
              </Label>
              <Textarea
                id="vehicle-admin-notes"
                placeholder={
                  dialogAction === 'decline'
                    ? 'Please provide a reason for declining this listing...'
                    : 'Add any notes about this approval...'
                }
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
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
              disabled={
                updateVehicleMutation.isPending ||
                (dialogAction === 'decline' && !adminNotes.trim())
              }
            >
              {updateVehicleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm {dialogAction === 'approve' ? 'Approval' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
