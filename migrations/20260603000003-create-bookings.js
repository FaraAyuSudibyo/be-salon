"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bookings", {
      id_bookings: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_users: { type: Sequelize.BIGINT, allowNull: false },
      id_services: { type: Sequelize.BIGINT, allowNull: true },
      date: { type: Sequelize.DATEONLY },
      time: { type: Sequelize.STRING },
      notes: { type: Sequelize.TEXT },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
        ),
        defaultValue: "pending",
      },
      service_type: {
        type: Sequelize.ENUM("onsite", "homeservice"),
        defaultValue: "onsite",
      },
      address: { type: Sequelize.TEXT },
      home_service_fee: { type: Sequelize.INTEGER, defaultValue: 0 },
      total_price: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint("bookings", {
      fields: ["id_users"],
      type: "foreign key",
      name: "fk_bookings_users",
      references: { table: "users", field: "id_users" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    await queryInterface.addConstraint("bookings", {
      fields: ["id_services"],
      type: "foreign key",
      name: "fk_bookings_services",
      references: { table: "services", field: "id_services" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("bookings");
  },
};
