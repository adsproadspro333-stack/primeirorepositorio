"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  Chip,
} from "@mui/material"
import { Icon } from "@iconify/react"
import { useCartStore } from "@/store/cartStore"
import { formatBRL } from "@/lib/formatCurrency"

interface CustomerData {
  cpf: string
  nome: string
  email: string
  phone: string
  birthdate: string
}

export default function ConfirmacaoPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerData | null>(null)

  // Pegamos quantidade total e o TOTAL em centavos
  const { qty, totalInCents } = useCartStore()

  useEffect(() => {
    const customerData = localStorage.getItem("checkoutCustomer")
    if (!customerData) {
      router.replace("/dados")
      return
    }

    setCustomer(JSON.parse(customerData))
  }, [router])

  const maskCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "")
    return `***.***.${numbers.slice(6, 9)}-**`
  }

  const handleConfirm = () => {
    router.push("/pagamento")
  }

  if (!customer) {
    return null
  }

  // Converte de centavos para reais usando o mesmo total do carrinho
  const totalReais = totalInCents / 100

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 12 }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => router.push("/")}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Icon icon="mdi:home" width={18} />
            Escolher Produto
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => router.push("/dados")}
            sx={{ cursor: "pointer" }}
          >
            Dados pessoais
          </Link>
          <Typography color="primary" fontWeight={600}>
            Método de pagamento
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          Confirmação do Pedido
        </Typography>

        {/* Customer Info Card */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Icon icon="mdi:account" width={24} style={{ marginRight: 8, color: "#1976d2" }} />
              <Typography variant="h6" fontWeight={600}>
                Dados do Cliente
              </Typography>
            </Box>
            <Typography variant="body1" gutterBottom>
              <strong>Nome:</strong> {customer.nome}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>CPF:</strong> {maskCPF(customer.cpf)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> {customer.email}
            </Typography>
            <Typography variant="body1">
              <strong>Celular:</strong> {customer.phone}
            </Typography>
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon icon="mdi:qrcode" width={24} style={{ marginRight: 8, color: "#4caf50" }} />
                <Typography variant="h6" fontWeight={600}>
                  Método de Pagamento
                </Typography>
              </Box>
              <Chip label="Selecionado" color="success" size="small" />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Icon icon="simple-icons:pix" width={40} style={{ color: "#00a868" }} />
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  PIX
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pagamento instantâneo e seguro
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Resumo do Pedido
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body1">
              {qty} números com preço promocional
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatBRL(totalReais)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={700}>
              Total
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatBRL(totalReais)}
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Fixed CTA Button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "white",
          p: 2,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
          zIndex: 10,
        }}
      >
        <Container maxWidth="md">
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleConfirm}
            endIcon={<Icon icon="mdi:credit-card" width={24} />}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Confirmar pagamento
          </Button>
        </Container>
      </Box>
    </Box>
  )
}
