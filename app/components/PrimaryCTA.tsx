"use client"
import { Button } from "@mui/material"
import { useSelection } from "@/hooks/useSelection"
import { formatBRL } from "@/lib/checkout"

export default function PrimaryCTA() {
  const { selection } = useSelection()
  const label =
    selection.quantity > 0 ? `Quero participar — ${formatBRL(selection.totalCentavos)}` : "Começar minha participação"

  return (
    <Button fullWidth variant="contained" color="success" sx={{ py: 1.5, fontWeight: 700 }}>
      {label}
    </Button>
  )
}
