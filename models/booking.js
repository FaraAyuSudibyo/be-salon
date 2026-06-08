"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User, { foreignKey: "id_users", as: "user" });
      Booking.belongsTo(models.Service, {
        foreignKey: "id_services",
        as: "service",
      });
      Booking.hasOne(models.Payment, {
        foreignKey: "id_bookings",
        as: "payment",
      });
      Booking.hasOne(models.Review, {
        foreignKey: "id_bookings",
        as: "review",
      });
    }
  }

  Booking.init(
    {
      id_bookings: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      // FK ke users
      id_users: {
        type: DataTypes.BIGINT,
      },
      // FK ke services
      id_services: {
        type: DataTypes.BIGINT,
      },
      date: {
        type: DataTypes.DATEONLY, // format YYYY-MM-DD
      },
      time: {
        type: DataTypes.STRING, // format HH:MM
      },
      notes: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
        ),
        defaultValue: "pending",
      },
      service_type: {
        type: DataTypes.ENUM("onsite", "homeservice"),
        defaultValue: "onsite",
      },
      address: {
        type: DataTypes.TEXT, 
      },
      home_service_fee: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_price: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "Booking",
      tableName: "bookings",
      timestamps: true,
      underscored: true,
    },
  );

  return Booking;
};
