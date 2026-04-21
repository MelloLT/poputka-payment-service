import { Request, Response } from "express";
import Payment from "../models/Payment";
import clickService from "../services/click.service";
import { ClickError } from "../types/click.types";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { Op } from "sequelize";
import axios from "axios";

// Вспомогательная функция для проверки активной заявки
async function getActivePayment(
  userId: string,
  tripId: string,
): Promise<Payment | null> {
  return await Payment.findOne({
    where: {
      userId,
      tripId,
      status: ["pending", "processing"],
    },
    order: [["createdAt", "DESC"]],
  });
}

// Вспомогательная функция для проверки истечения срока
async function checkAndExpireOldPayments() {
  await Payment.update(
    { status: "expired" },
    {
      where: {
        status: ["pending", "processing"],
        expiresAt: { [Op.lt]: new Date() },
      },
    },
  );
}

export const paymentController = {
  async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { tripId, amount, bookingId, description } = req.body;

      if (!tripId) {
        console.error("Missing tripId");
        return sendError(res, "TRIP_ID_REQUIRED", 400);
      }

      if (!amount || typeof amount !== "number" || amount <= 0) {
        console.error("Invalid amount:", amount);
        return sendError(res, "INVALID_AMOUNT", 400);
      }

      // Проверяем, нет ли активной заявки
      const existingPayment = await getActivePayment(userId, tripId);

      if (existingPayment) {
        // Если заявка еще активна, возвращаем ее
        console.log(`Active payment exists for user ${userId}, trip ${tripId}`);
        return sendSuccess(res, {
          paymentId: existingPayment.id,
          amount: existingPayment.amount,
          status: existingPayment.status,
          expiresAt: existingPayment.expiresAt,
          isActive: true,
        });
      }

      // Создаем новую заявку
      const payment = await Payment.create({
        userId,
        tripId,
        bookingId: bookingId || undefined,
        amount: Math.abs(amount),
        description: description || `Оплата поездки ${tripId}`,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      console.log(
        `Payment created: ${payment.id} for user ${userId}, trip ${tripId}`,
      );

      sendSuccess(res, {
        paymentId: payment.id,
        amount: payment.amount,
        status: payment.status,
        expiresAt: payment.expiresAt,
        isActive: true,
      });
    } catch (error) {
      console.error("Create payment error:", error);

      sendError(res, "PAYMENT_CREATE_ERROR", 500);
    }
  },

  // Создать платеж (редирект в Click)
  async initiatePayment(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { paymentId } = req.body;

      if (!paymentId) {
        console.error("Missing paymentId");
        return sendError(res, "PAYMENT_ID_REQUIRED", 400);
      }

      const payment = await Payment.findOne({
        where: { id: paymentId, userId },
      });

      if (!payment) {
        console.error(`Payment not found: ${paymentId}`);
        return sendError(res, "PAYMENT_NOT_FOUND", 404);
      }

      if (payment.expiresAt < new Date()) {
        await payment.update({ status: "expired" });
        console.error(`Payment expired: ${paymentId}`);
        return sendError(res, "PAYMENT_EXPIRED", 400);
      }

      if (payment.status !== "pending") {
        console.error(
          `Payment not pending: ${paymentId}, status=${payment.status}`,
        );
        return sendError(res, "PAYMENT_NOT_PENDING", 400);
      }

      const paymentUrl = clickService.getPaymentUrl(payment.id, payment.amount);

      console.log(`Payment initiated: ${paymentId}, url: ${paymentUrl}`);

      sendSuccess(res, {
        paymentUrl,
        paymentId: payment.id,
      });
    } catch (error) {
      console.error("Initiate payment error:", error);
      sendError(res, "PAYMENT_INIT_ERROR", 500);
    }
  },

  // Получить статус платежа
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { paymentId } = req.params;

      const payment = await Payment.findOne({
        where: { id: paymentId, userId },
      });

      if (!payment) {
        return sendError(res, "PAYMENT_NOT_FOUND", 404);
      }

      if (payment.status === "pending" && payment.expiresAt < new Date()) {
        await payment.update({ status: "expired" });
      }

      sendSuccess(res, {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt,
      });
    } catch (error) {
      console.error("Get payment status error:", error);
      sendError(res, "PAYMENT_STATUS_ERROR", 500);
    }
  },

  // Отменить заявку
  async cancelPayment(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { paymentId } = req.params;

      const payment = await Payment.findOne({
        where: { id: paymentId, userId, status: "pending" },
      });

      if (!payment) {
        return sendError(res, "PAYMENT_NOT_FOUND_OR_NOT_PENDING", 404);
      }

      await payment.update({ status: "cancelled" });

      console.log(`Payment cancelled: ${paymentId}`);

      sendSuccess(res, { paymentId }, "PAYMENT_CANCELLED");
    } catch (error) {
      console.error("Cancel payment error:", error);
      sendError(res, "PAYMENT_CANCEL_ERROR", 500);
    }
  },

  // Prepare
  async prepare(req: Request, res: Response) {
    try {
      const params = req.body;

      // Только лог запроса
      console.log("Prepare request:", JSON.stringify(params, null, 2));

      const merchantTransId = String(params.merchant_trans_id);
      const amountNum = Number(params.amount);

      // Ищем платеж по ID (merchant_trans_id)
      const payment = await Payment.findOne({
        where: {
          id: merchantTransId,
          status: {
            [Op.in]: ["pending", "processing"],
          },
        },
      });

      if (!payment) {
        return res.json({
          click_trans_id: Number(params.click_trans_id) || 0,
          merchant_trans_id: merchantTransId,
          error: ClickError.TRANSACTION_NOT_FOUND,
          error_note: "Payment not found",
        });
      }

      // Проверка суммы
      if (Math.abs(payment.amount - amountNum) > 0.01) {
        return res.json({
          click_trans_id: Number(params.click_trans_id) || 0,
          merchant_trans_id: merchantTransId,
          error: ClickError.INVALID_AMOUNT,
          error_note: "Amount mismatch",
        });
      }
      const merchantPrepareId = Math.floor(Date.now() / 1000);
      // Обновляем платеж
      await payment.update({
        clickTransId: String(params.click_trans_id),
        clickPaydocId: String(params.click_paydoc_id),
        merchantPrepareId: merchantPrepareId,
        status: "processing",
        prepareTime: new Date(),
      });

      console.log({
        click_trans_id: Number(params.click_trans_id) || 0,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: merchantPrepareId,
        error: ClickError.SUCCESS,
        error_note: "Success",
      });
      // Ответ CLICK
      res.json({
        click_trans_id: Number(params.click_trans_id) || 0,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: merchantPrepareId,
        error: ClickError.SUCCESS,
        error_note: "Success",
      });
    } catch (error) {
      console.error("Prepare error:", error);
      res.json({
        click_trans_id: Number(req.body.click_trans_id) || 0,
        merchant_trans_id: String(req.body.merchant_trans_id) || "",
        error: ClickError.INTERNAL_ERROR,
        error_note: "Internal error",
      });
    }
  },

  // Complete
  async complete(req: Request, res: Response) {
    try {
      const params = req.body;

      console.log("Complete request:", JSON.stringify(params, null, 2));

      const clickTransId = Number(params.click_trans_id) || 0;
      const merchantTransId = String(params.merchant_trans_id);
      const merchantPrepareId = Number(params.merchant_prepare_id);
      const error = Number(params.error) || 0;

      // Ищем платеж
      const payment = await Payment.findOne({
        where: {
          id: merchantTransId,
        },
      });

      if (!payment) {
        console.log(`Payment not found: ${merchantTransId}`);

        return res.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          error: ClickError.TRANSACTION_NOT_FOUND,
          error_note: "Payment not found",
        });
      }

      //Защита от повторных запросов
      if (payment.status === "paid") {
        return res.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: payment.merchantConfirmId,
          error: ClickError.SUCCESS,
          error_note: "Already completed",
        });
      }

      if (error < 0) {
        await payment.update({
          status: "failed",
          errorCode: error,
          errorNote: params.error_note || "Cancelled by CLICK",
        });

        return res.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          error: ClickError.TRANSACTION_CANCELLED,
          error_note: "Transaction cancelled",
        });
      }

      // Генерим merchant_confirm_id (int)
      const merchantConfirmId = Math.floor(Date.now() / 1000);

      // Успешное завершение
      await payment.update({
        status: "paid",
        clickTransId: String(params.click_trans_id),
        clickPaydocId: String(params.click_paydoc_id),
        merchantConfirmId: merchantConfirmId,
        completeTime: new Date(),
        errorCode: ClickError.SUCCESS,
      });
      try {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
        console.log(`Notifying backend about paid trip: ${payment.tripId}`);

        await axios.post(
          `${backendUrl}/api/payment/callback`,
          {
            tripId: payment.tripId,
            paymentId: payment.id,
            userId: payment.userId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 5000,
          },
        );

        console.log(`Successfully notified backend for trip ${payment.tripId}`);
      } catch (callbackError) {
        console.error("Failed to notify backend:", callbackError);
      }
      console.log({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: merchantConfirmId,
        error: ClickError.SUCCESS,
        error_note: "Success",
      });
      return res.json({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: merchantConfirmId,
        error: ClickError.SUCCESS,
        error_note: "Success",
      });
    } catch (error) {
      console.error("Complete error:", error);

      return res.json({
        click_trans_id: Number(req.body.click_trans_id) || 0,
        merchant_trans_id: String(req.body.merchant_trans_id) || "",
        error: ClickError.INTERNAL_ERROR,
        error_note: "Internal error",
      });
    }
  },
};
