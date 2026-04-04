import express from "express";
const router = express.Router();
import Bus from "../models/busModels.js";
import axios from "axios";

async function snapToRoad(lat, lng) {
  try {
    console.log("in snap");
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${lat},${lng}&key=${process.env.Google_API_KEY}`;

    const response = await axios.get(url);
    console.log(response);
    if (response.data.snappedPoints.length > 0) {
      console.log(response.data.snappedPoints[0].location);
      return response.data.snappedPoints[0].location;
    }

    return { latitude: lat, longitude: lng }; // fallback
  } catch (error) {
    console.log("Snap error:", error.message);
    return { latitude: lat, longitude: lng }; // fallback
  }
}
router.post("/", async (req, res) => {
  const { busId, lat, lng } = req.body;

  if (!busId || lat == null || lng == null) {
    return res.status(400).send({ error: "Missing fields" });
  }
  // 🔥 SNAP TO ROAD
  const snapped = await snapToRoad(lat, lng);
  try {
    await Bus.findOneAndUpdate(
      { busId },
      { lat: snapped.latitude, lng: snapped.longitude },
      { upsert: true },
    );
    console.log("location recieved and saved or updated");
    res.send({ message: "Saved to DB" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Failed to save data" });
  }
});

router.get("/", async (req, res) => {
  try {
    const buses = await Bus.find();
    res.send(buses);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch data" });
  }
});

export default router;
