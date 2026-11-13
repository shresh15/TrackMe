const mysql = require("mysql2/promise");
/*mysql2 is a Node.js library that allows
 our backend to communicate with a MySQL database.
/promise enables Promise-based methods, 
which means we can use async/await
 instead of callbacks.
*/
require("dotenv").config();
const requiredVariables = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable]?.trim(),
);
//.trim() removes whitespace from the beginning
// and end of a string.
if (missingVariables.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVariables.join(", ")}`,
  );
}
// .join() converts an array into a string.

const port = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be an integer between 1 and 65535.");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
