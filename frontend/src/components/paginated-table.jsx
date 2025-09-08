import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Contract: generic card + table + client-side pagination
// Props:
// - title: ReactNode
// - columns: Array<{ key: string, header: ReactNode }>
// - rows: Array<any>
// - renderRow: (row) => ReactNode (should return <TableRow>)
// - page: number, totalPages: number, onPageChange: (n) => void
// - footerExtra?: ReactNode
export default function PaginatedTable({ title, columns, rows, renderRow, page, totalPages, onPageChange, footerExtra }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className='py-8 text-center'>
                  <div className='text-muted-foreground'>No records found</div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => renderRow(row))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className='mt-4 flex justify-center'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  const showPage =
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= page - 1 && pageNumber <= page + 1);

                  if (!showPage) {
                    if (pageNumber === page - 2 || pageNumber === page + 2) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNumber)}
                        isActive={pageNumber === page}
                        className='cursor-pointer'
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        {footerExtra}
      </CardContent>
    </Card>
  );
}
