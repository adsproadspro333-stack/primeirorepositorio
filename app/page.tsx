"use client"

import { useEffect } from "react"
import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  Stack,
  Button,
} from "@mui/material"
import { useRouter } from "next/navigation"
import HeroBanner from "./components/HeroBanner"
import SalesProgress from "./components/SalesProgress"
import QuantitySelector from "./components/QuantitySelector"
import NumbersAdder from "./components/NumbersAdder"
import WinnersList from "./components/WinnersList"
import FooterLegal from "./components/FooterLegal"
import SocialProofNotifications from "./components/SocialProofNotifications"
import { trackViewContent } from "@/lib/fbq"
import { useCartStore } from "@/store/cartStore"
import { formatBRL } from "@/lib/formatCurrency"

export default function HomePage() {
  useEffect(() => {
    // Gera um event_id simples para deduplicação (Pixel + CAPI)
    const eventId =
      Date.now().toString() + "-" + Math.random().toString(36).slice(2)

    try {
      trackViewContent({
        content_name: "CHRYS Prêmios - Rifa Principal",
        content_category: "rifa",
        content_ids: ["rifa_chrys_principal"],
        content_type: "product_group",
        currency: "BRL",
        value: 0.1, // valor médio por número em REAIS (ajusta se mudar preço)
        event_id: eventId,
      })

      console.log("✅ ViewContent enviado com sucesso:", eventId)
    } catch (err) {
      console.warn("⚠️ Erro ao disparar ViewContent:", err)
    }
  }, [])

  return (
    <Box sx={{ bgcolor: "#F2F2F2", minHeight: "100vh" }}>
      {/* Hero com banner principal */}
      <HeroBanner />

      {/* padding-bottom maior por causa do CTA fixo */}
      <Container maxWidth="lg" sx={{ pb: 18, px: { xs: 2, sm: 3 } }}>
        {/* Destaque de preço / headline de oferta */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mt: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            textAlign: "center",
            bgcolor: "primary.main",
            color: "white",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Números a partir de R$ 0,10
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 1, fontSize: { xs: "0.9rem", sm: "1rem" } }}
          >
            Garanta seus números na CHRYS PRÊMIOS e concorra a prêmios reais,
            com sorteio baseado na Loteria Federal.
          </Typography>
        </Paper>

        {/* Faixa de confiança / segurança */}
        <Paper
          elevation={0}
          sx={{
            mb: { xs: 2.5, sm: 3 },
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderRadius: 2,
            bgcolor: "#ffffff",
            border: "1px solid #E2E8F0",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, color: "#1F2933" }}
            >
              🔒 Pagamento 100% seguro via Pix. Seus dados são protegidos e seus
              números são gerados automaticamente após a confirmação.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                color: "#6B7280",
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              🎫 Sorteio com base na Loteria Federal. Transparência total para
              acompanhar as extrações e seus bilhetes.
            </Typography>
          </Stack>
        </Paper>

        {/* Progresso de vendas */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <SalesProgress percent={98.1} />
        </Box>

        {/* Card principal da compra: quantidade + números */}
        <Paper
          elevation={3}
          id="purchase-section"
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 },
            borderRadius: 2,
            bgcolor: "#ffffff",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "1rem", sm: "1.1rem" },
            }}
          >
            Escolha quantos números você quer garantir
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: "#6B7280",
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
            }}
          >
            Quanto mais números você garante, maiores são as suas chances reais
            de ser o próximo ganhador. Depois da compra, acompanhe tudo em{" "}
            <strong>“Minhas compras”</strong>.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* Controles existentes */}
          <QuantitySelector />
          <NumbersAdder />
        </Paper>

        {/* Lista de ganhadores / prova social */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              fontSize: { xs: "1rem", sm: "1.1rem" },
            }}
          >
            Ganhadores recentes
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: "#6B7280",
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
            }}
          >
            Veja quem já garantiu prêmio com a CHRYS PRÊMIOS. Todos os sorteios
            são auditáveis e vinculados às extrações oficiais.
          </Typography>

          <WinnersList initialCount={6} />
        </Box>
      </Container>

      <FooterLegal />
      <SocialProofNotifications />

      {/* CTA fixo no rodapé */}
      <StickyCTA />
    </Box>
  )
}

/**
 * Barra fixa inferior com seletor clean e botão "Concorrer".
 * Usa os mesmos dados do carrinho (qty/totalInCents) e leva para /dados.
 */
function StickyCTA() {
  const router = useRouter()
  const { qty, totalInCents, handleChangeQuantity } = useCartStore()
  const disabled = qty < 100
  const MIN_QTY = 100

  const inc = () => {
    handleChangeQuantity(qty + 1) // se quiser outro passo, troca aqui
  }

  const dec = () => {
    if (qty <= MIN_QTY) return
    handleChangeQuantity(qty - 1)
  }

  const handleClick = () => {
    if (disabled) return
    router.push("/dados")
  }

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        bgcolor: "rgba(255,255,255,0.98)",
        boxShadow: "0 -4px 12px rgba(15,23,42,0.18)",
        py: 1.5,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={1.2}>
          {/* Linha com quantidade, preço e seletor */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ fontSize: "0.8rem", color: "#6B7280" }}
              >
                {qty} Números
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}
              >
                {formatBRL(totalInCents / 100)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Button
                onClick={dec}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: 36,
                  borderRadius: 2,
                  px: 0,
                  fontWeight: 700,
                }}
              >
                −
              </Button>

              <Box
                sx={{
                  px: 2,
                  py: 0.7,
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  minWidth: 64,
                  textAlign: "center",
                  bgcolor: "#F9FAFB",
                }}
              >
                <Typography
                  sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}
                >
                  {qty}
                </Typography>
              </Box>

              <Button
                onClick={inc}
                variant="outlined"
                size="small"
                sx={{
                  minWidth: 36,
                  borderRadius: 2,
                  px: 0,
                  fontWeight: 700,
                }}
              >
                +
              </Button>
            </Box>
          </Stack>

          {/* Botão principal */}
          <Button
            onClick={handleClick}
            variant="contained"
            fullWidth
            disabled={disabled}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              py: 1.2,
              fontSize: "0.95rem",
              textTransform: "none",
              bgcolor: disabled ? "#9CA3AF" : "#16A34A",
              "&:hover": {
                bgcolor: disabled ? "#9CA3AF" : "#15803D",
              },
            }}
          >
            {disabled ? "Selecione pelo menos 100 números" : "Concorrer"}
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
