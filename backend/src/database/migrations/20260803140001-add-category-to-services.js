'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'category', {
      type: Sequelize.ENUM('Consulta', 'Estética', 'Ortodoncia', 'Cirugía', 'Prevención'),
      allowNull: false,
      defaultValue: 'Consulta',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('services', 'category');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_services_category";');
  },
};
