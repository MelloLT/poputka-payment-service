import express from "express";
import { paymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/prepare", paymentController.prepare);
router.post("/complete", paymentController.complete);

router.post("/orders", authMiddleware, paymentController.createOrder);
router.post("/initiate", authMiddleware, paymentController.initiatePayment);
router.get(
  "/status/:paymentId",
  authMiddleware,
  paymentController.getPaymentStatus,
);
router.post(
  "/cancel/:paymentId",
  authMiddleware,
  paymentController.cancelPayment,
);

export default router;
