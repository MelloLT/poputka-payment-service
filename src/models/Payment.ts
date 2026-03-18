import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateId } from "../utils/idGenerator";

export interface PaymentAttributes {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  clickTransId?: string;
  clickPaydocId?: string;
  merchantPrepareId?: number;
  merchantConfirmId?: string;
  errorCode?: number;
  errorNote?: string;
  prepareTime?: Date;
  completeTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "cancelled"
  | "failed";

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
      references: {
        model: "orders",
        key: "id",
      },
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
