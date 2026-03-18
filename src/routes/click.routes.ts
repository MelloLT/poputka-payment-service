import express from "express";
import { clickController } from "../controllers/click.controller";
import { orderController } from "../controllers/order.controller";
import { authMiddleware } from "../middleware/auth";
const router = express.Router();

// Публичные ручки для Click (без авторизации)
router.post("/prepare", clickController.prepare);
router.post("/complete", clickController.complete);

// Защищенные ручки для работы с заявками
router.post("/orders", authMiddleware, orderController.createOrder);
router.get("/orders", authMiddleware, orderController.getUserOrders);
router.get("/orders/:orderId", authMiddleware, orderController.getOrder);
router.post(
  "/orders/:orderId/cancel",
  authMiddleware,
  orderController.cancelOrder,
);

// Защищенные ручки для платежей
router.post("/create", authMiddleware, clickController.createPayment);
router.get(
  "/status/:orderId",
  authMiddleware,
  clickController.getPaymentStatus,
);

export default router;
