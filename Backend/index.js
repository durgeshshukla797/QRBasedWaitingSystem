import dotenv from 'dotenv'
dotenv.config({quiet:true});

import express from 'express';
import cors from 'cors'
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';


const app=express();

// configure middleware
app.use(cors());
app.use(express.json())
app.use(cookieParser());

// connect the server
app.listen(process.env.PORT || 3000,()=>{
  console.log(`Server is running at port ${process.env.PORT}`);
})

// connect the database
mongoose.connect(process.env.MONGODB_URL)
        .then(()=>{
          console.log("Mongodb Connected");
        })
        .catch((err)=>{
             console.log("Error In Mongodb Connection", err);
            process.exit(1);
        })

