import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import router from "./routes/busRouteRoutes.js";
import busLocationRoutes from "./routes/busLocationRoutes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/routes", router);
app.use("/location", busLocationRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
