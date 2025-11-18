import { Suspense } from "react"
import PagamentoConfirmadoClient from "./PagamentoConfirmadoClient"

export default function PagamentoConfirmadoPage() {
  return (
    <Suspense fallback={<div>Carregando informações do pagamento...</div>}>
      <PagamentoConfirmadoClient />
    </Suspense>
  )
}
