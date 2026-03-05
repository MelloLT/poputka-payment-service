import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateId } from "../utils/idGenerator";

export interface PaymentAttributes {
  id: string; // Внутренний ID платежа
  userId: string; // ID пользователя
  orderId: string; // ID заказа
  amount: number; // Сумма платежа
  status: PaymentStatus; // Статус платежа
  clickTransId?: string; // ID транзакции в Click (click_trans_id)
  clickPaydocId?: string; // ID платежа в Click (click_paydoc_id)
  merchantPrepareId?: number; // ID из Prepare запроса
  merchantConfirmId?: string; // ID подтверждения
  errorCode?: number; // Код ошибки от Click
  errorNote?: string; // Описание ошибки
  prepareTime?: Date; // Время Prepare запроса
  completeTime?: Date; // Время Complete запроса
  createdAt?: Date; // Время создания
  updatedAt?: Date; // Время обновления
}

export type PaymentStatus =
  | "pending" // Создан, ожидает оплаты
  | "processing" // В обработке
  | "paid" // Оплачен успешно
  | "cancelled" // Отменен
  | "failed"; // Ошибка

interface PaymentCreationAttributes extends Optional<
  PaymentAttributes,
  | "id"
  | "clickTransId"
  | "clickPaydocId"
  | "merchantPrepareId"
  | "merchantConfirmId"
  | "errorCode"
  | "errorNote"
  | "prepareTime"
  | "completeTime"
  | "createdAt"
  | "updatedAt"
> {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: string;
  public userId!: string;
  public orderId!: string;
  public amount!: number;
  public status!: PaymentStatus;
  public clickTransId?: string;
  public clickPaydocId?: string;
  public merchantPrepareId?: number;
  public merchantConfirmId?: string;
  public errorCode?: number;
  public errorNote?: string;
  public prepareTime?: Date;
  public completeTime?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: generateId,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "paid",
        "cancelled",
        "failed",
      ),
      defaultValue: "pending",
    },
    clickTransId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clickPaydocId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchantPrepareId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    merchantConfirmId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    errorCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    errorNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prepareTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completeTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    sequelize,
    timestamps: true,
  },
);

export default Payment;
