// app/pagamento-confirmado/PagamentoConfirmadoClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material"
import { formatBRL } from "@/app/lib/formatCurrency"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

type Props = {
  orderIdFromSearch?: string
}

type OrderDTO = {
  id: string
  amount: number       // em REAIS (a gente salvou amountInCents/100 na ordem)
  quantity?: number    // a API de /api/orders deve devolver isso
  createdAt?: string
}

export default function PagamentoConfirmadoClient({
  orderIdFromSearch,
}: Props) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrder() {
      try {
        // 1) Decide qual orderId usar
        let finalOrderId = orderIdFromSearch || null

        if (!finalOrderId && typeof window !== "undefined") {
          finalOrderId =
            localStorage.getItem("lastPaidOrderId") ||
            localStorage.getItem("lastOrderId")
        }

        if (!finalOrderId) {
          setError("Não encontramos os dados do seu pedido.")
          setLoading(false)
          return
        }

        // guarda o último pedido pago
        if (typeof window !== "undefined") {
          localStorage.setItem("lastPaidOrderId", finalOrderId)
        }

        // 2) Busca o pedido na API
        const res = await fetch(`/api/orders/${finalOrderId}`, {
          cache: "no-store",
        })

        if (!res.ok) {
          const text = await res.text()
          console.error(
            "Erro ao buscar pedido em /api/orders/:id =>",
            res.status,
            text,
          )
          setError("Falha ao carregar pedido")
          setLoading(false)
          return
        }

        const data: OrderDTO = await res.json()
        setOrder(data)
        setLoading(false)
      } catch (err: any) {
        console.error("Erro inesperado ao carregar pedido:", err)
        setError("Falha ao carregar pedido")
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderIdFromSearch])

  // ---------------- RENDER ----------------

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error || !order) {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
        <Container maxWidth="md" sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="h5" color="error" fontWeight={700} gutterBottom>
            Ops, houve um problema.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {error || "Não encontramos os dados do seu pedido."}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => router.push("/")}
          >
            Voltar ao início
          </Button>
        </Container>
      </Box>
    )
  }

  const quantidade = order.quantity ?? 0
  const total = order.amount
  const unitario =
    quantidade > 0 ? total / quantidade : UNIT_PRICE_CENTS / 100

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 6 }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Banner de sucesso */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            textAlign: "center",
            borderTop: "4px solid #00a868",
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="success.main"
            gutterBottom
          >
            Pagamento aprovado com sucesso!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seu PIX foi confirmado e seu pedido está liberado.
          </Typography>
        </Paper>

        {/* Resumo do pedido */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ mb: 2, textAlign: "center" }}
          >
            Resumo do seu pedido
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total pago
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatBRL(total)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Quantidade de números
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {quantidade}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                ID do pedido
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ wordBreak: "break-all" }}
              >
                {order.id}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Forma de pagamento
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                PIX
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 1 }}
          >
            Data da aprovação:{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString("pt-BR")
              : "—"}
          </Typography>
        </Paper>

        {/* Detalhes da compra */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Detalhes da sua compra
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr 1fr" },
              rowGap: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Quantidade de números
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {quantidade}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Valor unitário
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatBRL(unitario)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Valor total
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatBRL(total)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            Em breve seus números aparecerão aqui e/ou serão enviados
            automaticamente para o seu e-mail.
          </Typography>
        </Paper>

        {/* Botões de ação */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={() => router.push("/minhas-compras")}
          >
            Ver minhas compras e números
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push("/")}
          >
            Voltar ao início
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
