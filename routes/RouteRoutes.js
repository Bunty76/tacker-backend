import express from "express";
const router = express.Router();
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  deleteRouteById,
  bulkCreateRoute,
  updateRoute,
} from "../controller/routeController.js";

// Add route
router.post("/", createRoute);

//for bulking
router.post("/bulk-add", bulkCreateRoute);

// Get all routes
router.get("/", getAllRoutes);

// Get a specific route by ID
router.get("/:id", getRouteById);

// Update a route by ID
router.put("/:id", updateRoute);

// Delete a route by ID
router.delete("/:id", deleteRouteById);
export default router;
