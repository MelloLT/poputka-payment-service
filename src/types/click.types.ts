// Параметры для Prepare запроса
export interface ClickPrepareRequest {
  click_trans_id: number;
  service_id: number;
  click_paydoc_id: number;
  merchant_trans_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickPrepareResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_prepare_id: number;
  error: number;
  error_note: string;
}

// Параметры для Complete запроса
export interface ClickCompleteRequest {
  click_trans_id: number;
  service_id: number;
  click_paydoc_id: number;
  merchant_trans_id: string;
  merchant_prepare_id: number;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickCompleteResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_confirm_id: number;
  error: number;
  error_note: string;
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "error";

export interface Payment {
  id: number;
  order_id: string;
  click_paydoc_id: number;
  click_trans_id: number;
  amount: number;
  status: PaymentStatus;
  prepare_id?: number;
  confirm_id?: number;
  error_code?: number;
  error_note?: string;
  created_at: Date;
  updated_at: Date;
}

export const ClickErrorCodes = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INVALID_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  ORDER_CANCELLED: -7,
  ORDER_ALREADY_COMPLETED: -8,
  TRANSACTION_CANCELLED: -9,
  WAITING_FOR_PAYMENT: 1,
  PAYMENT_IN_PROCESS: 2,
  PAYMENT_COMPLETED: 3,
  PAYMENT_CANCELLED: 4,
  AUTH_FAILED: -10,
} as const;

// Фискализация
export interface FiscalizationItem {
  name: string; // Название товара/услуги
  price: number; // Цена в тийинах
  quantity: number;
  vat_percent: number;
  spic: string; // SPIC код
}

export interface FiscalizationRequest {
  service_id: number;
  payment_id: number;
  items: FiscalizationItem[];
  received_cash: number;
  received_card: number;
}

export interface FiscalizationResponse {
  error_code: number;
  error_note: string;
}
