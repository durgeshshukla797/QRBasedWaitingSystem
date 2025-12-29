import mongoose, { Schema } from "mongoose";

const tokenSchema = new Schema(
  {
    shopId: {// ye unique nahi ho sakta varna only one token can exist per shop
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    customerEmail: { //A customer may: Visit the same shop again OR Visit another shop With unique: true, they can never take another token & Email uniqueness should be per token, not global
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    tokenNumber: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["waiting", "called", "served"],
      default: "waiting"
    }
  },
  { timestamps: true }
);

const Token = mongoose.model("Token", tokenSchema);
export default Token;
