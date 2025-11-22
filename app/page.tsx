"use client"

import { useEffect } from "react"
import { Box, Container, Paper, Typography } from "@mui/material"
import HeroBanner from "./components/HeroBanner"
import SalesProgress from "./components/SalesProgress"
import QuantitySelector from "./components/QuantitySelector"
import NumbersAdder from "./components/NumbersAdder"
import WinnersList from "./components/WinnersList"
import FooterLegal from "./components/FooterLegal"
import SocialProofNotifications from "./components/SocialProofNotifications"
import { trackViewContent } from "@/app/lib/fbq"
import crypto from "crypto"

export default function HomePage() {
  useEffect(() => {
    // Gera event_id único para deduplicação (Pixel + CAPI)
    const eventId = crypto.randomUUID()

    try {
      trackViewContent({
        content_name: "CHRYS Prêmios - Rifa Principal",
        content_category: "rifa",
        content_ids: ["rifa_chrys_principal"],
        content_type: "product_group",
        currency: "BRL",
        value: 0.1,
        event_id: eventId,
      })

      console.log("✅ ViewContent enviado com sucesso:", eventId)
    } catch (err) {
      console.warn("⚠️ Erro ao disparar ViewContent:", err)
    }
  }, [])

  return (
    <Box sx={{ bgcolor: "#F2F2F2", minHeight: "100vh" }}>
      <HeroBanner />

      <Container maxWidth="lg" sx={{ pb: 10, px: { xs: 2, sm: 3 } }}>
        {/* Price Highlight */}
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
            Por apenas R$ 0,10
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Você pode concorrer a prêmios incríveis!
          </Typography>
        </Paper>

        {/* Sales Progress */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <SalesProgress percent={98.1} />
        </Box>

        {/* Quantity Selector */}
        <QuantitySelector />

        <NumbersAdder />

        {/* Winners List */}
        <WinnersList initialCount={6} />
      </Container>

      <FooterLegal />
      <SocialProofNotifications />
    </Box>
  )
}
