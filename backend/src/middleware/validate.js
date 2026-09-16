import { badRequest } from '../lib/errors.js'

// Minimal schema helper: { field: { type, required, min, max, pattern, enum } }
export function validateBody(schema) {
  return (req, _res, next) => {
    const errors = {}
    const body = req.body || {}
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field]
      if (value === undefined || value === null || value === '') {
        if (rules.required) errors[field] = 'is required'
        continue
      }
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (rules.type && actualType !== rules.type) {
        errors[field] = `must be a ${rules.type}`
        continue
      }
      if (rules.type === 'string') {
        if (rules.min && value.length < rules.min) errors[field] = `must be at least ${rules.min} characters`
        if (rules.max && value.length > rules.max) errors[field] = `must be at most ${rules.max} characters`
        if (rules.pattern && !rules.pattern.test(value)) errors[field] = 'is invalid'
        if (rules.enum && !rules.enum.includes(value)) errors[field] = `must be one of: ${rules.enum.join(', ')}`
      }
      if (rules.type === 'array') {
        if (rules.min && value.length < rules.min) errors[field] = `must have at least ${rules.min} items`
        if (rules.max && value.length > rules.max) errors[field] = `must have at most ${rules.max} items`
      }
    }
    if (Object.keys(errors).length) return next(badRequest('Validation failed', 'validation_failed', errors))
    next()
  }
}
