import { Router } from 'express'
import { userRepo } from '../repositories/userRepo.js'
import { photoRepo } from '../repositories/photoRepo.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { newIdentifier } from '../lib/crypto.js'
import { notFound } from '../lib/errors.js'

const router = Router()

router.get('/:code', requireAuth, async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase()
    const students = await userRepo.listStudents()
    const student = students.find((s) => s.identifier === code) || null
    const photoCount = await photoRepo.countByIdentifier(code)
    res.json({
      code,
      student: student ? { id: student.id, name: student.name, campus: student.campus, faculty: student.faculty } : null,
      photoCount
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const student = await userRepo.findById(req.body.studentId)
    if (!student) throw notFound('Student not found', 'student_not_found')
    const updated = await userRepo.setIdentifier(student.id, newIdentifier())
    res.json({ student: updated })
  } catch (err) {
    next(err)
  }
})

export default router
