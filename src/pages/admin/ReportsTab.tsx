import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { TablePagination } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteVehicleAdmin, updateReportStatus } from '@/db/mutations';
import { getReports, type Report } from '@/db/queries';

const PAGE_SIZE = 10;

const paginateData = <T,>(data: T[], page: number) => {
  const start = (page - 1) * PAGE_SIZE;
  return data.slice(start, start + PAGE_SIZE);
};

const getTotalPages = (totalItems: number) =>
  Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

export function ReportsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportFilter, setReportFilter] = useState('pending');
  const [reportsPage, setReportsPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; title: string } | null>(
    null
  );

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['admin-reports', reportFilter],
    queryFn: async () => {
      const { data, error } = await getReports(reportFilter === 'all' ? undefined : reportFilter);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      notes,
    }: {
      reportId: string;
      status: string;
      notes?: string;
    }) => {
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

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await deleteVehicleAdmin(vehicleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Vehicle deleted successfully');
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    },
  });

  useEffect(() => {
    setReportsPage(1);
  }, [reportFilter]);

  const handleDeleteVehicle = (vehicleId: string, vehicleTitle: string) => {
    setVehicleToDelete({ id: vehicleId, title: vehicleTitle });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (vehicleToDelete) {
      deleteVehicleMutation.mutate(vehicleToDelete.id);
    }
  };

  const paginatedReports = paginateData(reports, reportsPage);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
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
                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
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
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteVehicle(report.vehicle_id, 'Reported Vehicle')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={reportsPage}
                totalPages={getTotalPages(reports.length)}
                totalItems={reports.length}
                pageSize={PAGE_SIZE}
                onPageChange={setReportsPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be undone and will remove all associated bids and reports.
            </DialogDescription>
          </DialogHeader>
          {vehicleToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium">{vehicleToDelete.title}</p>
              <p className="text-xs text-muted-foreground">ID: {vehicleToDelete.id}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteVehicleMutation.isPending}
            >
              {deleteVehicleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
