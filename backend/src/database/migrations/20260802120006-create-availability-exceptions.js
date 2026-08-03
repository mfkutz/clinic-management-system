'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('availability_exceptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      professional_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'professionals', key: 'id' },
        onDelete: 'CASCADE',
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      start_time: { type: Sequelize.TIME, allowNull: true },
      end_time: { type: Sequelize.TIME, allowNull: true },
      is_blocked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('availability_exceptions');
  },
};
