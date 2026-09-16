const env = process.env

function bool(value, fallback = false) {
  if (value === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function int(value, fallback) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

const nodeEnv = env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'
const isTest = nodeEnv === 'test'

const config = {
  nodeEnv,
  isProduction,
  isTest,
  port: int(env.PORT, 3001),
  corsOrigin: env.CORS_ORIGIN || (isProduction ? '' : '*'),

  database: {
    driver: env.DATABASE_DRIVER || 'sqlite',
    url: env.DATABASE_URL || (isTest ? ':memory:' : './data/dev.db')
  },

  auth: {
    jwtSecret: env.JWT_SECRET || 'dev-insecure-secret-change-me',
    jwtExpiresIn: int(env.JWT_EXPIRES_IN_SECONDS, 12 * 60 * 60),
    codeTtlSeconds: int(env.ACCESS_CODE_TTL_SECONDS, 300),
    oidc: {
      issuer: env.OIDC_ISSUER || 'https://sso.ukzn.ac.za',
      clientId: env.OIDC_CLIENT_ID || 'ukzn-photo-portal',
      clientSecret: env.OIDC_CLIENT_SECRET || ''
    }
  },

  storage: {
    driver: env.STORAGE_DRIVER || 'local',
    localDir: env.STORAGE_LOCAL_DIR || './data/media',
    publicPath: '/media',
    s3: {
      bucket: env.S3_BUCKET || '',
      region: env.S3_REGION || 'af-south-1',
      endpoint: env.S3_ENDPOINT || '',
      accessKeyId: env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
      signedUrlTtl: int(env.S3_SIGNED_URL_TTL, 900)
    }
  },

  payfast: {
    merchantId: env.PAYFAST_MERCHANT_ID || '10000100',
    merchantKey: env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
    passphrase: env.PAYFAST_PASSPHRASE || '',
    sandbox: bool(env.PAYFAST_SANDBOX, true),
    returnUrl: env.PAYFAST_RETURN_URL || 'http://localhost:5173/purchases',
    cancelUrl: env.PAYFAST_CANCEL_URL || 'http://localhost:5173/purchases',
    notifyUrl: env.PAYFAST_NOTIFY_URL || 'http://localhost:3001/api/v1/payments/payfast/itn'
  },

  logLevel: env.LOG_LEVEL || (isTest ? 'error' : 'info')
}

export function validateConfig() {
  const problems = []
  if (config.isProduction) {
    if (!config.corsOrigin) problems.push('CORS_ORIGIN is required in production')
    if (config.auth.jwtSecret.length < 32) problems.push('JWT_SECRET must be at least 32 characters in production')
    if (config.database.driver === 'postgres' && !env.DATABASE_URL) problems.push('DATABASE_URL is required when DATABASE_DRIVER=postgres')
    if (config.storage.driver === 's3' && !config.storage.s3.bucket) problems.push('S3_BUCKET is required when STORAGE_DRIVER=s3')
  }
  if (!['sqlite', 'postgres'].includes(config.database.driver)) {
    problems.push(`Unsupported DATABASE_DRIVER: ${config.database.driver}`)
  }
  if (!['local', 's3'].includes(config.storage.driver)) {
    problems.push(`Unsupported STORAGE_DRIVER: ${config.storage.driver}`)
  }
  if (problems.length) {
    const err = new Error(`Invalid configuration:\n- ${problems.join('\n- ')}`)
    err.name = 'ConfigError'
    throw err
  }
  return config
}

export default config
