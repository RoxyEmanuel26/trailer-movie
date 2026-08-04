import * as React from 'react';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ActivityAnalyticsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const { total, data: activities } = await AnalyticsService.listAdminActivity(skip, limit);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity: any) => (
                <TableRow key={activity.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(activity.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {activity.user ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{activity.user.name}</span>
                        <span className="text-xs text-muted-foreground">{activity.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      activity.actionType === 'CREATE' ? 'default' :
                      activity.actionType === 'UPDATE' ? 'secondary' :
                      'destructive'
                    }>
                      {activity.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell>{activity.entityType}</TableCell>
                  <TableCell className="font-mono text-xs">{activity.entityId}</TableCell>
                </TableRow>
              ))}
              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {skip + 1} to Math.min(skip + limit, total) of {total} entries
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/admin/analytics/activity?page=${Math.max(1, page - 1)}`}
                  className={`px-3 py-1 text-sm border rounded-md ${page === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
                >
                  Previous
                </Link>
                <Link
                  href={`/admin/analytics/activity?page=${Math.min(totalPages, page + 1)}`}
                  className={`px-3 py-1 text-sm border rounded-md ${page === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-muted'}`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
