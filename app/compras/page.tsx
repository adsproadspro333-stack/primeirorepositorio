"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ticket = {
  id: string;
  number: number;
  createdAt: string;
};

type Transaction = {
  id: string;
  value: number;
  status: string;
  createdAt: string;
};

type Order = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  tickets: Ticket[];
  transactions: Transaction[];
};

export default function MinhasComprasPage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function sanitizeCpf(value: string) {
    return value.replace(/\D/g, "");
  }

  async function handleBuscar() {
    try {
      setLoading(true);
      setError(null);
      setOrders([]);

      const rawCpf = sanitizeCpf(cpf);

      if (!rawCpf || rawCpf.length < 11) {
        throw new Error("Digite um CPF válido (11 números).");
      }

      const res = await fetch(`/api/minhas-compras?cpf=${rawCpf}`);

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao buscar compras");
      }

      const data: Order[] = await res.json();

      // 🔒 mostra apenas pedidos pagos
      const paidOrders = (data || []).map((o) => ({
        ...o,
        tickets: o.tickets || [],
        transactions: o.transactions || [],
      })).filter((order) => {
        const hasPaidStatus = order.status === "paid";
        const hasPaidTransaction = order.transactions.some(
          (t) => t.status === "paid"
        );
        return hasPaidStatus || hasPaidTransaction;
      });

      setOrders(paidOrders);
      if (paidOrders.length === 0) {
        setError("Nenhuma compra paga encontrada para esse CPF.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function formatStatus(status: string) {
    if (status === "paid") return "Pago";
    if (status === "pending") return "Pendente";
    if (status === "canceled") return "Cancelado";
    return status;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Minhas Compras
          </h1>
          <p className="text-neutral-600 text-sm">
            Consulte seus pedidos usando seu CPF.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Digite seu CPF (apenas números)"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="flex-1 rounded-lg px-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-500 outline-none focus:border-emerald-500 focus:bg-white transition-colors text-sm"
            />
            <button
              onClick={handleBuscar}
              disabled={loading || !cpf}
              className="px-6 py-3 rounded-lg bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 && !loading && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-neutral-600 text-base mb-4">
              Nenhuma compra encontrada para esse CPF.
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-block px-6 py-2 rounded-lg bg-neutral-100 text-neutral-700 font-medium text-sm hover:bg-neutral-200 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 text-base">
                  Pedido #{order.id.slice(0, 8)}
                </h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    order.status === "paid"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : order.status === "pending"
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                  }`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm">
                    Data da compra:
                  </span>
                  <span className="text-neutral-900 font-medium text-sm">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 text-sm">Total pago:</span>
                  <span className="text-emerald-600 font-semibold text-base">
                    R$ {order.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {order.tickets.length > 0 && (
                <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
                  <p className="text-xs text-neutral-600 font-medium mb-2 uppercase tracking-wide">
                    Números dessa compra
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.tickets.map((ticket) => (
                      <span
                        key={ticket.id}
                        className="text-xs px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-900 font-medium"
                      >
                        {ticket.number}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {order.transactions.length > 0 && (
                <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
                  <p className="text-xs text-neutral-600 font-medium mb-2 uppercase tracking-wide">
                    Transações
                  </p>
                  <div className="space-y-1">
                    {order.transactions.map((t) => (
                      <div
                        key={t.id}
                        className="text-xs flex justify-between text-neutral-700"
                      >
                        <span>R$ {t.value.toFixed(2)}</span>
                        <span className="text-neutral-500">
                          Status: {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
