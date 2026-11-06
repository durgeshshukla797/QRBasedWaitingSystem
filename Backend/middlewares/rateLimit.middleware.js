import rateLimit from 'express-rate-limit'

//This allows 10 join attempts per IP per 15 minutes, 
//which stops someone from flooding a queue with fake entries.
export const joinLimiter=rateLimit({
  windowMs:15*60*1000,//15 mintes in milliseconds
  limit:10,
  standardHeaders:true,
  legacyHeaders:false,
  message:{
    message:'Too many request,please try again later'  
  },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many code requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});