import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { ErrorState } from './States'

export type Column<Row> = {
  key: string
  header: ReactNode
  cell: (row: Row) => ReactNode
  align?: 'left' | 'right'
}

type DataTableProps<Row> = {
  label: string
  columns: Column<Row>[]
  rows: Row[] | undefined
  rowKey: (row: Row) => string | number
  isUpdating?: boolean
  error: Error | null
  errorTitle?: string
  onRetry?: () => void
  empty: ReactNode
}

const SKELETON_ROWS = 5

/**
 * The table of every list screen, with the loading, empty and error states built in.
 * Without rows yet it shows a skeleton; while new rows load, the old ones stay dimmed.
 */
export function DataTable<Row>({
  label,
  columns,
  rows,
  rowKey,
  isUpdating = false,
  error,
  errorTitle,
  onRetry,
  empty,
}: DataTableProps<Row>) {
  if (error) {
    return <ErrorState title={errorTitle} message={error.message} onRetry={onRetry} />
  }
  if (rows?.length === 0 && !isUpdating) {
    return empty
  }
  const isLoading = rows === undefined
  return (
    <div className="relative overflow-x-auto">
      <table
        aria-label={label}
        aria-busy={isLoading || isUpdating}
        className={cn('w-full text-sm transition-opacity', isUpdating && 'opacity-60')}
      >
        <thead className="border-y border-zinc-200 bg-zinc-50 text-left text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-3 py-2.5 align-bottom font-medium first:pl-4 last:pr-4',
                  column.align === 'right' && 'text-right',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {isLoading
            ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-4 first:pl-4 last:pr-4">
                      <span className="block h-4 min-w-8 animate-pulse rounded bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-zinc-50/70">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-3 py-2.5 whitespace-nowrap tabular-nums first:pl-4 last:pr-4',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {isLoading && (
        <p role="status" className="sr-only">
          Carregando…
        </p>
      )}
    </div>
  )
}
