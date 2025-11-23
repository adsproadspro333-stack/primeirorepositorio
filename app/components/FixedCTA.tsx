"use client"

import { Box, Button, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/cartStore"
import { formatBRL } from "@/lib/formatCurrency"

export default function FixedCTA() {
  const router = useRouter()
  const { qty, totalInCents } = useCartStore()

  const disabled = qty < 100

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    // impede qualquer comportamento padrão (link, form, etc)
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return
    router.push("/dados")
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        bgcolor: "#ffffff",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
        p: 2,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography fontWeight={600} textAlign="center">
          {qty} números • Total: {formatBRL(totalInCents / 100)}
        </Typography>

        <Button
          fullWidth
          size="large"
          type="button"              // 🔒 não age como submit de form
          disabled={disabled}
          onClick={handleClick}
          sx={{
            bgcolor: disabled ? "#9e9e9e" : "#16a34a",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: 999,
            py: 1.5,
            fontSize: "1rem",
            "&:hover": {
              bgcolor: disabled ? "#9e9e9e" : "#12853d",
            },
          }}
        >
          CONCORRER AGORA
        </Button>
      </Box>
    </Box>
  )
}
