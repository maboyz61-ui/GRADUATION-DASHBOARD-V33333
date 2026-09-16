import { Router } from 'express'
import { orderRepo } from '../repositories/orderRepo.js'
import { createPendingOrder, getOrderForUser } from '../services/orderService.js'
import { buildPaymentPayload } from '../services/payfast.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { notFound } from '../lib/errors.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orders = await orderRepo.list({ userId: req.user.id, role: req.user.role })
    res.json({ orders })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, validateBody({
  items: { type: 'array', required: true, min: 1, max: 20 }
}), async (req, res, next) => {
  try {
    const order = await createPendingOrder({ user: req.user, items: req.body.items })
    res.status(201).json({
      order,
      payment: {
        gateway: 'PayFast',
        status: order.status,
        reference: order.paymentRef,
        redirect: buildPaymentPayload({ order, user: req.user })
      }
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    res.json({ order: await getOrderForUser({ user: req.user, orderId: req.params.id }) })
  } catch (err) {
    next(err)
  }
})

export default router
