const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
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
    const { email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO recordstoreusers (email, user_password, user_role) VALUES (?, ?, ?)";
    const createConvoQuery = "INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)";
    const values = [email, hashedPassword, role];
    let createdUserId;
    let adminId = 14;

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            if (error.errno === 1062) {
                return res.status(501).json({ error: "Internal Server Error." });
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
                    return res.status(501).json({ error: "Internal Server Error" });
                } else {
                    console.log("User created successfully.");
                    return res.status(201).json({ success: true, message: "User created successfully" });
                }
            })
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
    const query = "SELECT * FROM recordstoreusers";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.json(501).json({ error: "Internal Server Error " });
        } else {
            res.json(results);
        }
    })
})

module.exports = router;