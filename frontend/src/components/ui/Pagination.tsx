import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../lib/cn'
import { pageRange, visiblePages } from '../../lib/pagination'
import { Button } from './Button'

type PaginationProps = {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  itemLabel: { one: string; other: string }
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  limit,
  totalItems,
  totalPages,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  const [first, last] = pageRange(page, limit, totalItems)
  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-500"
    >
      <p aria-live="polite">
        Mostrando {first}–{last} de {totalItems}{' '}
        {totalItems === 1 ? itemLabel.one : itemLabel.other}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
          Anterior
        </Button>
        {visiblePages(page, totalPages).map((link, index) =>
          link === 'gap' ? (
            <span key={`gap-${index}`} aria-hidden className="px-1">
              …
            </span>
          ) : (
            <Button
              key={link}
              variant={link === page ? 'outline' : 'ghost'}
              size="sm"
              aria-current={link === page ? 'page' : undefined}
              aria-label={`Página ${link}`}
              className={cn('min-w-8', link === page && 'text-zinc-950')}
              onClick={() => onPageChange(link)}
            >
              {link}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  )
}
