import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    api.orders().then((d) => setOrders(d.orders || [])).catch(() => {})
  }, [])

  return (
    <div>
      <div className="section-head">
        <div>
          <h3>My Cart & Checkout</h3>
          <p>PayFast orders linked to your UKZN identifier.</p>
        </div>
        <button className="btn ghost" onClick={() => nav('/gallery')}>&lt; back to gallery</button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Order</th><th>Identifier</th><th>Status</th><th>Payment</th><th>Total</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.identifier}</td>
                <td><span className="tag ok">{o.status}</span></td>
                <td>{o.paymentRef}</td>
                <td className="price">R {o.total}</td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan="5">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
