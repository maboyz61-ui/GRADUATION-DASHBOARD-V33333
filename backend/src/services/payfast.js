import { createHash } from 'crypto'
import config from '../config.js'

const SANDBOX_HOST = 'https://sandbox.payfast.co.za/eng/process'
const LIVE_HOST = 'https://www.payfast.co.za/eng/process'

// PayFast requires fields in the exact documented order. Do not reorder.
const FIELD_ORDER = [
  'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
  'name_first', 'name_last', 'email_address',
  'm_payment_id', 'amount', 'item_name', 'item_description',
  'custom_int1', 'custom_str1', 'email_confirmation', 'confirmation_address',
  'payment_method'
]

const DDR_ORDER = [
  'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
  'name_first', 'name_last', 'email_address',
  'm_payment_id', 'amount', 'item_name', 'item_description',
  'custom_int1', 'custom_str1', 'email_confirmation', 'confirmation_address',
  'payment_method',
  'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles'
]

function encodeValue(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, '+').replace(/%2C/g, ',')
}

export function buildSignature(data, passphrase = config.payfast.passphrase, order = FIELD_ORDER) {
  const keys = order.filter((k) => data[k] !== undefined && data[k] !== null && data[k] !== '')
  for (const key of Object.keys(data)) {
    if (!keys.includes(key)) keys.push(key)
  }
  const pairs = keys.map((k) => `${k}=${encodeValue(data[k])}`)
  let query = pairs.join('&')
  if (passphrase) query += `&passphrase=${encodeValue(passphrase)}`
  return createHash('md5').update(query).digest('hex')
}

export function buildPaymentPayload({ order, user }) {
  const payload = {
    merchant_id: config.payfast.merchantId,
    merchant_key: config.payfast.merchantKey,
    return_url: config.payfast.returnUrl,
    cancel_url: config.payfast.cancelUrl,
    notify_url: config.payfast.notifyUrl,
    name_first: (user.name || '').split(' ')[0] || 'Student',
    name_last: (user.name || '').split(' ').slice(1).join(' ') || 'UKZN',
    email_address: user.email,
    m_payment_id: order.id,
    amount: Number(order.total).toFixed(2),
    item_name: 'UKZN Photo Portal order',
    item_description: order.items.map((i) => i.title).join(', ').slice(0, 255),
    custom_str1: order.identifier || '',
    email_confirmation: '1'
  }
  payload.signature = buildSignature(payload)
  return {
    action: config.payfast.sandbox ? SANDBOX_HOST : LIVE_HOST,
    method: 'POST',
    fields: payload
  }
}

export function verifyItnSignature(body) {
  const provided = body.signature
  if (!provided) return false
  const data = { ...body }
  delete data.signature
  const expected = buildSignature(data, config.payfast.passphrase, DDR_ORDER)
  return provided === expected
}
