
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Get the logged-in user's saved Tasbih data
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("tasbihData");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ tasbihData: user.tasbihData || {} });
  } catch (error) {
    console.error("Load Tasbih data error:", error.message);
    res.status(500).json({ message: "Unable to load Tasbih data." });
  }
});

// Save the logged-in user's Tasbih data
router.put("/", auth, async (req, res) => {
  try {
    const { tasbihData } = req.body;

    if (
      !tasbihData ||
      typeof tasbihData !== "object" ||
      Array.isArray(tasbihData)
    ) {
      return res.status(400).json({
        message: "Please provide valid Tasbih data.",
      });
    }

    // Limit payload size and avoid accepting arbitrary objects.
    if (JSON.stringify(tasbihData).length > 20000) {
      return res.status(413).json({
        message: "Tasbih data is too large.",
      });
    }

    const allowedKeys = [
      "counts",
      "customTargets",
      "darkMode",
      "totalToday",
      "savedDate",
      "soundEnabled",
      "vibrationEnabled",
      "beadMode",
    ];

    const cleanData = {};

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(tasbihData, key)) {
        cleanData[key] = tasbihData[key];
      }
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.tasbihData = cleanData;
    user.markModified("tasbihData");
    await user.save();

    res.json({
      message: "Tasbih progress saved successfully.",
      tasbihData: user.tasbihData,
    });
  } catch (error) {
    console.error("Save Tasbih data error:", error.message);
    res.status(500).json({ message: "Unable to save Tasbih data." });
  }
});

module.exports = router;
