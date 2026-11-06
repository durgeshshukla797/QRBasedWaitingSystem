import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, signupSchema } from "../validator/auth.validator.js";
import { logout, signup, getUser, login } from "../controllers/auth.controller.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router =Router();


router.post('/signup',authLimiter,validate(signupSchema),signup);
router.post('/login',authLimiter,validate(loginSchema),login);
router.post('/logout',logout);
router.get('/me',requireAuth,getUser);

export default router;