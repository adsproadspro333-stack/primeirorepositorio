"use client"

import { useState, useEffect } from "react"
import { Box, Paper, Typography } from "@mui/material"
import { Icon } from "@iconify/react"

interface Winner {
  name: string
  state: string
  prize: string
}

const WINNERS: Winner[] = [
  { name: "Thaynara", state: "CE", prize: "um iPhone 17" },
  { name: "Marcos", state: "PE", prize: "1 moto 0km" },
  { name: "Bruna", state: "BA", prize: "uma TV 75\" 4K" },
  { name: "Rafael", state: "RJ", prize: "R$ 15.000 em pix" },
  { name: "Carla", state: "SP", prize: "um Apple Watch Ultra" },
  { name: "Lucas", state: "MG", prize: "1 PlayStation 5" },
  { name: "Amanda", state: "RS", prize: "uma câmera digital" },
  { name: "Diego", state: "SC", prize: "R$ 5.000 em vale compras" },
]

export default function SocialProofNotifications() {
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let notificationTimeout: NodeJS.Timeout
    let intervalTimeout: NodeJS.Timeout

    const showNextNotification = () => {
      const randomWinner = WINNERS[Math.floor(Math.random() * WINNERS.length)]
      setCurrentWinner(randomWinner)
      setOpen(true)

      // Close notification after 6-8 seconds
      notificationTimeout = setTimeout(() => {
        setOpen(false)
      }, 6000 + Math.random() * 2000)

      // Schedule next notification after 25-45 seconds
      intervalTimeout = setTimeout(() => {
        showNextNotification()
      }, 25000 + Math.random() * 20000)
    }

    // Start first notification after 3 seconds
    const initialTimeout = setTimeout(() => {
      showNextNotification()
    }, 3000)

    return () => {
      clearTimeout(initialTimeout)
      clearTimeout(notificationTimeout)
      clearTimeout(intervalTimeout)
    }
  }, [])

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: { xs: 20, md: 40 },
        left: { xs: "50%", md: 40 },
        transform: { xs: "translateX(-50%)", md: "none" },
        zIndex: 9999,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderRadius: 9999,
          opacity: open ? 1 : 0,
          transform: open ? "scale(1)" : "scale(0.8)",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          minWidth: 280,
          maxWidth: { xs: "calc(100vw - 32px)", md: 360 },
          backgroundColor: "#FFFFFF",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Live indicator dot */}
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "#22c55e",
            flexShrink: 0,
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            "@keyframes pulse": {
              "0%, 100%": {
                opacity: 1,
              },
              "50%": {
                opacity: 0.7,
              },
            },
          }}
        />

        {/* Trophy icon and content */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
          <Icon
            icon="mdi:trophy"
            width={20}
            height={20}
            style={{ color: "#f59e0b", flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentWinner && `${currentWinner.name} (${currentWinner.state})`}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentWinner && `Ganhou ${currentWinner.prize}`}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
