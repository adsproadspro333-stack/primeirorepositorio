"use client"

import { Box } from "@mui/material"
import Image from "next/image"

export default function HeroBanner() {
  return (
    <Box
      sx={{
        width: "100%",
        overflow: "hidden",
        borderRadius: "0px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/banner-principal.png-d7703dFrcOYkXvf0n9CHZmtYT5gqwT.png"
        alt="Banner Principal - Concorra a 3 iPhone 17 + 15 mil reais"
        width={1800}
        height={800}
        priority
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "300px",
          objectFit: "contain",
          objectPosition: "center",
        }}
        sizes="100vw"
      />
    </Box>
  )
}
