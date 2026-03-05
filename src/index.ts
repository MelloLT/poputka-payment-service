import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import clickRoutes from "./routes/click.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов (для отладки)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/click", clickRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Запуск сервера
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    // Синхронизация моделей (в продакшене использовать миграции!)
    await sequelize.sync({ alter: true });
    console.log("Database synced");

    app.listen(PORT, () => {
      console.log(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
