import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const getTotalPages = (totalItems: number) => Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

export function ReportsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportFilter, setReportFilter] = useState('pending');
  const [reportsPage, setReportsPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['admin-reports', reportFilter],
    queryFn: async () => {
      const { data, error } = await getReports(reportFilter === 'all' ? undefined : reportFilter);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes?: string }) => {
      const { error } = await updateReportStatus(reportId, status, notes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success(t('translation:admin.reportStatusUpdated'));
    },
    onError: (error) => {
      console.error('Error updating report:', error);
      toast.error(t('translation:admin.reportStatusFailed'));
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
      toast.success(t('translation:admin.vehicleDeleted'));
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting vehicle:', error);
      toast.error(t('translation:admin.vehicleDeleteFailed'));
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
    if (vehicleToDelete) deleteVehicleMutation.mutate(vehicleToDelete.id);
  };

  const paginatedReports = paginateData(reports, reportsPage);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('translation:admin.reportedListings')}</CardTitle>
              <CardDescription>{t('translation:admin.reviewReports')}</CardDescription>
            </div>
            <Select value={reportFilter} onValueChange={setReportFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('translation:admin.all')}</SelectItem>
                <SelectItem value="pending">{t('translation:admin.pending')}</SelectItem>
                <SelectItem value="reviewed">{t('translation:admin.reviewed')}</SelectItem>
                <SelectItem value="resolved">{t('translation:admin.resolved')}</SelectItem>
                <SelectItem value="dismissed">{t('translation:admin.dismissed')}</SelectItem>
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
                    <TableHead>{t('translation:admin.vehicleId')}</TableHead>
                    <TableHead>{t('translation:admin.reason')}</TableHead>
                    <TableHead>{t('translation:admin.reportDescription')}</TableHead>
                    <TableHead>{t('translation:admin.reported')}</TableHead>
                    <TableHead>{t('translation:admin.status')}</TableHead>
                    <TableHead>{t('translation:admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {t('translation:admin.noReportsFound')}
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
                        <TableCell className="max-w-[200px] truncate">{report.description || '-'}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
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
                            {t(`admin.${report.status}` as const)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {report.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => updateReportMutation.mutate({ reportId: report.id, status: 'resolved' })}
                                >
                                  {t('translation:admin.resolve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReportMutation.mutate({ reportId: report.id, status: 'dismissed' })}
                                >
                                  {t('translation:admin.dismiss')}
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteVehicle(report.vehicle_id, t('translation:admin.reportedListings'))}
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
            <DialogTitle>{t('translation:admin.deleteVehicle')}</DialogTitle>
            <DialogDescription>{t('translation:admin.deleteVehicleDescription')}</DialogDescription>
          </DialogHeader>
          {vehicleToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium">{vehicleToDelete.title}</p>
              <p className="text-xs text-muted-foreground">{t('translation:admin.idPrefix', { id: vehicleToDelete.id })}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('translation:common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteVehicleMutation.isPending}>
              {deleteVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('translation:admin.deleteVehicle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
