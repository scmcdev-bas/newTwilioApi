const sql = require("mssql");
const config = require('../config');

const createPool = async () => {
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("Connected to MSSQL Server!");
    pool.on("error", (err) => {
      console.error("MSSQL Pool Error:", err);
    });
    return pool;
  } catch (err) {
    console.error("MSSQL Connection Error:", err);
    throw err; 
  }
};

module.exports = createPool;
