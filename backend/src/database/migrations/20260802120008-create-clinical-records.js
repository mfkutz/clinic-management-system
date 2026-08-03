'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clinical_records', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      patient_id: {
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
      content: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('clinical_records', ['patient_id'], {
      name: 'clinical_records_patient_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clinical_records');
  },
};
