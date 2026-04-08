import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import busRouter from "./routes/busRoutes.js";
import routeRouter from "./routes/RouteRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/bus", busRouter);
app.use("/route", routeRouter);

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
