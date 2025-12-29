import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true
    },

    otpCode: {
      type: String,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    attempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
