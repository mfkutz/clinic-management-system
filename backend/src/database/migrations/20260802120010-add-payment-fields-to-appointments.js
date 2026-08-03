'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('appointments', 'payment_status', {
      type: Sequelize.ENUM('pending', 'paid'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('appointments', 'payment_method', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('appointments', 'paid_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'amount');
    await queryInterface.removeColumn('appointments', 'payment_status');
    await queryInterface.removeColumn('appointments', 'payment_method');
    await queryInterface.removeColumn('appointments', 'paid_at');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_appointments_payment_status";');
  },
};
