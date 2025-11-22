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
import HeroBanner from "./components/HeroBanner"
import SalesProgress from "./components/SalesProgress"
import QuantitySelector from "./components/QuantitySelector"
import NumbersAdder from "./components/NumbersAdder"
import WinnersList from "./components/WinnersList"
import FooterLegal from "./components/FooterLegal"
import SocialProofNotifications from "./components/SocialProofNotifications"
import { trackViewContent } from "@/lib/fbq"

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

      <Container maxWidth="lg" sx={{ pb: 14, px: { xs: 2, sm: 3 } }}>
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
            Participe da CHRYS PRÊMIOS e concorra a prêmios reais com sorteio
            baseado na Loteria Federal.
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
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, color: "#1F2933" }}
            >
              🔒 Pagamento 100% seguro via Pix. Seus dados são protegidos e seu
              número é gerado automaticamente após a confirmação.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                color: "#6B7280",
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              🎫 Sorteio com base no resultado da Loteria Federal. Transparência
              total para acompanhar seus números.
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
            Quanto mais números, maiores são suas chances reais de ganhar. Você
            acompanha todos os seus números em{" "}
            <strong>“Minhas compras”</strong>.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* Controles existentes – mantidos exatamente como estão */}
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
            Confira quem já foi premiado na plataforma. Todos os sorteios são
            registrados e conferidos.
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
 * Barra fixa inferior com botão de ação.
 * Não dispara pagamento, só leva o usuário de volta
 * à seção de compra (purchase-section), onde está
 * toda a lógica real (QuantitySelector + NumbersAdder).
 */
function StickyCTA() {
  const handleClick = () => {
    const el = document.getElementById("purchase-section")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      // fallback: rola pro topo se não achar
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300, // acima do conteúdo normal
        bgcolor: "rgba(255,255,255,0.98)",
        boxShadow: "0 -4px 12px rgba(15,23,42,0.18)",
        py: 1.5,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ justifyContent: "space-between" }}
        >
          <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ fontSize: "0.7rem", color: "#6B7280" }}
            >
              🎟 Escolha a quantidade de números e finalize o pagamento via Pix
              com segurança.
            </Typography>
          </Box>

          <Button
            onClick={handleClick}
            variant="contained"
            color="success"
            fullWidth
            sx={{
              fontWeight: 700,
              borderRadius: 999,
              py: 1.2,
              fontSize: { xs: "0.9rem", sm: "1rem" },
            }}
          >
            CONCORRER AGORA
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
