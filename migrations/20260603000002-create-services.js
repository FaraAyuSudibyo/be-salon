'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('services', {
      id_services: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      name:        { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      price:       { type: Sequelize.INTEGER, allowNull: false },
      duration:    { type: Sequelize.INTEGER },          // menit
      category:    { type: Sequelize.STRING },
      image:       { type: Sequelize.STRING },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false }
    })
  },
  async down(queryInterface) { await queryInterface.dropTable('services') }
}
