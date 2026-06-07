"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reviews", {
      id_reviews: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_bookings: { type: Sequelize.BIGINT, allowNull: false },
      rating: { type: Sequelize.INTEGER },
      comment: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint("reviews", {
      fields: ["id_bookings"],
      type: "foreign key",
      name: "fk_reviews_bookings",
      references: { table: "bookings", field: "id_bookings" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("reviews");
  },
};
