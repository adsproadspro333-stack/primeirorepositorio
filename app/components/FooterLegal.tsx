"use client"

import { Box, Container, Typography, Link, Divider } from "@mui/material"

export default function FooterLegal() {
  return (
    <Box component="footer" sx={{ bgcolor: "grey.100", py: 4, mt: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>INFORMAÇÕES LEGAIS:</strong>
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Este é um título de capitalização regido pela SUSEP (Superintendência de Seguros Privados) sob o processo
          número XXXXX. A participação é voluntária e o sorteio é realizado pela Loteria Federal. Consulte o regulamento
          completo para mais informações sobre as condições de participação, resgate e premiação.
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Importante:</strong> É proibida a venda de títulos de capitalização para menores de 16 anos. A empresa
          se reserva o direito de solicitar documentação comprobatória antes da entrega do prêmio.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="#" color="primary" underline="hover">
            Condições Gerais
          </Link>
          <Link href="#" color="primary" underline="hover">
            Regulamento
          </Link>
          <Link href="#" color="primary" underline="hover">
            Política de Privacidade
          </Link>
          <Link href="#" color="primary" underline="hover">
            Termos de Uso
          </Link>
          <Link href="#" color="primary" underline="hover">
            Contato
          </Link>
        </Box>

        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} Rifas Online. Todos os direitos reservados.
        </Typography>
      </Container>
    </Box>
  )
}
