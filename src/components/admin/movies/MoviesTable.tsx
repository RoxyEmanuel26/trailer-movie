"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import Image from "next/image"
import { Film, ChevronLeft, ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { MovieRowActions } from "./MovieRowActions"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"

interface MoviesTableProps {
  data: any[]
  total: number
  skip: number
  take: number
  onEdit: (movie: any) => void
}

export function MoviesTable({ data, total, skip, take, onEdit }: MoviesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        const posterUrl = row.original.posterUrl as string | null
        return (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-14 bg-muted rounded overflow-hidden flex items-center justify-center border">
              {posterUrl ? (
                <Image src={posterUrl} alt={title} width={40} height={56} className="object-cover w-full h-full" />
              ) : (
                <Film className="w-5 h-5 text-muted-foreground opacity-50" />
              )}
            </div>
            <div className="font-medium line-clamp-2">{title}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "releaseDate",
      header: "Release Date",
      cell: ({ row }) => {
        const val = row.getValue("releaseDate") as string
        return val ? format(new Date(val), "PP") : "N/A"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => format(new Date(row.getValue("createdAt")), "PP"),
    },
    {
      id: "actions",
      cell: ({ row }) => <MovieRowActions movie={row.original} onEdit={onEdit} />,
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const canPreviousPage = skip > 0
  const canNextPage = skip + take < total

  const goToPage = (newSkip: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("skip", newSkip.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No movies found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : skip + 1} to {Math.min(skip + take, total)} of {total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.max(0, skip - take))}
            disabled={!canPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(skip + take)}
            disabled={!canNextPage}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
