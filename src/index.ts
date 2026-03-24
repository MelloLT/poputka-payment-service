import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import paymentRoutes from "./routes/payment.routes";
import "./models/Payment";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
