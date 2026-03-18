import { Request, Response } from "express";
import Order from "../models/Order";
import { sendSuccess, sendError } from "../utils/responseHelper";

export const orderController = {
  // Создать заявку на оплату
  async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { tripId, bookingId, amount, description, metadata } = req.body;

      // Проверка обязательных полей
      if (!amount || !description) {
        return sendError(res, "AMOUNT_DESCRIPTION_REQUIRED", 400);
      }

      // Создаем заявку
      const order = await Order.create({
        userId,
        tripId,
        bookingId,
        amount,
        description,
        metadata,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 минут
      });

      sendSuccess(
        res,
        {
          orderId: order.id,
          amount: order.amount,
          description: order.description,
          expiresAt: order.expiresAt,
        },
        "ORDER_CREATED",
      );
    } catch (error) {
      console.error("Create order error:", error);
      sendError(res, "ORDER_CREATE_ERROR", 500);
    }
  },

  // Получить заявку
  async getOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id;

      const order = await Order.findOne({
        where: { id: orderId, userId },
      });

      if (!order) {
        return sendError(res, "ORDER_NOT_FOUND", 404);
      }

      sendSuccess(res, { order });
    } catch (error) {
      console.error("Get order error:", error);
      sendError(res, "ORDER_FETCH_ERROR", 500);
    }
  },

  // Получить все заявки пользователя
  async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { status, limit = 10, offset = 0 } = req.query;

      const where: any = { userId };
      if (status) where.status = status;

      const orders = await Order.findAndCountAll({
        where,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [["createdAt", "DESC"]],
      });

      sendSuccess(res, {
        orders: orders.rows,
        total: orders.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      console.error("Get user orders error:", error);
      sendError(res, "ORDERS_FETCH_ERROR", 500);
    }
  },

  // Отменить заявку
  async cancelOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id;

      const order = await Order.findOne({
        where: { id: orderId, userId, status: "pending" },
      });

      if (!order) {
        return sendError(res, "ORDER_NOT_FOUND_OR_NOT_PENDING", 404);
      }

      await order.update({ status: "cancelled" });

      sendSuccess(res, { orderId }, "ORDER_CANCELLED");
    } catch (error) {
      console.error("Cancel order error:", error);
      sendError(res, "ORDER_CANCEL_ERROR", 500);
    }
  },
};
