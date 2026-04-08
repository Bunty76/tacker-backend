import express from "express";
const router = express.Router();
import {
  createBus,
  getAllBuses,
  deleteBusById,
  getBusById,
} from "../controller/busController.js";

//create bus with road coordinates
router.post("/", createBus);

//get all buses
router.get("/", getAllBuses);

// Get a specific location of bus by ID
router.get("/:id", getBusById);

// Delete a location by ID
router.delete("/:id", deleteBusById);

export default router;
