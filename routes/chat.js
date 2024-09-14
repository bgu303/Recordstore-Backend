const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

let adminId;
let systemId;

//Fetch admin ID from database upon server startup.
//Admin ID later used in other chat related endpoints.
//eg. to define which conversation to fetch.
const fetchAdminId = () => {
    const query = "SELECT id FROM recordstoreusers WHERE user_role = 'ADMIN'";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log("Failed to fetch admin ID: " + error);
            return;
        }
        if (results.length > 0) {
            adminId = results[0].id;
            console.log("Admin ID fetched successfully: " + adminId);
        } else {
            console.log("Admin ID not found.");
        }
    })
}

const fetchSystemId = () => {
    const query = "SELECT id FROM recordstoreusers WHERE email = 'Järjestelmä'";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log("Failed to fetch System ID: " + error);
            return;
        }
        if (results.length > 0) {
            systemId = results[0].id;
            console.log("System ID fetched successfully: " + systemId);
        } else {
            console.log("System ID not found.");
        }
    })
}

fetchAdminId();
fetchSystemId();

router.post("/sendmessage", authenticateToken, (req, res) => {
    const userId = req.body.userId;
    const conversationId = req.body.conversationId;
    const message = req.body.message;

    const query = "INSERT INTO messages (conversation_id, sender_id, message, isread) VALUES (?, ?, ?, true)";

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

router.post("/adminsendmessage", authenticateAdminToken, (req, res) => {
    const userId = req.body.userId;
    const selectedUser = req.body.selectedUser;
    const message = req.body.message;

    let conversationId;
    const searchConversationIdQuery = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)";

    dbConnection.query(searchConversationIdQuery, [selectedUser, adminId, selectedUser, adminId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        else {
            conversationId = results[0].id;
            const query = "INSERT INTO messages (conversation_id, sender_id, message, isread_admin) VALUES (?, ?, ?, true)";

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

router.post("/sendmessageglobal", authenticateToken, (req, res) => {
    const userId = req.body.userId;
    const message = req.body.message;

    const query = "INSERT INTO global_messages (user_id, message) VALUES (?, ?)";

    dbConnection.query(query, [userId, message], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 1) {
            console.log("Message Sent successfully");
            return res.status(201).json({ success: true, message: "Message sent successfully.", message_id: results.insertId })
        }
    })
})

router.get("/getglobalmessages", (req, res) => {
    const query = `
    SELECT gm.id, gm.message, gm.created_at, gm.user_id, ru.user_nickname
    FROM global_messages gm
    JOIN recordstoreusers ru ON gm.user_id = ru.id
    ORDER BY gm.created_at ASC
`;

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    });
});

router.post("/sendautomatedmessage", authenticateToken, (req, res) => {
    const conversationId = req.body.conversationId;
    const message = req.body.message;

    const query = "INSERT INTO messages (conversation_id, sender_id, message, isread, isread_admin) VALUES (?, ?, ?, true, true)";

    dbConnection.query(query, [conversationId, systemId, message], (error, results) => {
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

router.get("/getconversationid/:id", (req, res) => {
    const userId = req.params.id;

    const query = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?)";

    dbConnection.query(query, [userId, adminId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

//What the fuck is this even used for?
router.get("/admingetconversationid/:userid", (req, res) => {
    const userId = req.params.userid;

    const query = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?)";

    dbConnection.query(query, [userId, adminId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
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

router.get("/admingetconversationmessages/:selecteduser", authenticateAdminToken, (req, res) => {
    const selectedUser = req.params.selecteduser;
    let conversationId;

    const searchConversationIdQuery = "SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)";

    dbConnection.query(searchConversationIdQuery, [selectedUser, adminId, adminId, selectedUser], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            if (results.length === 0) {
                return res.status(404).json({ error: "Conversation not found" });
            }

            conversationId = results[0].id;

            const updateQuery = "UPDATE messages SET isread_admin = true WHERE conversation_id = ?";
            dbConnection.query(updateQuery, [conversationId], (updateError) => {
                if (updateError) {
                    console.log(updateError);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                const selectQuery = "SELECT * FROM messages WHERE conversation_id = ?";
                dbConnection.query(selectQuery, [conversationId], (selectError, results) => {
                    if (selectError) {
                        console.log(selectError);
                        return res.status(500).json({ error: "Internal Server Error" });
                    } else {
                        res.json(results);
                    }
                });
            });
        }
    });
});

router.get("/getallconversationmessages", (req, res) => {
    const query = "SELECT * FROM messages";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

router.get("/getallconversationids", (req, res) => {
    const query = "SELECT id FROM conversations";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

router.get("/chatmessagechecker/:conversationid", (req, res) => {
    const conversationId = req.params.conversationid;
    const query = "UPDATE messages SET isread = true WHERE conversation_id = ?";

    dbConnection.query(query, [conversationId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            console.log("Message statuses updated successfully.");
            return res.status(201).json({ success: true, message: "Message statuses updated successfully." })
        }
    })
})

router.delete("/deletefromglobalchat/:id", authenticateAdminToken, (req, res) => {
    const messageId = req.params.id;
    const query = "DELETE FROM global_messages WHERE id = ?";

    dbConnection.query(query, [messageId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Id not found." });
        }
        res.json({ success: true, message: "message deleted successfully" });
        console.log(`Message deleted with id: ${messageId}`);
    })
})

router.delete('/deletefromglobalchat/:userid/:id', authenticateToken, (req, res) => {
    const userId = req.params.userid;
    const messageId = req.params.id;

    const query = `
        DELETE FROM global_messages
        WHERE id = ? AND user_id = ?`;

    dbConnection.query(query, [messageId, userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Message not found or not authorized to delete this message."});
        }
        res.json({ success: true, message: "Message deleted successfully" });
        console.log(`Message deleted with id: ${messageId} by user: ${userId}`);
    });
});

module.exports = router;