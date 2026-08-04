import * as React from 'react';
import { ErrorLogService } from '@/lib/services/ErrorLogService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ErrorAnalyticsPage() {
  const [errors, stats] = await Promise.all([
    ErrorLogService.getRecentErrors(100),
    ErrorLogService.getErrorStats()
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracked Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalErrors.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent System Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Stack</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error: any) => {
                const meta = (error.metadata as any) || {};
                return (
                  <TableRow key={error.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(error.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{meta.context || 'Unknown'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={meta.message}>
                      {meta.message || 'No message'}
                    </TableCell>
                    <TableCell>
                      {meta.stack ? (
                        <details className="text-xs max-w-xs cursor-pointer">
                          <summary>View Stack</summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                            {meta.stack}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted-foreground text-xs">No stack trace</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {errors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No errors logged. System is healthy.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
