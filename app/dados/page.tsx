"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Container, Box, Paper, Typography, TextField, Button, Alert } from "@mui/material"
import { Icon } from "@iconify/react"
import { useCartStore } from "@/store/cartStore"

export default function DadosPage() {
  const router = useRouter()
  const { qty, total } = useCartStore()
  const [cpf, setCpf] = useState("")
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [error, setError] = useState("")

  // Simple CPF formatter
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
  }

  // Simple phone formatter
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11)
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  }

  // Simple date formatter
  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8)
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
  }

  const validateForm = () => {
    if (cpf.replace(/\D/g, "").length !== 11) {
      setError("CPF inválido. Deve conter 11 dígitos.")
      return false
    }
    if (nome.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres.")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Email inválido.")
      return false
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Telefone inválido.")
      return false
    }
    if (birthdate.replace(/\D/g, "").length !== 8) {
      setError("Data de nascimento inválida.")
      return false
    }
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    const payload = {
      cpf,
      nome,
      email,
      phone,
      birthdate,
    }

    localStorage.setItem("checkoutCustomer", JSON.stringify(payload))
    localStorage.setItem("checkoutQuantity", String(qty))
    localStorage.setItem("checkoutTotal", String(total))
    router.push("/confirmacao")
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Icon icon="mdi:account-circle" width={32} style={{ color: "#1976d2", marginRight: 8 }} />
            <Typography variant="h5" fontWeight={600}>
              Dados Pessoais
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Preencha seus dados para continuar com a compra. Todas as informações são protegidas e confidenciais.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              label="CPF"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              fullWidth
              required
              margin="normal"
              placeholder="000.000.000-00"
              inputProps={{ maxLength: 14 }}
            />

            <TextField
              label="Nome Completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              fullWidth
              required
              margin="normal"
              placeholder="Seu nome completo"
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
              placeholder="seu@email.com"
            />

            <TextField
              label="Celular"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              fullWidth
              required
              margin="normal"
              placeholder="(00) 00000-0000"
              inputProps={{ maxLength: 15 }}
            />

            <TextField
              label="Data de Nascimento"
              value={birthdate}
              onChange={(e) => setBirthdate(formatDate(e.target.value))}
              fullWidth
              required
              margin="normal"
              placeholder="DD/MM/AAAA"
              inputProps={{ maxLength: 10 }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="success"
              size="large"
              fullWidth
              sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
              endIcon={<Icon icon="mdi:arrow-right" width={24} />}
            >
              Ir para confirmação
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
