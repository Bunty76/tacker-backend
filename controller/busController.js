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

//create bus with road coordinates
export const createBus = async (req, res) => {
  const { busId, lat, lng } = req.body;

  if (!busId || !lat || !lng) {
    return res.status(400).send({ error: "Missing fields" });
  }
  // 🔥 SNAP TO ROAD for only on road
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
};

// Get all buses
export const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
    res.send(buses);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch data", details: err.message });
  }
};

// Get a specific location of bus by ID
export const getBusById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const bus = await Bus.findById(id);

    if (!bus) {
      return res.status(404).json({ message: "bus not found" });
    }

    res.json(bus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};

// Delete a location by ID
export const deleteBusById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deletedBus = await Bus.findByIdAndDelete(id);

    if (!deletedBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json({ message: "Bus deleted successfully", deletedBus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
