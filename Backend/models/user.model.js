import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
   name:{
       type:String,
       required:true,
       trim:true //built-in setter that automatically removes all leading and trailing whitespace from a string before saving it to the database. 
   },
   email:{
         type:String,
       required:true,
       unique:true,
       lowercase:true,
       trim:true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
   },
   role:{
        type:String,
       required:true,
       enum:['staff','owner'],
       default:'staff',
       trim:true
   },
   password:{
       type:String,
       required:true,
   },
   isActive: {// help to disable a staff account without deleting it
     type: Boolean,
     default: true
  },
   refreshToken:{
      type:String
   }
},{timestamps:true})

const User = mongoose.model('User',userSchema)

export default User;