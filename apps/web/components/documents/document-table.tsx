"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type DocumentTableProps<TData extends { id: string }> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  selectable?: boolean
  emptyMessage?: string
  isLoading?: boolean
  onSelectionChange?: (rows: TData[]) => void
}

export function DocumentTable<TData extends { id: string }>({
  data,
  columns,
  selectable = false,
  emptyMessage = 'No documents found.',
  isLoading = false,
  onSelectionChange,
}: DocumentTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const selectionColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: 'select',
      header: ({ table }) => (
        <input
          aria-label="Select all rows"
          type="checkbox"
          className="h-4 w-4"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          aria-label={`Select row ${row.id}`}
          type="checkbox"
          className="h-4 w-4"
          checked={row.getIsSelected()}
          onChange={(event) => row.toggleSelected(event.target.checked)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    }),
    []
  )

  const finalColumns = useMemo(
    () => (selectable ? [selectionColumn, ...columns] : columns),
    [columns, selectable, selectionColumn]
  )

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  useEffect(() => {
    if (!onSelectionChange) return
    onSelectionChange(table.getSelectedRowModel().rows.map((row) => row.original))
  }, [onSelectionChange, rowSelection, table])

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-gray-500">Loading documents...</div>
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={finalColumns.length} className="h-24 text-center text-sm text-gray-500">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

