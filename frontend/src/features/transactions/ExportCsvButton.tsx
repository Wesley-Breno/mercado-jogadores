import { Download } from 'lucide-react'

import { exportTransactions } from '../../api/transactions'
import type { TransactionFilters } from '../../api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { useSingleAction } from '../../hooks/useSingleAction'
import { saveFile } from '../../lib/download'

const TYPE_NAMES = { COMPRA: 'Compra', VENDA: 'Venda' } as const

function describeFilters(filters: TransactionFilters, playerName: string | undefined): string {
  const applied = [
    filters.type?.length === 1 && `tipo ${TYPE_NAMES[filters.type[0]]}`,
    filters.player_id !== undefined && `jogador ${playerName ?? `nº ${filters.player_id}`}`,
  ].filter(Boolean)
  return applied.length ? `com o filtro de ${applied.join(' e ')} aplicado` : 'sem filtros'
}

type ExportCsvButtonProps = {
  clubId: string
  filters: TransactionFilters
  playerName: string | undefined
}

/** RN18: downloads the file returned by the API, asked with the filters of the screen. */
export function ExportCsvButton({ clubId, filters, playerName }: ExportCsvButtonProps) {
  const toast = useToast()
  const { run, isPending, error } = useSingleAction()
  const filename = `transacoes-clube-${clubId}.csv`

  function download() {
    run(
      () => exportTransactions(clubId, filters),
      (file) => {
        saveFile(file, filename)
        toast({
          title: 'CSV baixado',
          description: `${filename}, ${describeFilters(filters, playerName)}.`,
        })
      },
    )
  }

  return (
    <div className="grid justify-items-end gap-2">
      <Button onClick={download} disabled={isPending}>
        <Download aria-hidden />
        {isPending ? 'Exportando…' : 'Exportar CSV'}
      </Button>
      {error && <Alert>{error}</Alert>}
    </div>
  )
}
