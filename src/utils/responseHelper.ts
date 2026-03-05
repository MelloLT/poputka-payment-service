import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  code?: string,
  status: number = 200,
) => {
  const response: any = {
    success: true,
    data,
  };

  if (code) response.code = code;

  res.status(status).json(response);
};

export const sendError = (
  res: Response,
  code: string,
  status: number = 400,
  meta?: Record<string, any>,
) => {
  const response: any = {
    success: false,
    code,
  };

  if (meta) response.meta = meta;

  res.status(status).json(response);
};
