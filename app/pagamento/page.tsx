"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material"
import { Icon } from "@iconify/react"
import QRCode from "react-qr-code"
import { useCartStore } from "@/store/cartStore"
import { formatBRL } from "@/app/lib/formatCurrency"
import { UNIT_PRICE_CENTS } from "@/app/config/pricing"

type OrderDTO = { id: string; amount: number; quantity: number }

export default function PagamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  // agora usamos totalInCents da store
  const { qty, totalInCents } = useCartStore()

  const [resolved, setResolved] = useState<{ amount: number; qty: number }>({
    amount: totalInCents / 100,
    qty,
  })

  // trava para não gerar PIX duas vezes (StrictMode)
  const pixRequestedRef = useRef(false)

  const [pixPayload, setPixPayload] = useState("")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  )
  const [timeRemaining, setTimeRemaining] = useState("14:28")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1) Se tiver orderId na URL, tenta carregar do backend
  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) {
        setResolved({ amount: totalInCents / 100, qty })
        return
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store",
        })
        if (!response.ok) throw new Error("Failed to load order")

        const data: OrderDTO = await response.json()

        // no banco você salva amount em REAIS,
        // então aqui NÃO dividimos de novo por 100
        setResolved({ amount: data.amount, qty: data.quantity })
      } catch (err) {
        console.error("[v0] Failed to load order, falling back to store:", err)
        setResolved({ amount: totalInCents / 100, qty })
      }
    }

    loadOrderData()
  }, [orderId, totalInCents, qty])

  // 2) Geração do PIX (com trava pra não duplicar)
  useEffect(() => {
    const customerData =
      typeof window !== "undefined"
        ? localStorage.getItem("checkoutCustomer")
        : null

    if (!customerData) {
      router.replace("/dados")
      return
    }

    // se ainda não temos valor ou quantidade, não faz nada
    if (
      !resolved.qty ||
      resolved.qty <= 0 ||
      !resolved.amount ||
      resolved.amount <= 0
    ) {
      return
    }

    // impede chamar 2x (StrictMode monta o componente duas vezes no dev)
    if (pixRequestedRef.current) return
    pixRequestedRef.current = true

    const generatePix = async () => {
      try {
        const customer = JSON.parse(customerData)
        const totalInCentsToSend = Math.round(resolved.amount * 100)

        const response = await fetch("/api/pagamento/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: resolved.qty,
            totalInCents: totalInCentsToSend,
            itemTitle: `${resolved.qty} números`,
            customer: {
              name: customer.nome,
              email: customer.email,
              phone: customer.phone,
              documentNumber: customer.cpf,
              documentType: "CPF",
            },
          }),
        })

        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || "Falha ao gerar PIX")
        }

        // ------------------------------
        // 🎯 Parser robusto para a resposta da API
        // ------------------------------
        const copiaECola: string | null =
          data.pixCopiaECola ??
          data.copia_e_cola ??
          data.pix?.copiaECola ??
          data.pix?.copia_e_cola ??
          data.qr_code ??
          null

        // (mantemos isso caso queira usar o QR em base64 futuramente)
        const qrBase64: string | null =
          data.qrCodeBase64 ??
          data.qr_code_base64 ??
          data.pix?.qrCodeBase64 ??
          null

        if (!copiaECola) {
          console.error("Resposta da API PIX sem copia e cola:", data, qrBase64)
          throw new Error(
            "PIX gerado, mas o código de pagamento não foi retornado pela API.",
          )
        }

        setPixPayload(copiaECola)
        setTransactionId(data.transactionId || data.id || null)
        setLoading(false)
      } catch (err: any) {
        console.error("Erro ao gerar PIX:", err)
        setError(err.message || "Erro ao gerar PIX")
        setLoading(false)
      }
    }

    generatePix()

    // contador de tempo
    let minutes = 14
    let seconds = 28
    const interval = setInterval(() => {
      seconds--
      if (seconds < 0) {
        seconds = 59
        minutes--
      }
      if (minutes < 0) {
        clearInterval(interval)
        setTimeRemaining("00:00")
      } else {
        setTimeRemaining(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`,
        )
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [router, resolved.qty, resolved.amount])

  // 3) Checa no backend se a transação foi paga e redireciona
  useEffect(() => {
    if (!transactionId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/transaction-status?id=${transactionId}`)
        if (!res.ok) return

        const data = await res.json()

        if (data.status === "paid") {
          clearInterval(interval)
          router.push("/pagamento-confirmado")
        }
      } catch (err) {
        console.error("Erro ao checar status da transação:", err)
      }
    }, 5000) // checa a cada 5 segundos

    return () => clearInterval(interval)
  }, [transactionId, router])

  const handleCopyPixCode = async () => {
    if (!pixPayload) {
      setSnackbarMessage(
        "Ainda estamos gerando o código PIX, aguarde alguns segundos.",
      )
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }

    try {
      await navigator.clipboard.writeText(pixPayload)
      setSnackbarMessage("Código PIX copiado com sucesso!")
      setSnackbarSeverity("success")
      setSnackbarOpen(true)
    } catch (err) {
      console.error("Erro ao copiar PIX:", err)
      setSnackbarMessage("Erro ao copiar código PIX")
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
    }
  }

  const handleOpenQRCode = () => {
    if (!pixPayload) {
      setSnackbarMessage(
        "Ainda estamos gerando o QR Code, aguarde alguns segundos.",
      )
      setSnackbarSeverity("error")
      setSnackbarOpen(true)
      return
    }
    setQrCodeDialogOpen(true)
  }

  const handleCloseQRCode = () => {
    setQrCodeDialogOpen(false)
  }

  const unitPrice = UNIT_PRICE_CENTS / 100

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => router.back()}
          >
            Voltar
          </Button>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Payment Status Header */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: "warning.light",
            border: "2px solid",
            borderColor: "warning.main",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Icon
                icon="mdi:clock-outline"
                width={32}
                style={{ color: "#f57c00" }}
              />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Aguardando seu pagamento
                </Typography>
                <Typography variant="body2">
                  Tempo restante para pagamento
                </Typography>
              </Box>
            </Box>
            <Chip
              label={timeRemaining}
              color="warning"
              size="large"
              sx={{ fontWeight: 700, fontSize: "1.2rem", px: 2 }}
            />
          </Box>
        </Paper>

        {/* Payment Title */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Icon
            icon="simple-icons:pix"
            width={64}
            style={{ color: "#00a868", marginBottom: 8 }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Pagar com PIX
          </Typography>
          <Typography variant="h5" color="success.main" fontWeight={700}>
            {formatBRL(resolved.amount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Você está adquirindo{" "}
            <strong>
              {resolved.qty} Números × {formatBRL(unitPrice)}
            </strong>
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Instructions */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Como pagar com PIX:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  1
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Abra o aplicativo do seu banco"
                secondary="Acesse a área PIX do aplicativo"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  2
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Escolha pagar com QR Code ou Pix Copia e Cola"
                secondary="Use uma das opções disponíveis abaixo"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  3
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Confirme o pagamento"
                secondary="Verifique os dados e confirme a transação"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  4
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Pronto! Seu pedido será confirmado automaticamente"
                secondary="Você receberá um email com os detalhes"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleCopyPixCode}
            startIcon={<Icon icon="mdi:content-copy" width={24} />}
            disabled={!pixPayload}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Copiar Código PIX
          </Button>

          <Button
            variant="outlined"
            color="primary"
            size="large"
            fullWidth
            onClick={handleOpenQRCode}
            startIcon={<Icon icon="mdi:qrcode" width={24} />}
            disabled={!pixPayload}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 700,
              borderWidth: 2,
              "&:hover": { borderWidth: 2 },
            }}
          >
            Ver QR Code
          </Button>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> O pagamento via PIX é processado
            instantaneamente. Após a confirmação, você receberá seus números por
            email em até 5 minutos.
          </Typography>
        </Alert>
      </Container>

      {/* QR Code Dialog */}
      <Dialog
        open={qrCodeDialogOpen}
        onClose={handleCloseQRCode}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
          QR Code PIX
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Escaneie o QR Code com o aplicativo do seu banco
          </Typography>
          <Box sx={{ my: 3, display: "flex", justifyContent: "center" }}>
            {pixPayload && (
              <Box
                sx={{
                  p: 2,
                  border: "4px solid #00a868",
                  borderRadius: 2,
                  bgcolor: "white",
                }}
              >
                <QRCode value={pixPayload} size={220} />
              </Box>
            )}
          </Box>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {formatBRL(resolved.amount)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 2 }}
          >
            Válido por {timeRemaining}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={handleCloseQRCode}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
