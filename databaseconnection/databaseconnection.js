const mysql = require("mysql");
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD
const databaseName = process.env.DATABASE_DATABASENAME
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

/* const dbConnection = mysql.createConnection({
    host: "localhost",
    user: username,
    password: password,
    port: 3306,
    database: databaseName
}); */

module.exports = dbConnection