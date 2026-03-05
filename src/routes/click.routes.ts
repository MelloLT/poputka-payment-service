// src/routes/click.routes.ts
import express from "express";
import { clickController } from "../controllers/click.controller";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Публичные ручки для Click API (без авторизации)
router.post("/prepare", clickController.prepare);
router.post("/complete", clickController.complete);

// Защищенные ручки для фронтенда
router.post("/create", authMiddleware, clickController.createPayment);
router.get(
  "/status/:orderId",
  authMiddleware,
  clickController.getPaymentStatus,
);

export default router;
