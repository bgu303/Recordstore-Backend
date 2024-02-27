const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/createconversation", (req, res) => {
    const userId = req.body.userId;

    //This stops it from crashing if you press refresh on chat page,
    //However, now chat cannot be opened without navigating off from the page.
    //Needs a fix later.
    if (userId === null) {
        return;
    }
    const adminId = 14;

    const query = `
    INSERT INTO conversations (user1_id, user2_id)
    SELECT ?, ?
    FROM dual
    WHERE NOT EXISTS (
        SELECT 1
        FROM conversations
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    )
    LIMIT 1;
  `;

    const checkExistingQuery = `
    SELECT id
    FROM conversations
    WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
  `;

    dbConnection.query(query, [userId, adminId, userId, adminId, adminId, userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 1) {
            console.log("Message saved successfully.");
            return res.status(201).json({ success: true, message: "Message sent successfully." })
        } else if (results.affectedRows === 0) {
            dbConnection.query(checkExistingQuery, [userId, adminId, userId, adminId], (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(results);
                    res.json(results);
                }
            })
        }
    })
})

router.get("/getconversationid/")

router.post("/sendmessage", (req, res) => {
    const userId = req.body.userId;
    const conversationId = req.body.conversationId;
    const message = req.body.message;

    const query = "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)";

    dbConnection.query(query, [conversationId, userId, message], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 1) {
            console.log("Message Sent successfully");
            return res.status(201).json({ success: true, message: "Message sent successfully." })
        }
    })
})

router.post("/adminsendmessage", (req, res) => {
    const userId = req.body.userId;
    const selectedUser = req.body.selectedUser;
    const message = req.body.message;

    let conversationId;
    const adminId = 14;

    const searchConversationIdQuery = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)";

    dbConnection.query(searchConversationIdQuery, [selectedUser, adminId, selectedUser, adminId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        else {
            conversationId = results[0].id;
            const query = "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)";

            dbConnection.query(query, [conversationId, userId, message], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (results.affectedRows === 1) {
                    console.log("Message Sent successfully");
                    return res.status(201).json({ success: true, message: "Message sent successfully." })
                }
            })
        }
    })
})

router.get("/getconversationid/:id", (req, res) => {
    const userId = req.params.id;
    const adminId = 14;

    const query = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?)";

    dbConnection.query(query, [userId, adminId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error"});
        } else {
            res.json(results);
        }
    })
})

router.get("/getconversationmessages/:conversationid", (req, res) => {
    const conversationId = req.params.conversationid;
    const query = "SELECT * FROM messages WHERE conversation_id = ?";

    dbConnection.query(query, [conversationId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error " });
        } else {
            res.json(results);
        }
    })
})

router.get("/admingetconversationmessages/:selecteduser", (req, res) => {
    const selectedUser = req.params.selecteduser;
    const adminId = 14;
    let conversationId;

    const searchConversationIdQuery = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)";

    dbConnection.query(searchConversationIdQuery, [selectedUser, adminId, selectedUser, adminId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            conversationId = results[0].id;
            const query = "SELECT * FROM messages WHERE conversation_id = ?";
            dbConnection.query(query, [conversationId], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Internal Server Error " });
                } else {
                    res.json(results);
                }
            })
        }
    })
})

module.exports = router;