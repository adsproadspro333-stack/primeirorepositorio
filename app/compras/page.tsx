"use client"

import { useState } from "react"

type Ticket = {
  number: number
}

type Transaction = {
  id: string
  status: string
  value: number
  gatewayId: string
}

type Order = {
  id: string
  amount: number
  status: string
  createdAt: string | null
  numbers: number[]
  transactions: Transaction[]
}

export default function MinhasComprasPage() {
  const [cpf, setCpf] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOrders([])
    setLoading(true)

    try {
      const res = await fetch("/api/minhas-compras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf }),
      })

      // NÃO chamar res.text() aqui, senão o body esgota.
      const data = await res.json().catch(() => {
        throw new Error("Resposta inválida do servidor")
      })

      if (!res.ok || data.ok === false) {
        throw new Error(data?.error || "Falha ao buscar pedidos")
      }

      setOrders(data.orders || [])
    } catch (err: any) {
      console.error("Erro ao buscar compras:", err)
      setError(err.message || "Erro inesperado ao buscar pedidos")
    } finally {
      setLoading(false)
    }
  }

  // máscara simples opcional
  const handleCpfChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "").slice(0, 11)
    setCpf(onlyDigits)
  }

  return (
    <main style={{ minHeight: "100vh", padding: "40px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
          Minhas Compras
        </h1>
        <p style={{ textAlign: "center", marginBottom: 24, color: "#6b7280" }}>
          Consulte seus pedidos usando seu CPF.
        </p>

        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: 8,
            maxWidth: 600,
            margin: "0 auto 24px",
          }}
        >
          <input
            type="text"
            placeholder="Digite seu CPF"
            value={cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading || !cpf}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: loading ? "#9ca3af" : "#10b981",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error && (
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto 24px",
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Lista de pedidos */}
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {orders.length === 0 && !loading && !error && (
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              Nenhum pedido encontrado para esse CPF.
            </p>
          )}

          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 16,
                marginBottom: 16,
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>ID do pedido</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{order.id}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Valor pago</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {order.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13 }}>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      backgroundColor:
                        order.status === "paid" ? "#dcfce7" : order.status === "pending" ? "#fef9c3" : "#e5e7eb",
                      color:
                        order.status === "paid" ? "#166534" : order.status === "pending" ? "#92400e" : "#4b5563",
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                {order.createdAt && (
                  <div>
                    <strong>Data:</strong>{" "}
                    {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </div>
                )}
                <div>
                  <strong>Qtde de números:</strong> {order.numbers.length}
                </div>
              </div>

              {order.numbers.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 8,
                    borderTop: "1px dashed #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  <strong>Números:</strong>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {order.numbers.map((n) => (
                      <span
                        key={n}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 999,
                          backgroundColor: "#f3f4f6",
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
