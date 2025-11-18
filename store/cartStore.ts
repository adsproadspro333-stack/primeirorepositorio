import { create } from "zustand"
import { persist } from "zustand/middleware"

const UNIT_PRICE_CENTS = 10 // 10 cents per number (R$ 0.10)

export type CartState = {
  baseQty: number // Quantidade base (mínimo 100)
  baseAmountInCents: number // Valor da base em centavos
  comboQty: number // Quantidade adicional dos combos
  combosTotalInCents: number // Valor total dos combos em centavos
  qty: number // Total: baseQty + comboQty
  totalInCents: number // Total em centavos: baseAmountInCents + combosTotalInCents
  
  // Methods
  setBaseQty: (n: number) => void
  handleChangeQuantity: (newTotalQty: number) => void
  addComboToCart: (quantity: number, priceCents: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      baseQty: 100,
      baseAmountInCents: 100 * UNIT_PRICE_CENTS, // 1000 cents (R$ 10.00)
      comboQty: 0,
      combosTotalInCents: 0,
      qty: 100,
      totalInCents: 100 * UNIT_PRICE_CENTS,

      setBaseQty: (n: number) => {
        const MIN_QTY = 100
        let newQty = Math.max(MIN_QTY, Math.floor(Number(n) || 0))
        
        set((state) => {
          const baseAmountInCents = newQty * UNIT_PRICE_CENTS
          return {
            baseQty: newQty,
            baseAmountInCents,
            qty: newQty + state.comboQty,
            totalInCents: baseAmountInCents + state.combosTotalInCents,
          }
        })
      },

      handleChangeQuantity: (newTotalQty: number) => {
        const MIN_TOTAL_QTY = 100
        let adjustedTotalQty = Math.max(MIN_TOTAL_QTY, Math.floor(Number(newTotalQty) || 100))

        set((state) => {
          // Calculate new base: total - existing combos
          const newBaseQty = Math.max(100, adjustedTotalQty - state.comboQty)
          const baseAmountInCents = newBaseQty * UNIT_PRICE_CENTS

          return {
            baseQty: newBaseQty,
            baseAmountInCents,
            qty: newBaseQty + state.comboQty,
            totalInCents: baseAmountInCents + state.combosTotalInCents,
          }
        })
      },

      addComboToCart: (quantity: number, priceCents: number) => {
        set((state) => ({
          comboQty: state.comboQty + quantity,
          combosTotalInCents: state.combosTotalInCents + priceCents,
          qty: state.baseQty + state.comboQty + quantity,
          totalInCents: state.baseAmountInCents + state.combosTotalInCents + priceCents,
        }))
      },

      clearCart: () => {
        const MIN_QTY = 100
        set({
          baseQty: MIN_QTY,
          baseAmountInCents: MIN_QTY * UNIT_PRICE_CENTS,
          comboQty: 0,
          combosTotalInCents: 0,
          qty: MIN_QTY,
          totalInCents: MIN_QTY * UNIT_PRICE_CENTS,
        })
      },
    }),
    { name: "cart-storage" },
  ),
)
