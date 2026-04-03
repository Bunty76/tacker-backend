import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  name: String,
  time: String,
  lat: Number,
  lng: Number,
  order: Number,
});

const routeSchema = new mongoose.Schema({
  routeName: String,
  destination: String,
  stops: [stopSchema],
});

export default mongoose.model("Route", routeSchema);
