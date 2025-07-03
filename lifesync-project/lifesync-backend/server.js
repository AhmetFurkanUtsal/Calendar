const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Development için tüm origin'leri kabul et
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/events", require("./routes/events"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/community", require("./routes/community"));
app.use("/api/prayer-times", require("./routes/prayerTimes"));
app.use("/api/weather", require("./routes/weather"));
app.use("/api/holidays", require("./routes/holidays"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Prisma error handling
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: "Bu kayıt zaten mevcut.",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: "Kayıt bulunamadı.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Bir hata oluştu!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint bulunamadı.",
  });
});

const PORT = process.env.PORT || 3000;

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
