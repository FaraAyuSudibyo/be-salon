"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      id_payments: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_bookings: { type: Sequelize.BIGINT, allowNull: false },
      amount: { type: Sequelize.INTEGER },
      method: {
        type: Sequelize.ENUM("cash", "transfer", "qris"),
        defaultValue: "transfer",
      },
      status: {
        type: Sequelize.ENUM("unpaid", "pending_verification", "paid"),
        defaultValue: "unpaid",
      },
      payment_proof: { type: Sequelize.STRING },
      reject_reason: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint("payments", {
      fields: ["id_bookings"],
      type: "foreign key",
      name: "fk_payments_bookings",
      references: { table: "bookings", field: "id_bookings" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("payments");
  },
};
