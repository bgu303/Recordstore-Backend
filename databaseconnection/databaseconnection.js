const mysql = require("mysql");
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD
const usernameCloud = process.env.DATABASE_CLOUD_USERNAME
const passwordCloud = process.env.DATABASE_CLOUD_PASSWORD
const databaseNameCloud = process.env.DATABASE_CLOUD_DATABASENAME
const hostname = process.env.HOSTNAME_CLOUD

const dbConnection = mysql.createConnection({
    host: hostname,
    user: usernameCloud,
    password: passwordCloud,
    port: 3306,
    database: databaseNameCloud
});

module.exports = dbConnection