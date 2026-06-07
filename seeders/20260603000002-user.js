"use strict";
const bcrypt = require("bcrypt");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("users", [
      {
        username: "Admin Dream Beauty",
        email: "admin@gmail.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        phone: "081234567890",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        username: "Fara",
        email: "fara@gmail.com",
        password: await bcrypt.hash("customer123", 10),
        role: "customer",
        phone: "089876543210",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
