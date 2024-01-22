const mysql = require("mysql");
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD

const dbConnection = mysql.createConnection({
    host: "localhost",
    user: username,
    password: password,
    port: 3306,
    database: "webstoredatabase"
});

module.exports = dbConnection