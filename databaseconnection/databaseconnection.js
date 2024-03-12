const mysql = require("mysql");
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD
const usernameCloud = process.env.DATABASE_CLOUD_USERNAME
const passwordCloud = process.env.DATABASE_CLOUD_PASSWORD
const databaseNameCloud = process.env.DATABASE_CLOUD_DATABASENAME
const hostname = process.env.HOSTNAME_CLOUD

const dbConnection = mysql.createConnection({
    host: process.env.HOSTNAME_CLOUD,
    user: process.env.DATABASE_CLOUD_USERNAME,
    password: process.env.DATABASE_CLOUD_PASSWORD,
    port: 3306,
    database: process.env.DATABASE_CLOUD_DATABASENAME
});

module.exports = dbConnection