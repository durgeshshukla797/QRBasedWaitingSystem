import { Router } from 'express';
import {
  getQueueInfo,
  joinQueue,
  getEntryStatus,
  leaveQueue,
  sendOtp,
  listPublicShops,
  getPublicShop
} from '../controllers/public.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { joinLimiter,otpLimiter } from '../middlewares/rateLimit.middleware.js';
import { joinQueueSchema,sendOtpSchema } from '../validator/customers.validator.js';

const router = Router();

router.get('/shops', listPublicShops);
router.get('/shops/:shopId', getPublicShop);

router.get('/q/:slug', getQueueInfo);
router.post('/q/:slug/join', joinLimiter, validate(joinQueueSchema), joinQueue);
router.post('/q/:slug/otp', otpLimiter, validate(sendOtpSchema), sendOtp);

router.get('/entry/:entryKey', getEntryStatus);
router.post('/entry/:entryKey/leave', leaveQueue);

export default router;