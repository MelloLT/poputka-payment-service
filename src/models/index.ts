import Order from "./Order";
import Payment from "./Payment";

Order.hasMany(Payment, {
  foreignKey: "orderId",
  as: "payments",
});

Payment.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

export { Order, Payment };
