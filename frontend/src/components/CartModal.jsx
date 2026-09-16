import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useCart } from '../cart.jsx'
import { HEADSHOT } from '../media.js'

export default function CartModal() {
  const cart = useCart()
  const nav = useNavigate()
  const [pay, setPay] = useState('card')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)
  const item = cart.items[0] || {
    title: 'Professional Headshot - Sarah L. (UKZN Graduation)',
    frame: '1x 8x10 Premium Oak Frame @ R1499.00',
    print: '1x Print (Matte finish) @ R299.00',
    thumb: HEADSHOT,
    photoId: 'pho-101'
  }
  const total = cart.total || 1798

  const payable = cart.items.length
    ? cart.items.map((i) => ({
        photoId: i.photoId,
        texture: i.texture,
        mat: i.mat,
        overlay: i.overlay,
        size: i.size,
        qty: i.qty || 1,
        kind: i.kind || 'print+frame'
      }))
    : [{ photoId: item.photoId, texture: 'oak', size: '8x10', qty: 1 }]

  async function checkout() {
    setBusy(true)
    setMsg('')
    try {
      const data = await api.createOrder({ items: payable })
      setCreated(data)
      setMsg(`Order ${data.order.id} created · awaiting PayFast confirmation`)
      cart.clear()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Hands off to the PayFast hosted checkout exactly as production does.
  function payWithPayFast() {
    const { redirect } = created?.payment || {}
    if (!redirect) return
    const form = document.createElement('form')
    form.method = redirect.method || 'POST'
    form.action = redirect.action
    for (const [key, value] of Object.entries(redirect.fields)) {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="modal" onClick={() => cart.setOpen(false)}>
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h3>My Cart & Checkout</h3>
          <button className="btn ghost sm" onClick={() => cart.setOpen(false)}>×</button>
        </div>
        <div className="checkout-grid">
          <div>
            <div className="row" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
              <img src={item.thumb || HEADSHOT} alt="" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 12 }} />
              <div>
                <b>{item.title}</b>
                <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 13 }}>{item.frame || '1x 8x10 Premium Oak Frame @ R1499.00'}</p>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>{item.print || '1x Print (Matte finish) @ R299.00'}</p>
              </div>
            </div>
            <div className="swatches" style={{ marginBottom: 16 }}>
              <button className="size-chip on">Oak</button>
              <button className="size-chip">8x10</button>
              <button className="size-chip">A4</button>
              <button className="size-chip">11x14</button>
            </div>
            <h4 style={{ margin: '12px 0 8px' }}>Shipping Address</h4>
            <label className="field">Campus Address<input defaultValue="UKZN campus" /></label>
            <label className="field" style={{ marginTop: 8 }}>Address<input defaultValue="UKZN campus Address" /></label>
          </div>
          <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--line)' }}>
            <h4>Order Summary</h4>
            <div className="sum-row"><span>Subtotal:</span><b>R{total.toFixed(2)}</b></div>
            <div className="sum-row"><span>Shipping (Standard):</span><b>Free</b></div>
            <div className="sum-row total"><span>Total:</span><b>R{total.toFixed(2)}</b></div>
            <div style={{ margin: '12px 0' }}>
              <h4 style={{ marginBottom: 8 }}>Payment Method</h4>
              <label style={{ marginRight: 12 }}><input type="radio" checked={pay === 'card'} onChange={() => setPay('card')} /> Credit/Debit</label>
              <label><input type="radio" checked={pay === 'eft'} onChange={() => setPay('eft')} /> EFT</label>
            </div>
            {created ? (
              <>
                <div className="sum-row"><span>Order:</span><b>{created.order.id}</b></div>
                <button className="btn navy full" onClick={payWithPayFast}>Continue to PayFast</button>
                <div className="row" style={{ marginTop: 10, justifyContent: 'center' }}>
                  <button className="btn ghost sm" onClick={() => { cart.setOpen(false); nav('/purchases') }}>View My Orders</button>
                </div>
              </>
            ) : (
              <>
                <button className="btn navy full" disabled={busy} onClick={checkout}>{busy ? 'Processing…' : 'Proceed to Secure Checkout'}</button>
                <div className="row" style={{ marginTop: 10, justifyContent: 'center' }}>
                  <button className="btn ghost sm" onClick={() => cart.setOpen(false)}>Save for Later</button>
                  <button className="btn ghost sm" onClick={() => { cart.setOpen(false); nav('/gallery') }}>Continue Shopping</button>
                </div>
              </>
            )}
            {msg && <p style={{ color: 'var(--muted)', marginTop: 10 }}>{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
