"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function HeaderBar() {
  const [imgOk, setImgOk] = useState(true)

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        backgroundColor: "#fff",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "0 8px",
        }}
      >
        <div style={{ width: 68 }} aria-hidden="true" />

        <Link
          href="/"
          aria-label="Página inicial"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          {imgOk ? (
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-header.jpg-y6GTAh7Re58O9Y5V0hcTxKb142CHpq.png"
              alt="CHRYS PRÊMIOS"
              width={480}
              height={120}
              priority
              sizes="(max-width: 640px) 220px, 320px"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
              onError={() => setImgOk(false)}
            />
          ) : (
            <strong style={{ fontSize: 16, color: "#0F172A", whiteSpace: "nowrap" }}>CHRYS PRÊMIOS</strong>
          )}
        </Link>

        <Link href="/compras" aria-label="Minhas compras" style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "2px solid #d4af37",
              color: "#b88700",
              background: "transparent",
              padding: "6px 10px",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 12,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z" stroke="currentColor" strokeWidth="2" />
              <path d="M9 7a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="hide-on-xs">Minhas compras</span>
          </button>
        </Link>
      </div>
    </header>
  )
}
