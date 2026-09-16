export function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    studentNumber: row.student_number || undefined,
    name: row.name,
    email: row.email,
    campus: row.campus || undefined,
    faculty: row.faculty || undefined,
    degree: row.degree || undefined,
    identifier: row.identifier || undefined,
    role: row.role,
    status: row.status,
    department: row.department || undefined,
    avatarHue: row.avatar_hue ?? undefined
  }
}

export function mapPhoto(row) {
  if (!row) return null
  return {
    id: row.id,
    studentId: row.student_id,
    identifier: row.identifier,
    title: row.title,
    eventId: row.event_id,
    eventName: row.event_name,
    campus: row.campus,
    capturedAt: row.captured_at,
    resolution: row.resolution,
    fileSize: row.file_size,
    s3Key: row.s3_key,
    storageKey: row.storage_key,
    price: Number(row.price),
    tagged: Boolean(row.tagged),
    moderated: Boolean(row.moderated),
    favourite: Boolean(row.favourite),
    type: row.photo_type,
    location: row.location,
    url: row.url,
    thumbUrl: row.thumb_url
  }
}

export function mapEvent(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    campus: row.campus,
    date: row.event_date,
    status: row.status,
    photos: Number(row.photos),
    photographers: Number(row.photographers)
  }
}

export function mapFrame(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    family: row.family || undefined,
    hex: row.hex || undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    price: Number(row.price)
  }
}

export function mapOrderItem(row) {
  return {
    id: row.id,
    photoId: row.photo_id,
    title: row.title,
    kind: row.kind,
    texture: row.texture,
    mat: row.mat,
    overlay: row.overlay,
    size: row.size,
    qty: Number(row.qty),
    price: Number(row.price)
  }
}

export function mapOrder(row, items = []) {
  if (!row) return null
  return {
    id: row.id,
    studentId: row.student_id,
    identifier: row.identifier,
    status: row.status,
    total: Number(row.total),
    paymentRef: row.payment_ref,
    gateway: row.gateway,
    createdAt: row.created_at,
    items
  }
}
