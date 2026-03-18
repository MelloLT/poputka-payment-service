// src/models/Order.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { generateId } from "../utils/idGenerator";

export interface OrderAttributes {
  id: string;
  userId: string;
  tripId?: string;
  bookingId?: string;
  amount: number;
  description: string;
  status: OrderStatus;
  metadata?: any;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderStatus = "pending" | "paid" | "cancelled" | "expired";

interface OrderCreationAttributes extends Optional<
  OrderAttributes,
  | "id"
  | "tripId"
  | "bookingId"
  | "metadata"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
> {}

class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: string;
  public userId!: string;
  public tripId?: string;
  public bookingId?: string;
  public amount!: number;
  public description!: string;
  public status!: OrderStatus;
  public metadata?: any;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => `ORD${generateId()}`,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tripId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bookingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "cancelled", "expired"),
      defaultValue: "pending",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 30 * 60 * 1000),
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
    tableName: "orders",
    sequelize,
    timestamps: true,
  },
);

export default Order;
