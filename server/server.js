
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);

app.use(express.json({ limit: "10kb" }));

// Basic API route
app.get("/", (req, res) => {
  res.json({
    message: "Tasbih Counter API is running!",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Authentication routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasbih", require("./routes/tasbih"));

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
  });
});

// Start server and connect to MongoDB
async function startServer() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    console.error(
      "Missing MONGODB_URI or JWT_SECRET in your server/.env file."
    );
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log("MongoDB Atlas connected successfully.");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      console.log("Authentication routes: /api/auth");
      console.log("Health check: /api/health");
    });
  } catch (error) {
    console.error("\nMongoDB connection failed.");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Print individual server errors when available
    if (error.reason && error.reason.servers) {
      for (const [address, server] of error.reason.servers) {
        console.error("\nMongoDB server:", address);
        console.error(
          "Server error:",
          server.error?.message || "No detailed server error"
        );
      }
    }

    console.error(
      "\nCheck Atlas Network Access, cluster status, database credentials, and MONGODB_URI."
    );

    process.exit(1);
  }
}

startServer();
