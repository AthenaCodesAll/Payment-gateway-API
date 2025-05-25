const { Sequelize } = require('sequelize-typescript');
const config = require('../config/config');

const connection = new Sequelize({
  dialect: 'postgres',
  host: config.dbHost,
  username: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  logging: false,
  models: [__dirname + '/../models'],
});

module.exports = connection;
