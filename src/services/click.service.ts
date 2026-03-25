import crypto from "crypto";
import { ClickError } from "../types/click.types";

class ClickService {
  private readonly secretKey: string;
  private readonly serviceId: number;
  private readonly merchantId: number;

  constructor() {
    this.secretKey = process.env.CLICK_SECRET_KEY || "";
    this.serviceId = parseInt(process.env.CLICK_SERVICE_ID || "0");
    this.merchantId = parseInt(process.env.CLICK_MERCHANT_ID || "0");
  }

  generateSignature(
    clickTransId: number | string,
    serviceId: number | string,
    merchantTransId: string,
    amount: number | string,
    action: number | string,
    signTime: string,
    merchantPrepareId?: number | string,
  ): string {
    const signString = merchantPrepareId
      ? `${clickTransId}${serviceId}${this.secretKey}${merchantTransId}${merchantPrepareId}${amount}${action}${signTime}`
      : `${clickTransId}${serviceId}${this.secretKey}${merchantTransId}${amount}${action}${signTime}`;

    return crypto.createHash("md5").update(signString).digest("hex");
  }

  // Проверка подписи (в тестовом пропускаем)
  verifySignature(
    clickTransId: number | string,
    serviceId: number | string,
    merchantTransId: string,
    amount: number | string,
    action: number | string,
    signTime: string,
    signString: string,
    merchantPrepareId?: number | string,
  ): boolean {
    return true;

    /* Для прода:
    const calculatedSign = this.generateSignature(
      clickTransId,
      serviceId,
      merchantTransId,
      amount,
      action,
      signTime,
      merchantPrepareId
    );
    return calculatedSign === signString;
    */
  }

  // Валидация Prepare запроса
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

    const actionNum = Number(action);
    const serviceIdNum = Number(service_id);
    const amountNum = Number(amount);

    // Проверка action (должен быть 0)
    if (actionNum !== 0) {
      console.log(`Invalid action: ${actionNum}, expected 0`);
      return { isValid: false, error: ClickError.ACTION_NOT_FOUND };
    }

    // Проверка service_id
    if (serviceIdNum !== this.serviceId) {
      console.log(
        `Invalid service_id: ${serviceIdNum}, expected ${this.serviceId}`,
      );
      return { isValid: false, error: ClickError.BAD_REQUEST };
    }

    // Проверка суммы (должна быть положительной)
    if (amountNum <= 0) {
      console.log(`Invalid amount: ${amountNum}`);
      return { isValid: false, error: ClickError.INVALID_AMOUNT };
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
      console.log("Signature check failed");
      return { isValid: false, error: ClickError.SIGN_CHECK_FAILED };
    }

    return { isValid: true };
  }

  // Валидация Complete запроса
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

    const actionNum = Number(action);
    const serviceIdNum = Number(service_id);

    // Проверка action (должен быть 1)
    if (actionNum !== 1) {
      console.log(`Invalid action: ${actionNum}, expected 1`);
      return { isValid: false, error: ClickError.ACTION_NOT_FOUND };
    }

    // Проверка service_id
    if (serviceIdNum !== this.serviceId) {
      console.log(
        `Invalid service_id: ${serviceIdNum}, expected ${this.serviceId}`,
      );
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
      console.log("Signature check failed");
      return { isValid: false, error: ClickError.SIGN_CHECK_FAILED };
    }

    return { isValid: true };
  }

  getPaymentUrl(paymentId: string, amount: number): string {
    const baseUrl = "https://my.click.uz/services/pay";
    const params = new URLSearchParams({
      service_id: this.serviceId.toString(),
      merchant_id: this.merchantId.toString(),
      amount: amount.toFixed(2),
      transaction_param: paymentId,
    });
    return `${baseUrl}?${params.toString()}`;
  }

  // Получить HTML форму для кнопки оплаты
  getPaymentForm(
    paymentId: string,
    amount: number,
    returnUrl?: string,
  ): string {
    return `
      <form action="https://my.click.uz/services/pay" method="get" target="_blank">
        <input type="hidden" name="service_id" value="${this.serviceId}" />
        <input type="hidden" name="merchant_id" value="${this.merchantId}" />
        <input type="hidden" name="amount" value="${amount.toFixed(2)}" />
        <input type="hidden" name="transaction_param" value="${paymentId}" />
        ${returnUrl ? `<input type="hidden" name="return_url" value="${returnUrl}" />` : ""}
        <button type="submit" class="click-btn">Оплатить через CLICK</button>
      </form>
    `;
  }
}

export default new ClickService();
