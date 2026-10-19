import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-zinc-600">O endereço não corresponde a nenhuma tela do sistema.</p>
      <Link to="/jogadores" className="mt-6 inline-block font-medium text-blue-600 hover:underline">
        Ir para Jogadores
      </Link>
    </section>
  )
}
