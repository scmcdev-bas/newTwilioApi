require('dotenv').config();

const config = {
  api_key: process.env.API_KEY,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
  server: process.env.DB_SERVER ,
  database: process.env.DB_DATABASE ,
  options: {
    encrypt: false, // Disable encryption
  },

};

module.exports = config;
