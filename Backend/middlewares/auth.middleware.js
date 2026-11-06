import { verifyToken } from "../utils/token.util.js";

// we should make middleware which checks for whether user login or not 

export const requireAuth= async(req,res,next)=>{
  // first take token from cookie
  // then verify that token
  // after decoding token we'll get id which we will store it in req.merchantId from where we can use it in other modules
  
    const token =req.cookies?.token;
   if(!token) return res.status(401).json({message:'Please log in'});

   try {
     const payload=verifyToken(token);
     req.merchantId=payload.id;
     next();
   } catch (error) {
      return res.status(401).json({message:'Session Expired,please log in again'});
   }
};

