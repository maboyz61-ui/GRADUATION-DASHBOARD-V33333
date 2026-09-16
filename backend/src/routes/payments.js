import { Router } from 'express'
import { orderRepo } from '../repositories/orderRepo.js'
import { verifyItnSignature } from '../services/payfast.js'
import { badRequest, notFound } from '../lib/errors.js'
import logger from '../lib/logger.js'

const router = Router()

router.post('/payfast/itn', async (req, res, next) => {
  try {
    const body = req.body || {}
    if (!verifyItnSignature(body)) {
      logger.warn('payfast itn rejected: bad signature', { ref: body.m_payment_id })
      throw badRequest('Invalid signature', 'invalid_signature')
    }

    const orderId = body.m_payment_id
    const order = await orderRepo.findById(orderId)
    if (!order) throw notFound('Order not found', 'order_not_found')

    const paid = Number(body.amount_gross || body.amount || 0)
    if (Math.abs(paid - order.total) > 0.01) {
      await orderRepo.recordPaymentEvent({ orderId, paymentRef: body.pf_payment_id, status: 'amount_mismatch', amount: paid, raw: body })
      logger.warn('payfast itn amount mismatch', { orderId, expected: order.total, received: paid })
      throw badRequest('Amount mismatch', 'amount_mismatch')
    }

    // Idempotent: re-delivered ITNs must not double-apply.
    if (order.status === 'paid') {
      return res.json({ ok: true, orderId, status: 'paid', idempotent: true })
    }

    const status = String(body.payment_status || 'COMPLETE').toUpperCase() === 'COMPLETE' ? 'paid' : 'failed'
    const updated = await orderRepo.updateStatus(orderId, status)
    await orderRepo.recordPaymentEvent({ orderId, paymentRef: body.pf_payment_id, status, amount: paid, raw: body })
    logger.info('payfast itn applied', { orderId, status })
    res.json({ ok: true, orderId, status: updated.status })
  } catch (err) {
    next(err)
  }
})

export default router
