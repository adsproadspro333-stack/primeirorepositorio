"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { Icon } from "@iconify/react"
import { formatBRL } from "@/app/lib/formatCurrency"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

type OrderData = {
  id: string
  amount: number
  quantity: number
  status: string
  paymentMethod: string
  paidAt: string
}

export default function PagamentoConfirmadoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [order, setOrder] = useState<OrderData>({
    id: "MOCK-123456",
    amount: 10,
    quantity: 100,
    status: "paid",
    paymentMethod: "PIX",
    paidAt: new Date().toISOString(),
  })

  useEffect(() => {
    // TODO: Substituir este mock por:
    // const orderId = new URLSearchParams(window.location.search).get("orderId")
    // if (orderId) {
    //   fetch(`/api/orders/${orderId}`)
    //     .then(res => res.json())
    //     .then(data => setOrder(data))
    //     .catch(err => console.error("Erro ao carregar pedido:", err))
    // }

    // Para agora, usar dados mockados
    const orderId = searchParams.get("orderId")
    if (orderId) {
      console.log("[v0] orderId from URL:", orderId)
      // Aqui entrará o fetch real do pedido
    }
  }, [searchParams])

  const handleViewPurchases = () => {
    router.push("/compras")
  }

  const handleReturnHome = () => {
    router.push("/")
  }

  const unitPrice = UNIT_PRICE_CENTS / 100
  const formattedDate = new Date(order.paidAt).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Success Header */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: "#F2F2F2",
            border: "2px solid",
            borderColor: "success.main",
            textAlign: "center",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Icon
              icon="mdi:check-decagram"
              width={64}
              style={{ color: "#00a868" }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>
            Pagamento aprovado com sucesso!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seu PIX foi confirmado e seu pedido está liberado.
          </Typography>
        </Paper>

        {/* Order Summary */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Resumo do seu pedido
          </Typography>
          
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total pago
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {formatBRL(order.amount)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Quantidade de números
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {order.quantity}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  ID do pedido
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {order.id}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Forma de pagamento
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {order.paymentMethod}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary">
            Data de aprovação: {formattedDate}
          </Typography>
        </Paper>

        {/* Purchase Details */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Detalhes da sua compra
          </Typography>

          <List>
            <ListItem divider>
              <ListItemText
                primary="Quantidade de números"
                secondary={`${order.quantity} títulos`}
              />
            </ListItem>
            <ListItem divider>
              <ListItemText
                primary="Valor unitário"
                secondary={formatBRL(unitPrice)}
              />
            </ListItem>
            <ListItem divider>
              <ListItemText
                primary="Valor total"
                secondary={formatBRL(order.amount)}
                secondaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Horário da aprovação"
                secondary={new Date(order.paidAt).toLocaleTimeString("pt-BR")}
              />
            </ListItem>
          </List>

          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "#f5f5f5",
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Em breve seus números aparecerão aqui automaticamente.
            </Typography>
            {/* TODO: Aqui será mostrada a lista dos números reais do banco de dados quando integrado */}
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleViewPurchases}
            startIcon={<Icon icon="mdi:shopping-outline" width={24} />}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Ver minhas compras e números
          </Button>

          <Button
            variant="outlined"
            color="primary"
            size="large"
            fullWidth
            onClick={handleReturnHome}
            startIcon={<Icon icon="mdi:home" width={24} />}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              borderWidth: 2,
              "&:hover": { borderWidth: 2 },
            }}
          >
            Voltar ao início
          </Button>
        </Box>

        {/* Upsell Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: "#fafafa" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Aumente suas chances
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adicione mais números e aumente significativamente suas chances de ganhar!
          </Typography>

          <Grid container spacing={2}>
            {/* Upsell Card 1 */}
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Icon
                      icon="mdi:gift-outline"
                      width={40}
                      style={{ color: "#ff6b6b" }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Combo Sorte
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ganhe 50 números extras por um preço especial. Oferta válida apenas para novos clientes!
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="small"
                    onClick={() => router.push("/")}
                  >
                    Ver oferta
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Upsell Card 2 */}
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Icon
                      icon="mdi:lightning-bolt"
                      width={40}
                      style={{ color: "#ffd700" }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Turbo Premium
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Acesso exclusivo a sorteios VIP com prêmios maiores e frequência diferenciada.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="small"
                    onClick={() => router.push("/")}
                  >
                    Ver oferta
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Info Alert */}
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Você receberá tudo no e-mail também.</strong> Em caso de dúvidas,
            nosso suporte está à disposição.
          </Typography>
        </Alert>
      </Container>
    </Box>
  )
}
