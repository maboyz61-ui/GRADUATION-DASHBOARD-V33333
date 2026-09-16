import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { dirname, join, normalize } from 'path'
import { createHash } from 'crypto'
import config from '../config.js'
import { badRequest } from '../lib/errors.js'

function localAdapter() {
  const root = config.storage.localDir
  return {
    driver: 'local',
    async put(key, buffer) {
      const safe = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '')
      const target = join(root, safe)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, buffer)
      return { key: safe, url: `${config.storage.publicPath}/${safe}` }
    },
    async signedUrl(key, ttlSeconds = 900) {
      return { url: `${config.storage.publicPath}/${key}`, expiresIn: ttlSeconds }
    },
    async exists(key) {
      return existsSync(join(root, key))
    }
  }
}

async function s3Adapter() {
  let s3
  try {
    s3 = await import('@aws-sdk/client-s3')
    await import('@aws-sdk/s3-request-presigner')
  } catch {
    const err = new Error("STORAGE_DRIVER=s3 requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner")
    err.name = 'ConfigError'
    throw err
  }
  const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } = s3
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  const { bucket, region, endpoint, accessKeyId, secretAccessKey } = config.storage.s3

  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    ...(accessKeyId ? { credentials: { accessKeyId, secretAccessKey } } : {})
  })

  return {
    driver: 's3',
    async put(key, buffer, contentType = 'image/jpeg') {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }))
      return { key, url: `s3://${bucket}/${key}` }
    },
    async signedUrl(key, ttlSeconds = config.storage.s3.signedUrlTtl) {
      const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: ttlSeconds })
      return { url, expiresIn: ttlSeconds }
    },
    async exists(key) {
      try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        return true
      } catch {
        return false
      }
    }
  }
}

let adapterPromise = null

async function getAdapter() {
  if (!adapterPromise) {
    adapterPromise = config.storage.driver === 's3' ? s3Adapter() : Promise.resolve(localAdapter())
  }
  return adapterPromise
}

export function buildObjectKey({ eventId, identifier, photoId, ext = 'jpg' }) {
  const safe = (v, fallback) => String(v || fallback).replace(/[^a-zA-Z0-9._-]/g, '')
  return `events/${safe(eventId, 'unassigned')}/${safe(identifier, 'unknown')}/${safe(photoId, createHash('sha1').update(String(Date.now())).digest('hex').slice(0, 10))}.${ext}`
}

export const storage = {
  async put({ key, buffer, contentType }) {
    if (!buffer || !buffer.length) throw badRequest('Empty upload', 'empty_upload')
    const adapter = await getAdapter()
    return adapter.put(key, buffer, contentType)
  },
  async signedUrl(key, ttlSeconds) {
    const adapter = await getAdapter()
    return adapter.signedUrl(key, ttlSeconds)
  },
  async driver() {
    return (await getAdapter()).driver
  }
}
