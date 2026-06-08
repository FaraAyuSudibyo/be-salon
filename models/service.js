"use strict";
const { Model } = require("sequelize");
const { base_url } = require("../config/base.config");

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {
      Service.hasMany(models.Booking, {
        foreignKey: "id_services",
        as: "bookings",
      });
    }
  }

  Service.init(
    {
      id_services: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
      },
      category: {
        type: DataTypes.STRING,
      },
      image: {
        type: DataTypes.STRING,
        get() {
          const val = this.getDataValue("image");
          if (!val) return null;
          if (val.startsWith("http")) return val;
          return `${base_url}/uploads/${val}`;
        },
      },
    },
    {
      sequelize,
      modelName: "Service",
      tableName: "services",
      timestamps: true,
      underscored: true,
    },
  );

  return Service;
};
