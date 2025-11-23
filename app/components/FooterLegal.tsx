"use client"

import { Box, Typography } from "@mui/material"

export default function FooterLegal() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 2,
        // margem extra DEPOIS do footer pra poder rolar até o fim
        mb: 4,
        // padding grande embaixo pra não encostar no CTA fixo
        pb: 20, // 20 * 8px = 160px de respiro
        px: { xs: 2, sm: 3 },
        bgcolor: "#F2F2F2",
      }}
    >
      <Typography
        align="center"
        sx={{
          fontSize: "0.75rem",
          lineHeight: 1.5,
          color: "#4B5563",
        }}
      >
        Título de Capitalização na modalidade Filantropia Premiável, pagamento
        único, emitido pela AplicCap Capitalização S/A (CNPJ: 13.122.801/0001-71).
        Antes da contratação, é importante consultar as Condições Gerais. Ao
        adquirir, o subscritor adere automaticamente a essas Condições,
        confirmando ciência e concordância. A aprovação pela Susep apenas
        confirma que o produto está em conformidade com a legislação vigente,
        não representando recomendação ou incentivo de aquisição.
        <br />
        <strong>Processo SUSEP: 15414.647372/2025-.</strong>
      </Typography>
    </Box>
  )
}
