const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
    const query = "SELECT * FROM notifications";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

router.post("/addnotification", authenticateAdminToken, (req, res) => {
    const notification = req.body.notification;

    const query = "INSERT INTO notifications (notification_text) VALUES (?)";

    dbConnection.query(query, [notification], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 1) {
            console.log("Notification added successfully.");
            return res.status(201).json({ success: true, message: "Notification added successfully." })
        }
    })
})

router.delete("/notificationdelete/:id", authenticateAdminToken, (req, res) => {
    const notificationId = req.params.id;
    const query = "DELETE FROM notifications WHERE id = ?";


    dbConnection.query(query, [notificationId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 1) {
            console.log("Notification deleted successfully.");
            return res.status(201).json({ success: true, message: "Notification deleted successfully." })
        } else {
            console.log("Nothing deleted");
            return res.status(404).json({ error: "Nothing deleted." });
        }
    })
})


module.exports = router;