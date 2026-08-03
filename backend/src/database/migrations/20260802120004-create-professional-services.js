'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('professional_services', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      professional_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'professionals', key: 'id' },
        onDelete: 'CASCADE',
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onDelete: 'CASCADE',
      },
      price_override: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      duration_override: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('professional_services', ['professional_id', 'service_id'], {
      unique: true,
      name: 'professional_services_unique_pair',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('professional_services');
  },
};
