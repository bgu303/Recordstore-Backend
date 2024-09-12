const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { authenticateAdminToken } = require("../middleware/authMiddleware");
router.use(express.json());

let adminId;
let systemId;

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

router.post("/createuser", async (req, res) => {
    let { email, password, name, nickName, role } = req.body;

    // Capitalize the first letter of each part of the name
    name = name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO recordstoreusers (email, user_password, user_name, user_nickname, user_role) VALUES (?, ?, ?, ?, ?)";
    const createConvoQuery = "INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)";
    const values = [email, hashedPassword, name, nickName, role];
    let createdUserId;
    let adminId = 57;

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            if (error.errno === 1062) {
                return res.status(409).json({ error: "Email already in use." });
            } else {
                console.log(error);
                return res.status(500).json({ error: "Internal Server Error." });
            }
        }
        if (results.affectedRows === 1) {
            createdUserId = results.insertId;
            dbConnection.query(createConvoQuery, [createdUserId, adminId], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Internal Server Error" });
                } else {
                    console.log("User created successfully.");
                    return res.status(201).json({ success: true, message: "User created successfully" });
                }
            })
        } else {
            return res.status(500).json({ error: "Failed to create user" });
        }
    })
});

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

        const token = jwt.sign({ userId: user.id, email: user.email, userRole: user.user_role, userNickname: user.user_nickname }, 'your-secret-key', { expiresIn: '12h' });
        console.log(`Logging in with token: ${token}`);
        res.status(200).json({ success: true, token });
    })
})

