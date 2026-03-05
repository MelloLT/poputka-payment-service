import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // ТЕСТОВЫЙ пропускаем любой запрос с заголовком Authorization
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️ ТЕСТОВЫЙ РЕЖИМ: авторизация отключена");

      // Даже если нет токена, создаем тестового пользователя
      req.user = {
        id: "test-user-123",
        role: "user",
      };
      return next();
    }
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_NOT_PROVIDED",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      userRole?: string;
    };

    req.user = {
      id: payload.userId,
      role: payload.userRole,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      code: "INVALID_OR_EXPIRED_TOKEN",
    });
  }
};
