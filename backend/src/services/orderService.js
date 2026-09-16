import { orderRepo } from '../repositories/orderRepo.js'
import { frameRepo } from '../repositories/frameRepo.js'
import { photoRepo } from '../repositories/photoRepo.js'
import { badRequest, forbidden, notFound } from '../lib/errors.js'

const PRINT_PRICE = 299

// Totals are always recomputed from the catalog. The client only chooses options.
export async function priceItem(item) {
  const photo = await photoRepo.findById(item.photoId)
  if (!photo) throw badRequest(`Unknown photo: ${item.photoId}`, 'unknown_photo')

  const [texture, mat, overlay, size] = await Promise.all([
    item.texture ? frameRepo.findTexture(item.texture) : null,
    item.mat ? frameRepo.findMat(item.mat) : null,
    item.overlay ? frameRepo.findOverlay(item.overlay) : null,
    item.size ? frameRepo.findSize(item.size) : null
  ])
  if (item.texture && !texture) throw badRequest(`Unknown texture: ${item.texture}`, 'unknown_texture')
  if (item.mat && !mat) throw badRequest(`Unknown mat: ${item.mat}`, 'unknown_mat')
  if (item.overlay && !overlay) throw badRequest(`Unknown overlay: ${item.overlay}`, 'unknown_overlay')
  if (item.size && !size) throw badRequest(`Unknown size: ${item.size}`, 'unknown_size')

  const qty = Math.max(1, Math.min(10, Number(item.qty) || 1))
  const unit = photo.price + PRINT_PRICE + (texture?.price || 0) + (mat?.price || 0) + (overlay?.price || 0) + (size?.price || 0)

  return {
    photoId: photo.id,
    title: photo.title,
    kind: item.kind || 'print+frame',
    texture: item.texture || null,
    mat: item.mat || null,
    overlay: item.overlay || null,
    size: item.size || null,
    qty,
    price: Number((unit * qty).toFixed(2))
  }
}

export async function createPendingOrder({ user, items }) {
  if (!Array.isArray(items) || !items.length) throw badRequest('Order requires items', 'empty_order')
  if (items.length > 20) throw badRequest('Too many items in a single order', 'too_many_items')

  const priced = []
  for (const item of items) priced.push(await priceItem(item))
  const total = Number(priced.reduce((s, i) => s + i.price, 0).toFixed(2))

  const paymentRef = `PAYFAST-${Math.random().toString(16).slice(2, 8).toUpperCase()}`
  const order = await orderRepo.create({
    studentId: user.id,
    identifier: user.identifier,
    items: priced,
    total,
    paymentRef
  })
  return order
}

export async function getOrderForUser({ user, orderId }) {
  const order = await orderRepo.findById(orderId)
  if (!order) throw notFound('Order not found', 'order_not_found')
  if (user.role !== 'admin' && order.studentId !== user.id) throw forbidden()
  return order
}

export { PRINT_PRICE }
