const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const bcrypt = require("bcrypt");
router.use(express.json());

router.post("/createuser", async (req, res) => {
    const { email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO recordstoreusers (email, user_password, user_role) VALUES (?, ?, ?)";
    const values = [email, hashedPassword, role]

    dbConnection.query(query, values, (error, results) => {

        if (error.errno === 1062) {
            return res.status(501).json({ error: "Internal Server Error."})
        }
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error."})
        }
        if (results.affectedRows === 1) {
            console.log("User created successfully.")
            return res.status(201).json({ success: true, message: "User created successfully" });
        } else {
            return res.status(500).json({ error: "Failed to create user" });
        }
    })
})

module.exports = router