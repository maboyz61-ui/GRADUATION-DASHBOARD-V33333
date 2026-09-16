import config from '../config.js'

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const threshold = LEVELS[config.logLevel] ?? LEVELS.info

function emit(level, message, meta) {
  if (LEVELS[level] > threshold) return
  const entry = { ts: new Date().toISOString(), level, message, ...(meta || {}) }
  const line = JSON.stringify(entry)
  if (level === 'error') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

export const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta)
}

export default logger
