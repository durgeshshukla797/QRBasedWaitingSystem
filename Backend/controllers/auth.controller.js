import pool from "../db/db.js";
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { signToken,cookieOptions } from "../utils/token.util.js";


export const signup= async(req, res, next)=>{
   try {
      const {name,email,password} = req.body;
      
      const passwordHash= await hashPassword(password);
      
      const [result]=await pool.query(
        'INSERT INTO merchants (name,email,password_hash) VALUES (?,?,?)',[name,email,passwordHash]);
      
      
        //result is array of objects 
      return res.status(201).json({
        message:'User created successfully',
        id:result.insertId,
        name,
        email
      });
   }catch (error) {
    if(error.code=='ER_DUP_ENTRY'){
      return res.status(400).json({
        message:'User already exists',
      });
    }
    next(error);
  }

}

export const login=async(req,res,next)=>{
     try {
        const{email,password}=req.body;

        const[rows]=await pool.query(
          'select id,name,email,password_hash FROM merchants WHERE email=?',
          [email]
        );

        const merchant=rows[0];

        //custom error Same message for "no such email", "Google-only account" and "wrong password"
        const invalid = () =>
          res.status(401).json({ message: 'Invalid email or password' });

        if(!merchant || !merchant.password_hash) return invalid();
        
        const isPasswordValid = await comparePassword(password, merchant.password_hash);
        if(!isPasswordValid) return invalid();

        //agr password sahi hai to create token and store it in cookies

        const token =signToken(merchant.id);
        res.cookie('token',token,cookieOptions);


        return res.status(200).json({
          id:merchant.id,
          name:merchant.name,
          email:merchant.email,
        });

     } catch (error) {
        next(error);
     } 
};

export const logout=(req,res)=>{
  //logout karne ke liye sirf cookie me store token ko clear krna hai
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });//It clears the authentication cookie named token from the browser
  res.json({ message: 'Logged out' });
}

export const getUser=async(req,res,next)=>{
  try {
    const [rows] =await pool.query(
      'select id,name,email from merchants where id=?',
      [req.merchantId]
    );
     
     if(!rows[0]) return res.status(401).json({ message: 'Account no longer exists' });
     else res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}