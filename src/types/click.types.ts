export interface ClickRequestParams {
  click_trans_id: string; // ID транзакции в Click
  service_id: string; // ID сервиса
  click_paydoc_id: string; // ID платежа в Click
  merchant_trans_id: string; // ID заказа в нашей системе (orderId)
  amount: string; // Сумма
  action: string; // 0 - Prepare, 1 - Complete
  error: string; // Код ошибки
  error_note: string; // Описание ошибки
  sign_time: string; // Время подписи
  sign_string: string; // Подпись
  merchant_prepare_id?: string; // ID из Prepare (только для Complete)
}

// Ответ на Prepare запрос
export interface ClickPrepareResponse {
  click_trans_id: string;
  merchant_trans_id: string;
  merchant_prepare_id: number; // Наш ID платежа
  error: number;
  error_note: string;
}

// Ответ на Complete запрос
export interface ClickCompleteResponse {
  click_trans_id: string;
  merchant_trans_id: string;
  merchant_confirm_id?: string; // ID подтверждения
  error: number;
  error_note: string;
}

// Коды ошибок Click
export enum ClickError {
  SUCCESS = 0, // Успешно
  SIGN_CHECK_FAILED = -1, // Ошибка проверки подписи
  INVALID_AMOUNT = -2, // Неверная сумма
  ACTION_NOT_FOUND = -3, // Действие не найдено
  ALREADY_PAID = -4, // Платеж уже оплачен
  USER_NOT_FOUND = -5, // Пользователь не найден
  TRANSACTION_NOT_FOUND = -6, // Транзакция не найдена
  BAD_REQUEST = -8, // Ошибка в запросе
  TRANSACTION_CANCELLED = -9, // Транзакция отменена
  INTERNAL_ERROR = -99, // Внутренняя ошибка
}

// Статусы платежа для фронтенда
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  CANCELLED = "cancelled",
  FAILED = "failed",
}
