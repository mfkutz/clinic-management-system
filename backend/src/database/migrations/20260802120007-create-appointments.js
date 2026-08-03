'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appointments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      professional_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'professionals', key: 'id' },
        onDelete: 'RESTRICT',
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onDelete: 'RESTRICT',
      },
      start_datetime: { type: Sequelize.DATE, allowNull: false },
      end_datetime: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('confirmed', 'cancelled', 'completed', 'no_show'),
        allowNull: false,
        defaultValue: 'confirmed',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      cancellation_reason: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('appointments', ['professional_id', 'start_datetime'], {
      name: 'appointments_professional_start_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('appointments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_appointments_status";');
  },
};
