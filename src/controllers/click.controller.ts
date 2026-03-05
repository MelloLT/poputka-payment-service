import { Request, Response } from "express";
import Payment from "../models/Payment";
import clickService from "../services/click.service";
import {
  ClickError,
  ClickPrepareResponse,
  ClickCompleteResponse,
} from "../types/click.types";
import { sendSuccess, sendError } from "../utils/responseHelper";

export const clickController = {
  // Ручка для Prepare запроса
  async prepare(req: Request, res: Response) {
    try {
      const params = req.body;
      console.log("Prepare request:", params);

      // Валидация запроса
      const validation = await clickService.validatePrepare(params);
      if (!validation.isValid) {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: params.merchant_trans_id,
          error: validation.error,
          error_note: getErrorNote(validation.error!),
        });
      }

      const { merchant_trans_id, amount } = params;

      // Проверяем существование платежа
      let payment = await Payment.findOne({
        where: { orderId: merchant_trans_id },
      });

      if (!payment) {
        // Создаем новый платеж
        payment = await Payment.create({
          userId: "temp", // TODO: получить реального пользователя
          orderId: merchant_trans_id,
          amount: parseFloat(amount),
          status: "pending",
        });
      }

      // Проверка на повторный платеж
      if (payment.status === "paid") {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: merchant_trans_id,
          merchant_prepare_id: parseInt(payment.id),
          error: ClickError.ALREADY_PAID,
          error_note: "Payment already paid",
        });
      }

      if (payment.status === "processing") {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: merchant_trans_id,
          merchant_prepare_id: parseInt(payment.id),
          error: ClickError.TRANSACTION_NOT_FOUND,
          error_note: "Transaction in processing",
        });
      }

      // Проверка суммы
      if (payment.amount !== parseFloat(amount)) {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: merchant_trans_id,
          merchant_prepare_id: parseInt(payment.id),
          error: ClickError.INVALID_AMOUNT,
          error_note: "Invalid amount",
        });
      }

      // Обновляем платеж
      await payment.update({
        clickTransId: params.click_trans_id,
        clickPaydocId: params.click_paydoc_id,
        status: "processing",
        prepareTime: new Date(),
      });

      // Отправляем успешный ответ
      const response: ClickPrepareResponse = {
        click_trans_id: params.click_trans_id,
        merchant_trans_id: merchant_trans_id,
        merchant_prepare_id: parseInt(payment.id),
        error: ClickError.SUCCESS,
        error_note: "Success",
      };

      res.json(response);
    } catch (error) {
      console.error("Prepare error:", error);
      res.json({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        error: ClickError.INTERNAL_ERROR,
        error_note: "Internal error",
      });
    }
  },

  // Ручка для Complete запроса
  async complete(req: Request, res: Response) {
    try {
      const params = req.body;
      console.log("Complete request:", params);

      // Валидация запроса
      const validation = await clickService.validateComplete(params);
      if (!validation.isValid) {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: params.merchant_trans_id,
          error: validation.error,
          error_note: getErrorNote(validation.error!),
        });
      }

      const { merchant_trans_id, merchant_prepare_id, error } = params;

      // Находим платеж
      const payment = await Payment.findOne({
        where: {
          orderId: merchant_trans_id,
          id: merchant_prepare_id,
        },
      });

      if (!payment) {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: merchant_trans_id,
          error: ClickError.TRANSACTION_NOT_FOUND,
          error_note: "Transaction not found",
        });
      }

      // Защита от повторного подтверждения
      if (payment.status === "paid") {
        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: merchant_trans_id,
          merchant_confirm_id: payment.id,
          error: ClickError.ALREADY_PAID,
          error_note: "Already paid",
        });
      }

      // Проверяем статус платежа в Click
      if (error !== "0") {
        // Платеж не прошел
        await payment.update({
          status: "failed",
          errorCode: parseInt(error),
          errorNote: params.error_note,
          completeTime: new Date(),
        });

        return res.json({
          click_trans_id: params.click_trans_id,
          merchant_trans_id: merchant_trans_id,
          merchant_confirm_id: payment.id,
          error: ClickError.TRANSACTION_CANCELLED,
          error_note: "Transaction cancelled",
        });
      }

      // Платеж успешен
      await payment.update({
        status: "paid",
        clickTransId: params.click_trans_id,
        clickPaydocId: params.click_paydoc_id,
        completeTime: new Date(),
        errorCode: ClickError.SUCCESS,
      });

      // TODO: Здесь нужно обновить статус заказа в основной БД
      // await updateOrderStatus(payment.orderId, "paid");

      const response: ClickCompleteResponse = {
        click_trans_id: params.click_trans_id,
        merchant_trans_id: merchant_trans_id,
        merchant_confirm_id: payment.id,
        error: ClickError.SUCCESS,
        error_note: "Success",
      };

      res.json(response);
    } catch (error) {
      console.error("Complete error:", error);
      res.json({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        error: ClickError.INTERNAL_ERROR,
        error_note: "Internal error",
      });
    }
  },

  // Ручка для создания платежа (c фронтенда)
  async createPayment(req: Request, res: Response) {
    try {
      const { userId, orderId, amount } = req.body;

      // Проверяем, нет ли уже такого платежа
      const existingPayment = await Payment.findOne({
        where: { orderId, status: ["pending", "processing"] },
      });

      if (existingPayment) {
        return sendSuccess(res, {
          payment: existingPayment,
          paymentUrl: clickService.getPaymentUrl(orderId, amount),
        });
      }

      // Создаем новый платеж
      const payment = await Payment.create({
        userId,
        orderId,
        amount,
        status: "pending",
      });

      // Возвращаем данные для оплаты
      sendSuccess(res, {
        payment,
        paymentUrl: clickService.getPaymentUrl(orderId, amount),
        paymentForm: clickService.getPaymentForm(orderId, amount),
      });
    } catch (error) {
      console.error("Create payment error:", error);
      sendError(res, "PAYMENT_CREATE_ERROR", 500);
    }
  },

  // Получить статус платежа
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const payment = await Payment.findOne({
        where: { orderId },
        order: [["createdAt", "DESC"]],
      });

      if (!payment) {
        return sendError(res, "PAYMENT_NOT_FOUND", 404);
      }

      sendSuccess(res, {
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
      });
    } catch (error) {
      console.error("Get payment status error:", error);
      sendError(res, "PAYMENT_STATUS_ERROR", 500);
    }
  },
};

// Вспомогательная функция для получения описания ошибки
function getErrorNote(error: ClickError): string {
  const notes: Record<ClickError, string> = {
    [ClickError.SUCCESS]: "Success",
    [ClickError.SIGN_CHECK_FAILED]: "Sign check failed",
    [ClickError.INVALID_AMOUNT]: "Invalid amount",
    [ClickError.ACTION_NOT_FOUND]: "Action not found",
    [ClickError.ALREADY_PAID]: "Already paid",
    [ClickError.USER_NOT_FOUND]: "User not found",
    [ClickError.TRANSACTION_NOT_FOUND]: "Transaction not found",
    [ClickError.BAD_REQUEST]: "Bad request",
    [ClickError.TRANSACTION_CANCELLED]: "Transaction cancelled",
    [ClickError.INTERNAL_ERROR]: "Internal error",
  };
  return notes[error] || "Unknown error";
}
