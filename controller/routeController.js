import Route from "../models/routeModels.js";
import { getCoordinates } from "../utils/geocodeStops.js";

// Helper: compare stops (order-independent)
function areStopsSame(stops1, stops2) {
  if (stops1.length !== stops2.length) return false;

  const names1 = stops1.map((s) => s.name.toLowerCase().trim()).sort();
  const names2 = stops2.map((s) => s.name.toLowerCase().trim()).sort();

  return names1.every((name, i) => name === names2[i]);
}

export const createRoute = async (req, res) => {
  try {
    const { routeName, destination, stops } = req.body;

    // ✅ 1. Basic validation
    if (!routeName || !destination || !Array.isArray(stops)) {
      return res.status(400).json({
        error: "routeName, destination and stops are required",
      });
    }

    if (stops.length === 0) {
      return res.status(400).json({
        error: "At least one stop is required",
      });
    }

    // ✅ 2. Validate each stop (name + orderIndex)
    for (let stop of stops) {
      if (!stop.name || typeof stop.name !== "string") {
        return res.status(400).json({
          error: "Each stop must have a valid name",
        });
      }

      if (
        stop.orderIndex === undefined ||
        typeof stop.orderIndex !== "number" ||
        stop.orderIndex < 0
      ) {
        return res.status(400).json({
          error: "Each stop must have a valid orderIndex (non-negative number)",
        });
      }
    }

    // ✅ 3. Check duplicate stop names
    const stopNames = stops.map((s) => s.name.toLowerCase().trim());
    const uniqueStopNames = new Set(stopNames);

    if (stopNames.length !== uniqueStopNames.size) {
      return res.status(400).json({
        error: "Duplicate stops are not allowed",
      });
    }

    // ✅ 4. Check duplicate orderIndex
    const orderIndexes = stops.map((s) => s.orderIndex);
    const uniqueIndexes = new Set(orderIndexes);

    if (orderIndexes.length !== uniqueIndexes.size) {
      return res.status(400).json({
        error: "Duplicate orderIndex values are not allowed",
      });
    }

    // ✅ 5. Ensure orderIndex is continuous (0 → n-1)
    const sortedIndexes = [...orderIndexes].sort((a, b) => a - b);

    for (let i = 0; i < sortedIndexes.length; i++) {
      if (sortedIndexes[i] !== i) {
        return res.status(400).json({
          error: "orderIndex must be continuous starting from 0",
        });
      }
    }

    // ✅ 6. Check duplicate routeName
    const existingRoute = await Route.findOne({ routeName });
    if (existingRoute) {
      return res.status(400).json({
        error: "Route with this name already exists",
      });
    }

    // ✅ 7. Check duplicate stops for same destination
    const existingRoutes = await Route.find({ destination });

    for (let r of existingRoutes) {
      if (areStopsSame(r.stops, stops)) {
        return res.status(400).json({
          error: "Route with same stops already exists for this destination",
        });
      }
    }

    // ✅ 8. Add coordinates (non-mutating)
    const updatedStops = await Promise.all(
      stops.map(async (stop) => {
        const coords = await getCoordinates(stop.name + " Bhopal");

        return {
          name: stop.name,
          orderIndex: stop.orderIndex,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        };
      }),
    );

    // ✅ 9. Sort stops by orderIndex before saving (important!)
    updatedStops.sort((a, b) => a.orderIndex - b.orderIndex);

    // ✅ 10. Save route
    const newRoute = new Route({
      routeName,
      destination,
      stops: updatedStops,
    });

    await newRoute.save();

    res.status(201).json({
      message: "Route created successfully",
      route: newRoute,
    });
  } catch (err) {
    console.error("Create Route Error:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
};

//update route
export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { routeName, destination, stops } = req.body;

    // ✅ 1. Find existing route
    const existingRoute = await Route.findById(id);
    if (!existingRoute) {
      return res.status(404).json({ error: "Route not found" });
    }

    // ✅ 2. Basic validation
    if (!routeName || !destination || !Array.isArray(stops)) {
      return res.status(400).json({
        error: "routeName, destination and stops are required",
      });
    }

    if (stops.length === 0) {
      return res.status(400).json({
        error: "At least one stop is required",
      });
    }

    // ✅ 3. Validate stops
    for (let stop of stops) {
      if (!stop.name || typeof stop.name !== "string") {
        return res.status(400).json({
          error: "Each stop must have a valid name",
        });
      }

      if (
        stop.orderIndex === undefined ||
        typeof stop.orderIndex !== "number" ||
        stop.orderIndex < 0
      ) {
        return res.status(400).json({
          error: "Each stop must have valid orderIndex",
        });
      }
    }

    // ✅ 4. Duplicate checks
    const stopNames = stops.map((s) => s.name.toLowerCase().trim());
    if (new Set(stopNames).size !== stopNames.length) {
      return res
        .status(400)
        .json({ error: "Duplicate stop names not allowed" });
    }

    const orderIndexes = stops.map((s) => s.orderIndex);
    if (new Set(orderIndexes).size !== orderIndexes.length) {
      return res
        .status(400)
        .json({ error: "Duplicate orderIndex not allowed" });
    }

    const sortedIndexes = [...orderIndexes].sort((a, b) => a - b);
    for (let i = 0; i < sortedIndexes.length; i++) {
      if (sortedIndexes[i] !== i) {
        return res.status(400).json({
          error: "orderIndex must be continuous starting from 0",
        });
      }
    }

    // ✅ 5. Route name duplicate check
    const routeWithSameName = await Route.findOne({
      routeName,
      _id: { $ne: id },
    });

    if (routeWithSameName) {
      return res.status(400).json({
        error: "Another route with this name already exists",
      });
    }

    // ✅ 6. Stops duplicate check for same destination
    const existingRoutes = await Route.find({
      destination,
      _id: { $ne: id },
    });

    for (let r of existingRoutes) {
      if (areStopsSame(r.stops, stops)) {
        return res.status(400).json({
          error: "Another route with same stops exists",
        });
      }
    }

    // ✅ 7. Create map of old stops (for quick lookup)
    const oldStopsMap = new Map();
    existingRoute.stops.forEach((stop) => {
      oldStopsMap.set(stop.name.toLowerCase().trim(), stop);
    });

    // ✅ 8. Smart coordinate update
    const updatedStops = await Promise.all(
      stops.map(async (stop) => {
        const key = stop.name.toLowerCase().trim();
        const oldStop = oldStopsMap.get(key);

        // 🔥 If stop exists and name unchanged → reuse coordinates
        if (oldStop) {
          return {
            name: stop.name,
            orderIndex: stop.orderIndex,
            lat: oldStop.lat,
            lng: oldStop.lng,
          };
        }

        // 🔥 New or renamed stop → fetch coordinates
        const coords = await getCoordinates(stop.name + " Bhopal");

        return {
          name: stop.name,
          orderIndex: stop.orderIndex,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        };
      }),
    );

    // ✅ 9. Sort stops
    updatedStops.sort((a, b) => a.orderIndex - b.orderIndex);

    // ✅ 10. Update route
    existingRoute.routeName = routeName;
    existingRoute.destination = destination;
    existingRoute.stops = updatedStops;

    await existingRoute.save();

    res.json({
      message: "Route updated successfully",
      route: existingRoute,
    });
  } catch (err) {
    console.error("Update Route Error:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
};

//add bulk routes
export const bulkCreateRoute = async (req, res) => {
  try {
    const routesData = req.body.routes;

    if (!Array.isArray(routesData) || routesData.length === 0) {
      return res.status(400).json({ error: "routes array is required" });
    }

    const savedRoutes = [];

    for (let routeData of routesData) {
      if (
        !routeData.routeName ||
        !routeData.destination ||
        !Array.isArray(routeData.stops)
      ) {
        return res.status(400).json({ error: "Invalid route data structure" });
      }

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
};

//get all routes
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};

//get specific route by id
export const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional but best practice: validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Route ID format" });
    }

    const route = await Route.findById(id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json(route);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};
//detele route by id
export const deleteRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Route ID format" });
    }

    const deletedRoute = await Route.findByIdAndDelete(id);

    if (!deletedRoute) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json({ message: "Route deleted successfully", deletedRoute });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
