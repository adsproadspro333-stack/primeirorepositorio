"use client"

import { useState, useEffect } from "react"
import { Box, Grid, IconButton, TextField, Button, Stack, Typography } from "@mui/material"
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline"
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"
import { useRouter } from 'next/navigation'
import { useCartStore } from "@/store/cartStore"
import { formatBRL } from "@/lib/formatCurrency"
import { useToast } from "./ui/Toast"

const PRESETS = [
  { label: "+5", q: 5 },
  { label: "+50", q: 50 },
  { label: "+100", q: 100 },
  { label: "+500", q: 500 },
]

const UNIT_PRICE_CENTS = 10

export default function QuantitySelector() {
  const router = useRouter()
  const { qty, comboQty, totalInCents, handleChangeQuantity, clearCart } = useCartStore()
  const { show } = useToast()
  const [bump, setBump] = useState(false)
  const [animateQty, setAnimateQty] = useState(false)
  const [animateTotal, setAnimateTotal] = useState(false)

  const triggerBump = () => {
    setBump(true)
  }

  useEffect(() => {
    if (!bump) return
    const t = setTimeout(() => setBump(false), 400)
    return () => clearTimeout(t)
  }, [bump])

  useEffect(() => {
    setAnimateQty(true)
    const timeout = setTimeout(() => setAnimateQty(false), 250)
    return () => clearTimeout(timeout)
  }, [qty])

  useEffect(() => {
    setAnimateTotal(true)
    const timeout = setTimeout(() => setAnimateTotal(false), 250)
    return () => clearTimeout(timeout)
  }, [totalInCents])

  const inc = () => {
    handleChangeQuantity(qty + 1)
    triggerBump()
  }

  const dec = () => {
    handleChangeQuantity(qty - 1)
    triggerBump()
  }

  const onChangeQty = (v: number) => {
    if (!Number.isFinite(v)) return
    handleChangeQuantity(v)
    triggerBump()
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {PRESETS.map((p, i) => (
          <Grid item xs={3} key={i}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                handleChangeQuantity(qty + p.q)
                triggerBump()
                const addedPrice = (p.q * UNIT_PRICE_CENTS) / 100
                show(`+${p.q} números adicionados <b>(${formatBRL(addedPrice)})</b>`)
              }}
              sx={{ fontWeight: 800 }}
            >
              {p.label}
            </Button>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: "center" }}>
        <IconButton aria-label="Diminuir" onClick={dec}>
          <RemoveCircleOutlineIcon />
        </IconButton>
        <TextField
          type="number"
          value={qty}
          onChange={(e) => onChangeQty(Number(e.target.value || 100))}
          onBlur={(e) => onChangeQty(Number(e.target.value || 100))}
          inputProps={{ min: 100, style: { textAlign: "center", width: 110 } }}
          size="small"
          className={bump ? "animate-bump" : ""}
          InputProps={{
            sx: {
              transition: "transform 0.2s ease, filter 0.2s ease",
              ...(animateQty && {
                transform: "scale(1.08)",
                filter: "brightness(1.1)",
              }),
            },
          }}
        />
        <IconButton aria-label="Aumentar" onClick={inc}>
          <AddCircleOutlineIcon />
        </IconButton>
      </Stack>

      <Typography align="center" sx={{ mt: 1.25 }} color="text.secondary">
        Total atual:{" "}
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            transition: "color 0.2s ease, backgroundColor 0.2s ease",
            borderRadius: 1,
            px: 0.5,
            ...(animateTotal && {
              color: "success.main",
              backgroundColor: "rgba(46, 204, 113, 0.12)",
            }),
          }}
        >
          {formatBRL(totalInCents / 100)}
        </Box>
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={() => router.push("/dados")}
          disabled={qty < 100}
          sx={{
            py: 2,
            borderRadius: 9999,
            fontWeight: 700,
            fontSize: "1rem",
            boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.18)",
            background: "linear-gradient(90deg, #18a34a, #16c964)",
            transition: "all 0.2s ease",
            "&:hover:not(:disabled)": {
              boxShadow: "0px 12px 28px rgba(0, 0, 0, 0.25)",
              transform: "translateY(-2px)",
            },
          }}
        >
          <Box display="flex" flexDirection="column" lineHeight={1.2}>
            <Typography variant="button" sx={{ fontWeight: 700 }}>
              Continuar com esta quantidade
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Melhor opção para você avançar agora
            </Typography>
          </Box>
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          sx={{ fontWeight: 600 }}
          onClick={() => {
            clearCart()
            show("Carrinho resetado para o mínimo (100).", "default")
          }}
        >
          Limpar
        </Button>
      </Stack>
    </Box>
  )
}
