import * as React from 'react';
import { AnalyticsService } from '@/lib/services/AnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function SearchAnalyticsPage() {
  const data = await AnalyticsService.getSearchAnalytics();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Search Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topQueries.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.query}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
                {data.topQueries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No search data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zero-Result Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Queries that returned 0 results. These represent content gaps or missed keyword opportunities.
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.zeroResultQueries.map((query, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{query}</TableCell>
                  </TableRow>
                ))}
                {data.zeroResultQueries.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center text-muted-foreground">
                      No zero-result searches.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
