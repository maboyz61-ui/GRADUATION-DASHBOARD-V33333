export class AppError extends Error {
  constructor(message, { status = 500, code = 'internal_error', details } = {}) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
    this.expose = status < 500
  }
}

export const badRequest = (message, code = 'bad_request', details) =>
  new AppError(message, { status: 400, code, details })

export const unauthorized = (message = 'Unauthorized', code = 'unauthorized') =>
  new AppError(message, { status: 401, code })

export const forbidden = (message = 'Forbidden', code = 'forbidden') =>
  new AppError(message, { status: 403, code })

export const notFound = (message = 'Not found', code = 'not_found') =>
  new AppError(message, { status: 404, code })

export const conflict = (message, code = 'conflict') =>
  new AppError(message, { status: 409, code })
