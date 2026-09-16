import { createContext, useContext, useMemo, useState } from 'react'

const CartCtx = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  const api = useMemo(() => ({
    items,
    open,
    setOpen,
    add(item) {
      setItems((cur) => [...cur, { cartId: `${Date.now()}-${cur.length}`, qty: 1, ...item }])
      setOpen(true)
    },
    remove(cartId) {
      setItems((cur) => cur.filter((i) => i.cartId !== cartId))
    },
    clear() {
      setItems([])
    },
    count: items.reduce((s, i) => s + (i.qty || 1), 0),
    total: items.reduce((s, i) => s + Number(i.price || 0) * (i.qty || 1), 0)
  }), [items, open])

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>
}

export function useCart() {
  return useContext(CartCtx)
}
