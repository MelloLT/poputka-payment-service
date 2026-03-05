import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 12);

export const generateId = (): string => {
  return nanoid();
};

export const generatePaymentId = (): string => {
  return `PAY${nanoid(10)}`;
};
