import express from "express";
import Route from "../models/busRouteModels.js";
import { getCoordinates } from "../utils/geocodeStops.js";

const router = express.Router();

// Helper function to compare stops
function areStopsSame(stops1, stops2) {
  if (stops1.length !== stops2.length) return false;

  // Sort by stop name to ignore order
  const sorted1 = [...stops1].sort((a, b) => a.name.localeCompare(b.name));
  const sorted2 = [...stops2].sort((a, b) => a.name.localeCompare(b.name));

  // Compare each stop name
  return sorted1.every((stop, index) => stop.name === sorted2[index].name);
}
// Add route
router.post("/add", async (req, res) => {
  try {
    const { routeName, destination, stops } = req.body;

    // Check if route already exists
    const existingRoute = await Route.findOne({ routeName });

    if (existingRoute) {
      return res
        .status(400)
        .json({ error: "Route already exists or may stops also" });
    }

    // 1️⃣ Add lat/lng to each stop
    for (let stop of stops) {
      const coords = await getCoordinates(stop.name + " Bhopal");
      stop.lat = coords ? coords.lat : null;
      stop.lng = coords ? coords.lng : null;
    }

    // 2️⃣ Check for existing route with same destination and stops
    const existingRoutes = await Route.find({ destination });

    for (let r of existingRoutes) {
      if (areStopsSame(r.stops, stops)) {
        return res.status(400).json({
          error: "Route with these stops already exists for this destination",
        });
      }
    }

    // 3️⃣ Save the route
    const route = new Route({ routeName, destination, stops });
    await route.save();

    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//for bulking
router.post("/bulk-add", async (req, res) => {
  try {
    const routesData = req.body.routes;

    const savedRoutes = [];

    for (let routeData of routesData) {
      const stops = routeData.stops;

      // 🔥 loop each stop
      for (let stop of stops) {
        const coords = await getCoordinates(stop.name + " Bhopal");

        if (coords) {
          stop.lat = coords.lat;
          stop.lng = coords.lng;
        } else {
          stop.lat = null;
          stop.lng = null;
        }
      }

      const route = new Route({
        routeName: routeData.routeName,
        destination: routeData.destination,
        stops: stops,
      });

      await route.save();
      savedRoutes.push(route);
    }

    res.json(savedRoutes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all routes
router.get("/", async (req, res) => {
  const routes = await Route.find();
  res.json(routes);
});

export default router;
