'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const ADMIN_EMAIL = 'admin@sistema-turnos.dev';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('admin12345', 10);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        name: 'Admin',
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        phone: null,
        role: 'admin',
        active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: ADMIN_EMAIL });
  },
};
