const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

router.post("/sendfeedback", authenticateToken, (req, res) => {
    const { loggedInUserId, loggedInUserEmail, feedbackMessage } = req.body;
    const values = [loggedInUserId, loggedInUserEmail, feedbackMessage];
    const query = "INSERT INTO feedback (user_id, user_email, feedbackmessage) VALUES (?, ?, ?)";

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            return res.status(501).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows === 1) {
            console.log("New feedback added successfully");
            return res.status(201).json({ success: true, message: "New feedback added successfully." });
        }
    })
})

module.exports = router;