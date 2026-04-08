import mongoose from "mongoose";

const busSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      required: true,
      unique: true,
    },
    lat: Number,
    lng: Number,
  },
  { timestamps: true },
);

const Bus = mongoose.model("Bus", busSchema);

export default Bus;
