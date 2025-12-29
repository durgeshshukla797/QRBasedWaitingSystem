import mongoose, { Schema } from "mongoose";

const shopSchema = new Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    qrCodeValue: { // it will be contain shopId
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    isActive: { // help to Disable shop without deleting it
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
