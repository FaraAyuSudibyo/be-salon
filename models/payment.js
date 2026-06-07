"use strict";
const { Model } = require("sequelize");
const { base_url } = require("../config/base.config");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Booking, {
        foreignKey: "id_bookings",
        as: "booking",
      });
    }
  }

  Payment.init(
    {
      id_payments: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      id_bookings: {
        type: DataTypes.BIGINT,
      },
      amount: {
        type: DataTypes.INTEGER, // sama dengan total_price di booking
      },
      method: {
        type: DataTypes.ENUM("cash", "transfer", "qris"),
        defaultValue: "transfer",
      },
      status: {
        type: DataTypes.ENUM("unpaid", "pending_verification", "paid"),
        defaultValue: "unpaid",
      },
      // tambahan untuk fitur upload bukti di FE
      payment_proof: {
        type: DataTypes.STRING,
        get() {
          const val = this.getDataValue("payment_proof");
          if (!val) return null;
          if (val.startsWith("http")) return val;
          return `${base_url}/uploads/${val}`;
        },
      },
      reject_reason: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "payments",
      timestamps: true,
      underscored: true,
    },
  );

  return Payment;
};
