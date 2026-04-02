import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Bus from "./models/busModels.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/location", async (req, res) => {
  const { busId, lat, lng } = req.body;

  if (!busId || lat == null || lng == null) {
    return res.status(400).send({ error: "Missing fields" });
  }

  try {
    await Bus.findOneAndUpdate({ busId }, { lat, lng }, { upsert: true });

    res.send({ message: "Saved to DB" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to save data" });
  }
});

app.get("/location", async (req, res) => {
  try {
    const buses = await Bus.find();
    res.send(buses);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch data" });
  }
});

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
