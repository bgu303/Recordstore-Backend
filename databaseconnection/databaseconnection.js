const mysql = require("mysql");
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD
const usernameCloud = process.env.DATABASE_CLOUD_USERNAME
const passwordCloud = process.env.DATABASE_CLOUD_PASSWORD
const hostname = process.env.HOSTNAME_CLOUD

const dbConnection = mysql.createConnection({
    host: "localhost",
    user: username,
    password: password,
    port: 3306,
    database: "webstoredatabase"
});

module.exports = dbConnection