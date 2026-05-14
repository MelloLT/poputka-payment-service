import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import cookieParser from "cookie-parser";
import paymentRoutes from "./routes/payment.routes";
import { checkAndExpireOldPayments } from "./controllers/payment.controller";
import "./models/Payment";

dotenv.config();
setInterval(async () => {
  try {
    console.log("УДАЛИЛИ")
    await checkAndExpireOldPayments();
  } catch (error) {
    console.error("Expire payments error:", error);
  }
}, 60 * 1000);
const app = express();
const PORT = 5001;
// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync({ alter: true });
    console.log("Database synced");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
