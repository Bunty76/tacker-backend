import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  time: String,
  lat: Number,
  lng: Number,
  orderIndex: {
    type: Number,
    required: true,
    min: 0,
  },
});

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    destination: String,
    stops: [stopSchema],
  },
  {
    timestamps: true, // automatically add createdAt and updatedAt
  },
);

export default mongoose.model("Route", routeSchema);
