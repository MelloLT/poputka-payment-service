import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateId } from "../utils/idGenerator";

export interface PaymentAttributes {
  id: string;
  userId: string;
  tripId: string;
  bookingId?: string;
  amount: number;
  description?: string;
  status: PaymentStatus;
  clickTransId?: string;
  clickPaydocId?: string;
  merchantPrepareId?: number;
  merchantConfirmId?: string;
  errorCode?: number;
  errorNote?: string;
  prepareTime?: Date;
  completeTime?: Date;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentStatus =
  | "pending" // Создана, ожидает оплаты
  | "processing" // После Prepare
  | "paid" // Оплачена
  | "cancelled" // Отменена пользователем
  | "expired" // Истек срок
  | "failed"; // Ошибка при оплате

interface PaymentCreationAttributes extends Optional<
  PaymentAttributes,
  | "id"
  | "bookingId"
  | "description"
  | "clickTransId"
  | "clickPaydocId"
  | "merchantPrepareId"
  | "merchantConfirmId"
  | "errorCode"
  | "errorNote"
  | "prepareTime"
  | "completeTime"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
> {}

class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: string;
  public userId!: string;
  public tripId!: string;
  public bookingId?: string;
  public amount!: number;
  public description?: string;
  public status!: PaymentStatus;
  public clickTransId?: string;
  public clickPaydocId?: string;
  public merchantPrepareId?: number;
  public merchantConfirmId?: string;
  public errorCode?: number;
  public errorNote?: string;
  public prepareTime?: Date;
  public completeTime?: Date;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `PAY${generateId()}`,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tripId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0.01,
        isNumeric: true,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "paid",
        "cancelled",
        "expired",
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 30 * 60 * 1000), // 30 минут
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payments",
    sequelize,
    timestamps: true,
  },
);

export default Payment;
