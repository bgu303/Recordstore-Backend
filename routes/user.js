const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
router.use(express.json());

router.post("/createuser", async (req, res) => {
    const { email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO recordstoreusers (email, user_password, user_role) VALUES (?, ?, ?)";
    const values = [email, hashedPassword, role];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            if (error.errno === 1062) {
                return res.status(501).json({ error: "Internal Server Error."});
            } else {
                console.log(error);
            return res.status(500).json({ error: "Internal Server Error."});
            }
        }
        if (results.affectedRows === 1) {
            console.log("User created successfully.");
            return res.status(201).json({ success: true, message: "User created successfully" });
        } else {
            return res.status(500).json({ error: "Failed to create user" });
        }
    })
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM recordstoreusers WHERE email = ?";

    dbConnection.query(query, [email], async (error, results) => {
        if (error) {
            console.log(`Error in logging in: ${error}`);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = results[0];
        const passwordChecker = await bcrypt.compare(password, user.user_password);

        if (!passwordChecker) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
    
        const token = jwt.sign({ userId: user.id, email: user.email, userRole: user.user_role }, 'your-secret-key', { expiresIn: '1h' });
        console.log(`Logging in with token: ${token}`);
        res.status(200).json({ success: true, token });

    })
})

module.exports = router;