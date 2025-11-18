"use client"
import { useEffect, useState } from "react"
import { useCartStore } from "@/store/cartStore"
import { formatBRL } from "@/app/lib/formatCurrency"
import { useToast } from "./ui/Toast"
import { cn } from "@/lib/utils"

const COMBOS = [
  { id: "combo-1000", quantity: 1000, priceCents: 2990 },
  { id: "combo-2500", quantity: 2500, priceCents: 3990 },
  { id: "combo-5000", quantity: 5000, priceCents: 4990 },
  { id: "combo-10000", quantity: 10000, priceCents: 9990 },
]

let clickAudio: HTMLAudioElement | null = null
function playClick() {
  try {
    if (!clickAudio) clickAudio = new Audio("/click.mp3")
    clickAudio.currentTime = 0
    clickAudio.play().catch(() => {})
  } catch {}
}

function vibrate(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    ;(navigator as any).vibrate?.(ms)
  }
}

export default function NumbersAdder() {
  const { addComboToCart } = useCartStore()
  const { show } = useToast()
  const [highlight, setHighlight] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setHighlight(false), 4000)
    return () => clearTimeout(t)
  }, [])

  const handleAdd = (combo: typeof COMBOS[0]) => {
    addComboToCart(combo.quantity, combo.priceCents)
    
    let message = ""
    let toastType: "default" | "smart-2500" | "special-5000" | "premium-10000" = "default"
    
    if (combo.quantity === 1000) {
      message = `+${combo.quantity} números adicionados <b>(${formatBRL(combo.priceCents / 100)})</b>`
      toastType = "default"
    } else if (combo.quantity === 2500) {
      message = `🔥 Oferta inteligente! +${combo.quantity} números adicionados <b>(${formatBRL(combo.priceCents / 100)})</b>`
      toastType = "smart-2500"
    } else if (combo.quantity === 5000) {
      message = `🚀 Aceleração total! +${combo.quantity} números adicionados <b>(${formatBRL(combo.priceCents / 100)})</b>`
      toastType = "special-5000"
    } else if (combo.quantity === 10000) {
      message = `👑 Combo VIP ativado! +${combo.quantity} números adicionados <b>(${formatBRL(combo.priceCents / 100)})</b>`
      toastType = "premium-10000"
    }
    
    show(message, toastType)
    playClick()
    vibrate(12)
  }

  return (
    <section className="px-3 sm:px-4 md:px-6 lg:px-8 mt-6 mb-10">
      <h3 className="text-xl font-bold text-gray-900 text-center" id="adicionar-numeros">
        O Segredo dos Ganhadores
      </h3>
      <p className="text-sm text-gray-500 text-center mt-1 mb-4">
        Mais números = mais chances. Aproveite os combos.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
        {COMBOS.map((combo) => (
          <div
            key={combo.id}
            role="button"
            tabIndex={0}
            aria-label={`Adicionar +${combo.quantity} números por ${formatBRL(combo.priceCents / 100)}`}
            onClick={() => handleAdd(combo)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleAdd(combo)
              }
            }}
            className={cn(
              "relative w-full select-none",
              "bg-[#1976d2] hover:bg-[#1565c0] active:bg-[#0d47a1]",
              "text-white rounded-xl shadow-md",
              "transition-all duration-200 ease-out",
              "hover:brightness-110 hover:scale-[1.03]",
              "active:scale-95 active:brightness-100",
              "focus:outline-none focus:ring-2 focus:ring-blue-300",
              "border border-black/30",
              "px-4 py-5 sm:py-6",
              "cursor-pointer",
              highlight && "motion-safe:animate-soft-pulse",
            )}
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold leading-none">
                +{combo.quantity}
              </div>
              <div className="mt-1 text-xs sm:text-sm font-medium opacity-95">
                {formatBRL(combo.priceCents / 100)}
              </div>

              <div className="mt-2 text-[11px] sm:text-xs underline underline-offset-2 decoration-white/60 hover:decoration-white">
                Adicionar ao carrinho
              </div>
            </div>

            <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10 hover:ring-white/20" />
          </div>
        ))}
      </div>
    </section>
  )
}
