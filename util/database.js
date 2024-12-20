const Sequelize = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    hostname: process.env.DB_HOST,
    logging: false, // this will disable the sequelize logging
  }
);

module.exports = sequelize;