//Idk, it is a fucking mess because I didn't use DELETE ON CASCADE, I will maybe change it later, MAYBE NOT:)
router.post("/deleteuser", async (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM recordstoreusers WHERE email = ?";
    const conversationQuery = "SELECT * FROM conversations WHERE (user1_id = ? AND user2_id = ?)";
    let conversationId;

    dbConnection.query(query, [email], async (error, results) => {
        if (error) {
            console.log(`Error deleting user: ${error}`);
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

        dbConnection.query(conversationQuery, [user.id, adminId], (error, results) => {
            if (error) {
                console.log(`Error fetching conversation id: ${error}`);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (results.length === 0) {
                const deleteUserQuery = "DELETE FROM recordstoreusers WHERE email = ?";
                dbConnection.query(deleteUserQuery, [email], (deleteError, deleteResults) => {
                    if (deleteError) {
                        console.log(`Error deleting user: ${deleteError}`);
                        return res.status(500).json({ error: "Internal Server Error" });
                    }

                    console.log("User and related data deleted successfully.");
                    return res.status(200).json({ message: "User and related data deleted successfully" });
                });
            }

            conversationId = results[0].id;

            // Delete messages first
            const deleteMessagesQuery = "DELETE FROM messages WHERE conversation_id = ?";
            dbConnection.query(deleteMessagesQuery, [conversationId], (messageError, messageResults) => {
                if (messageError) {
                    console.log(messageError);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                // Delete conversations
                const deleteConversationQuery = "DELETE FROM conversations WHERE id = ?";
                dbConnection.query(deleteConversationQuery, [conversationId], (conversationError, conversationResults) => {
                    if (conversationError) {
                        console.log(conversationError);
                        return res.status(500).json({ error: "Internal Server Error" });
                    }

                    // Delete user
                    const deleteUserQuery = "DELETE FROM recordstoreusers WHERE email = ?";
                    dbConnection.query(deleteUserQuery, [email], (deleteError, deleteResults) => {
                        if (deleteError) {
                            console.log(`Error deleting user: ${deleteError}`);
                            return res.status(500).json({ error: "Internal Server Error" });
                        }

                        console.log("User and related data deleted successfully.");
                        return res.status(200).json({ message: "User and related data deleted successfully" });
                    });
                });
            });
        });
    });
});

router.get("/getallusers", (req, res) => {
    const query = `
        SELECT recordstoreusers.*, MAX(messages.created_at) AS last_message_time
        FROM recordstoreusers
        LEFT JOIN messages ON recordstoreusers.id = messages.sender_id
        GROUP BY recordstoreusers.id
        ORDER BY last_message_time DESC;
    `;

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    });
});

router.put("/toggleorderingaccess", authenticateAdminToken, (req, res) => {
    const userId = req.body.userId;
    const getStatusQuery = "SELECT can_order FROM recordstoreusers WHERE id = ?";

    dbConnection.query(getStatusQuery, [userId], (error, results) => {
        if (error) {
            console.log("Error fetching user status: ", error);
            return res.status(500).json({ error: "Internal Server Error." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const currentStatus = results[0].can_order;
        const newStatus = !currentStatus;

        const updateQuery = "UPDATE recordstoreusers SET can_order = ? WHERE id = ?";

        dbConnection.query(updateQuery, [newStatus, userId], (updateError, updateResults) => {
            if (updateError) {
                console.log("Error updating access status: ", updateError);
                return res.status(500).json({ error: "Internal Server Error." });
            }

            if (updateResults.affectedRows > 0) {
                const action = newStatus ? "granted" : "revoked";
                console.log(`Ordering access status ${action} successfully.`);
                return res.status(200).json({ success: true, message: `Ordering access status ${action} successfully.` });
            } else {
                return res.status(404).json({ error: "Something went wrong." });
            }
        });
    });
});

//This follows the same kind of logic as the user who themselves want to delete their user. The database tables have on cascade deleting for the convo and the messages, idk why I need to do it "manually" ....
router.delete("/deleteuseradmin", authenticateAdminToken, async (req, res) => {
    const { userId } = req.body;
    const userQuery = "SELECT * FROM recordstoreusers WHERE id = ?";

    dbConnection.query(userQuery, [userId], (error, results) => {
        if (error) {
            console.log(`Error fetching user: ${error}`);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const conversationQuery = "SELECT * FROM conversations WHERE (user1_id = ? AND user2_id = ?)";
        dbConnection.query(conversationQuery, [userId, adminId], (conversationError, conversationResults) => {
            if (conversationError) {
                console.log(`Error fetching conversations: ${conversationError}`);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (conversationResults.length > 0) {
                const conversationIds = conversationResults.map(conversation => conversation.id);
                const deleteMessagesQuery = "DELETE FROM messages WHERE conversation_id IN (?)";
                dbConnection.query(deleteMessagesQuery, [conversationIds], (messageError, messageResults) => {
                    if (messageError) {
                        console.log(`Error deleting messages: ${messageError}`);
                        return res.status(500).json({ error: "Internal Server Error" });
                    }

                    // Delete the conversations
                    const deleteConversationsQuery = "DELETE FROM conversations WHERE id IN (?)";
                    dbConnection.query(deleteConversationsQuery, [conversationIds], (conversationDeleteError, conversationDeleteResults) => {
                        if (conversationDeleteError) {
                            console.log(`Error deleting conversations: ${conversationDeleteError}`);
                            return res.status(500).json({ error: "Internal Server Error" });
                        }

                        const deleteUserQuery = "DELETE FROM recordstoreusers WHERE id = ?";
                        dbConnection.query(deleteUserQuery, [userId], (deleteUserError, deleteUserResults) => {
                            if (deleteUserError) {
                                console.log(`Error deleting user: ${deleteUserError}`);
                                return res.status(500).json({ error: "Internal Server Error" });
                            }

                            console.log("User and related data deleted successfully.");
                            return res.status(200).json({ message: "User and related data deleted successfully" });
                        });
                    });
                });
            } else {
                // If no conversations, just delete the user
                const deleteUserQuery = "DELETE FROM recordstoreusers WHERE id = ?";
                dbConnection.query(deleteUserQuery, [userId], (deleteUserError, deleteUserResults) => {
                    if (deleteUserError) {
                        console.log(`Error deleting user: ${deleteUserError}`);
                        return res.status(500).json({ error: "Internal Server Error" });
                    }

                    console.log("User deleted successfully.");
                    return res.status(200).json({ message: "User deleted successfully" });
                });
            }
        });
    });
});

module.exports = router;