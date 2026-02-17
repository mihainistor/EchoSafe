import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMe, patchMe } from '../controllers/usersController.js'

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get('/me', getMe)

usersRouter.patch('/me', patchMe)
