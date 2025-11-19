"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material"
import { formatBRL } from "@/app/lib/formatCurrency"

type OrderDTO = {
  id: string
  amount: number // em reais
  quantity: number
  createdAt?: string
}

type Props = {
  orderIdFromSearch?: string
}

export default function PagamentoConfirmadoClient({
  orderIdFromSearch,
}: Props) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let effectiveOrderId = orderIdFromSearch || undefined

    if (!effectiveOrderId && typeof window !== "undefined") {
      effectiveOrderId =
        window.localStorage.getItem("lastPaidOrderId") ||
        window.localStorage.getItem("lastOrderId") ||
        undefined
    }

    if (!effectiveOrderId) {
      setError("Não encontramos os dados do seu pedido.")
      setLoading(false)
      return
    }

    const loadOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${effectiveOrderId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Falha ao carregar pedido")

        const data: OrderDTO = await res.json()
        setOrder(data)
        setLoading(false)
      } catch (err: any) {
        console.error("Erro ao carregar pedido confirmado:", err)
        setError(err.message || "Erro ao carregar pedido")
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderIdFromSearch])

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
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Ops, houve um problema.
        </Typography>
        <Typography variant="body1" gutterBottom>
          {error ??
            "Não conseguimos localizar os dados do seu pedido. Mas se o PIX foi aprovado, fique tranquilo que os números serão enviados por email."}
        </Typography>
        <Button sx={{ mt: 3 }} variant="contained" onClick={() => router.push("/")}>
          Voltar ao início
        </Button>
      </Container>
    )
  }

  const total = order.amount
  const quantidade = order.quantity
  const unitario = quantidade > 0 ? total / quantidade : total
  const dataAprovacao = order.createdAt
    ? new Date(order.createdAt)
    : new Date()

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 6 }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* topo de sucesso */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            textAlign: "center",
            borderTop: "4px solid #00a868",
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Pagamento aprovado com sucesso!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seu PIX foi confirmado e seu pedido está liberado.
          </Typography>
        </Paper>

        {/* resumo do pedido */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            align="center"
            gutterBottom
          >
            Resumo do seu pedido
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
              mt: 2,
              textAlign: "center",
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
              <Typography variant="h6" fontWeight={700}>
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
            display="block"
            align="center"
            sx={{ mt: 2 }}
          >
            Data de aprovação:{" "}
            {dataAprovacao.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Paper>

        {/* detalhes da compra */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Detalhes da sua compra
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: 1,
              columnGap: 4,
            }}
          >
            <Typography color="text.secondary">
              Quantidade de números
            </Typography>
            <Typography>{quantidade}</Typography>

            <Typography color="text.secondary">Valor unitário</Typography>
            <Typography>{formatBRL(unitario)}</Typography>

            <Typography color="text.secondary">Valor total</Typography>
            <Typography>{formatBRL(total)}</Typography>

            <Typography color="text.secondary">Horário da aprovação</Typography>
            <Typography>
              {dataAprovacao.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 2 }}
          >
            Em breve seus números aparecerão aqui e também serão enviados por
            email automaticamente.
          </Typography>
        </Paper>

        {/* botões finais */}
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
