"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userName: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
          notEmpty: true,
        },
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        validate: {
          min: 4,
        },
        allowNull: false,
      },
      nationalNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      job: {
        type: Sequelize.STRING,
      },
      phoneNum: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      residence: {
        type: Sequelize.STRING,
      },
      isDoctor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
