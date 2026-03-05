import crypto from "crypto";
import { ClickError } from "../types/click.types";

class ClickService {
  private readonly secretKey: string;
  private readonly serviceId: string;
  private readonly merchantId: string;

  constructor() {
    // Эти данные короче надо будет узнать от Click при регистрации
    this.secretKey = process.env.CLICK_SECRET_KEY || "";
    this.serviceId = process.env.CLICK_SERVICE_ID || "";
    this.merchantId = process.env.CLICK_MERCHANT_ID || "";
  }

  // Генерация подписи для проверки запросов от Click
  generateSignature(
    clickTransId: string,
    serviceId: string,
    merchantTransId: string,
    amount: string,
    action: string,
    signTime: string,
    merchantPrepareId?: string,
  ): string {
    const signString = merchantPrepareId
      ? `${clickTransId}${serviceId}${this.secretKey}${merchantTransId}${merchantPrepareId}${amount}${action}${signTime}`
      : `${clickTransId}${serviceId}${this.secretKey}${merchantTransId}${amount}${action}${signTime}`;

    return crypto.createHash("md5").update(signString).digest("hex");
  }

  // Проверка подписи от Click
  verifySignature(
    clickTransId: string,
    serviceId: string,
    merchantTransId: string,
    amount: string,
    action: string,
    signTime: string,
    signString: string,
    merchantPrepareId?: string,
  ): boolean {
    const calculatedSign = this.generateSignature(
      clickTransId,
      serviceId,
      merchantTransId,
      amount,
      action,
      signTime,
      merchantPrepareId,
    );
    return calculatedSign === signString;
  }

  // Проверка Prepare запроса
  async validatePrepare(
    params: any,
  ): Promise<{ isValid: boolean; error?: ClickError }> {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = params;

    // Проверка action (должен быть 0)
    if (action !== "0") {
      return { isValid: false, error: ClickError.ACTION_NOT_FOUND };
    }

    // Проверка service_id
    if (service_id !== this.serviceId) {
      return { isValid: false, error: ClickError.BAD_REQUEST };
    }

    // Проверка подписи
    const isValid = this.verifySignature(
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    );

    if (!isValid) {
      return { isValid: false, error: ClickError.SIGN_CHECK_FAILED };
    }

    return { isValid: true };
  }

  // Проверка Complete запроса
  async validateComplete(
    params: any,
  ): Promise<{ isValid: boolean; error?: ClickError }> {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = params;

    // Проверка action (должен быть 1)
    if (action !== "1") {
      return { isValid: false, error: ClickError.ACTION_NOT_FOUND };
    }

    // Проверка service_id
    if (service_id !== this.serviceId) {
      return { isValid: false, error: ClickError.BAD_REQUEST };
    }

    // Проверка подписи
    const isValid = this.verifySignature(
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
      merchant_prepare_id,
    );

    if (!isValid) {
      return { isValid: false, error: ClickError.SIGN_CHECK_FAILED };
    }

    return { isValid: true };
  }

  // Получить URL для кнопки оплаты (первый вариант - редирект)
  getPaymentUrl(orderId: string, amount: number, returnUrl?: string): string {
    const baseUrl = "https://my.click.uz/services/pay";
    const params = new URLSearchParams({
      service_id: this.serviceId,
      merchant_id: this.merchantId,
      amount: amount.toFixed(2),
      transaction_param: orderId,
    });

    if (returnUrl) {
      params.append("return_url", returnUrl);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Получить HTML форму для кнопки оплаты
  getPaymentForm(
    orderId: string,
    amount: number,
    returnUrl?: string,
    cardType?: "uzcard" | "humo",
  ): string {
    const form = `
      <form action="https://my.click.uz/services/pay" method="get" target="_blank">
        <input type="hidden" name="service_id" value="${this.serviceId}" />
        <input type="hidden" name="merchant_id" value="${this.merchantId}" />
        <input type="hidden" name="amount" value="${amount.toFixed(2)}" />
        <input type="hidden" name="transaction_param" value="${orderId}" />
        ${returnUrl ? `<input type="hidden" name="return_url" value="${returnUrl}" />` : ""}
        ${cardType ? `<input type="hidden" name="card_type" value="${cardType}" />` : ""}
        <button type="submit" class="click-btn">Оплатить через CLICK</button>
      </form>
    `;
    return form;
  }
}

export default new ClickService();
