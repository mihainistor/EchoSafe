import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { autoStopMiddleware, createDevice, validateDeviceOtpCtrl, updateDeviceCtrl, deleteDeviceCtrl, listDevicesCtrl, getDeviceCtrl, getLocationCtrl, getLocationHistoryCtrl, getReachabilityCtrl, setLiveTrackingCtrl } from '../controllers/devicesController.js'

export const devicesRouter = Router()

devicesRouter.use(autoStopMiddleware)

devicesRouter.use(requireAuth)

devicesRouter.post('/', createDevice)

devicesRouter.post('/:id/validate-otp', validateDeviceOtpCtrl)

devicesRouter.patch('/:id', updateDeviceCtrl)

devicesRouter.delete('/:id', deleteDeviceCtrl)

devicesRouter.get('/', listDevicesCtrl)

devicesRouter.get('/:id', getDeviceCtrl)

devicesRouter.get('/:id/location', rateLimit(60 * 1000, 10, 'orange_location'), getLocationCtrl)

devicesRouter.get('/:id/location-history', rateLimit(60 * 1000, 10, 'orange_location_history'), getLocationHistoryCtrl)

devicesRouter.get('/:id/reachability', getReachabilityCtrl)

devicesRouter.patch('/:id/live-tracking', setLiveTrackingCtrl)
