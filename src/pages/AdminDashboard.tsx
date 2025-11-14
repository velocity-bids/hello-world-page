import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  current_bid: number;
  reserve_price: number;
  approval_status: string;
  admin_notes: string | null;
  created_at: string;
  images: string[];
  seller_id: string;
  description: string;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'decline' | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Vehicle[];
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
      const { error } = await supabase
        .from('vehicles')
        .update({
          approval_status: status,
          admin_notes: notes || null,
        })
        .eq('id', vehicleId);

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

  const handleAction = (vehicle: Vehicle, action: 'approve' | 'decline') => {
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

  const renderVehicleTable = (vehicleList: Vehicle[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
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
            <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground">
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
                    <div className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-muted-foreground">ID: {vehicle.id.slice(0, 8)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell>{vehicle.mileage.toLocaleString()} mi</TableCell>
              <TableCell>${vehicle.reserve_price?.toLocaleString()}</TableCell>
              <TableCell>{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
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
          <p className="mt-2 text-muted-foreground">Manage vehicle listing approvals</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary">{pendingVehicles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
              <Badge variant="secondary">{approvedVehicles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="declined" className="gap-2">
              <XCircle className="h-4 w-4" />
              Declined
              <Badge variant="secondary">{declinedVehicles.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve or decline vehicle listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderVehicleTable(pendingVehicles, true)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Approved Listings</CardTitle>
                <CardDescription>Successfully approved vehicle listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderVehicleTable(approvedVehicles, false)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="declined" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Declined Listings</CardTitle>
                <CardDescription>Vehicle listings that were not approved</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  renderVehicleTable(declinedVehicles, false)
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
