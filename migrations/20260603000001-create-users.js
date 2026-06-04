'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id_users:   { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true, allowNull: false },
      username:   { type: Sequelize.STRING, allowNull: false },
      email:      { type: Sequelize.STRING, allowNull: false, unique: true },
      password:   { type: Sequelize.STRING, allowNull: false },
      role:       { type: Sequelize.ENUM('admin', 'customer'), defaultValue: 'customer' },
      phone:      { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    })
  },
  async down(queryInterface) { await queryInterface.dropTable('users') }
}
