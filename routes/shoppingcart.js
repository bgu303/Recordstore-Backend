const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

function generateOrderId() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    // Generate 3 random uppercase letters
    let randomLetters = "";
    for (let i = 0; i < 3; i++) {
        randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate a random 3-digit number
    let randomNumbers = "";
    for (let i = 0; i < 3; i++) {
        randomNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return `${randomLetters}-${randomNumbers}`;
}

//REMEMBER HERE! To go over the endpoints and add authentication layer as needed.
router.get("/shoppingcartitems/:id", (req, res) => {
    const userId = req.params.id;
    const query = `SELECT rec.* FROM shoppingcart JOIN rec ON shoppingcart.record_id = rec.id WHERE shoppingcart.user_id = ?`;

    dbConnection.query(query, [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.status(200).json(results);
    })
})

router.delete("/shoppingcartdelete/:id", authenticateToken, (req, res) => {
    const recordId = req.params.id;
    const deleteQuery = "DELETE FROM shoppingcart WHERE record_id = ?";

    dbConnection.query(deleteQuery, [recordId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Nothing deleted." });
        }

        // After deleting from shoppingcart, update `is_inshoppingcart` to false
        const updateQuery = "UPDATE rec SET is_inshoppingcart = false WHERE id = ?";
        dbConnection.query(updateQuery, [recordId], (updateError, updateResults) => {
            if (updateError) {
                console.log(updateError);
                return res.status(500).json({ error: "Error updating record in rec table" });
            }
            res.json({ success: true, message: "Record removed from cart and updated successfully" });
            console.log(`Record deleted from cart and updated in rec with id: ${recordId}`);
        });
    });
});

router.delete("/shoppingcartdeleteall/:id", (req, res) => {
    const userId = req.params.id;
    const query = "DELETE FROM shoppingcart WHERE user_id = ?";

    dbConnection.query(query, [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 0) {
            console.log("Nothing deleted");
            return res.status(404).json({ error: "Nothing deleted." });
        }
        res.json({ success: true, message: "Records deleted successfully." });
        console.log("Records deleted successfully");
    })
})

router.post("/addtocart", (req, res) => {
    const { userId, recordId } = req.body;
    const insertQuery = "INSERT INTO shoppingcart (user_id, record_id) VALUES (?, ?)";
    const values = [userId, recordId];

    dbConnection.query(insertQuery, values, (error, results) => {
        if (error) {
            if (error.errno === 1062) {
                return res.status(501).json({ error: "Item already in shopping cart." });
            } else {
                console.log(error);
                return res.status(500).json({ error: "Internal Server Error." });
            }
        }
        if (results.affectedRows === 1) {
            console.log("Added to shopping cart successfully");

            // After adding to shoppingcart, update `is_inshoppingcart` to true
            const updateQuery = "UPDATE rec SET is_inshoppingcart = true WHERE id = ?";
            dbConnection.query(updateQuery, [recordId], (updateError, updateResults) => {
                if (updateError) {
                    console.log(updateError);
                    return res.status(500).json({ error: "Error updating record in rec table" });
                }
                return res.status(201).json({ success: true, message: "Added to shopping cart and updated successfully" });
            });
        }
    });
});

router.delete("/shoppingcarttimerdelete", (req, res) => {
    const currentTime = new Date();
    const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
    const selectQuery = "SELECT record_id FROM shoppingcart WHERE added_at < ?";
    const deleteQuery = "DELETE FROM shoppingcart WHERE added_at < ?";

    // Step 1: First, get all record_ids that will be deleted
    dbConnection.query(selectQuery, [twentyFourHoursAgo], (selectError, selectResults) => {
        if (selectError) {
            console.log(selectError);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        if (selectResults.length === 0) {
            console.log("Nothing to delete.");
            return res.status(200).json({ success: `Nothing to be deleted. Current time: ${currentTime}` });
        }

        // Get the record IDs that are going to be deleted
        const recordIds = selectResults.map(row => row.record_id);

        // Step 2: Delete records from shoppingcart
        dbConnection.query(deleteQuery, [twentyFourHoursAgo], (deleteError, deleteResults) => {
            if (deleteError) {
                console.log(deleteError);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            // Step 3: Update the corresponding records in the rec table
            const updateQuery = "UPDATE rec SET is_inshoppingcart = false WHERE id IN (?)";
            dbConnection.query(updateQuery, [recordIds], (updateError, updateResults) => {
                if (updateError) {
                    console.log(updateError);
                    return res.status(500).json({ error: "Error updating records in rec table" });
                }

                res.json({ success: true, message: "Shoppingcart items deleted and records updated successfully." });
                console.log("Shoppingcart items deleted and rec records updated successfully.");
            });
        });
    });
});

router.post("/sendcart", (req, res) => {
    const { customerInfo, userId, shoppingcart } = req.body;
    console.log(shoppingcart)
    let orderId = "";
    const orderCode = generateOrderId();

    const orderQuery = "INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, customer_paymentoption, customer_shippingoption, customer_address, order_date, order_code) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)";
    const orderItemsQuery = "INSERT INTO order_items (order_id, record_id) VALUES (?, ?)";
    const soldQuery = "UPDATE rec SET sold = true WHERE id = ?";

    dbConnection.query(orderQuery, [userId, customerInfo.name, customerInfo.phoneNumber, customerInfo.email, customerInfo.paymentOption, customerInfo.shippingOption, customerInfo.address, orderCode], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows === 1) {
            orderId = results.insertId;
            console.log("Inserting customer data successfully.");
        }

        //Loops shoppingcart items, first it inserts order item (the record) to order_items table, and then on row (results.affectedRows === 1) marks the item as sold in the rec table.
        shoppingcart.forEach(item => {
            dbConnection.query(orderItemsQuery, [orderId, item.id], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(501).json({ error: "Internal Server Error." });
                }
                if (results.affectedRows === 1) {
                    console.log("Inserting order item successfully.");
                    dbConnection.query(soldQuery, [item.id], (error, results) => {
                        if (error) {
                            console.log(error);
                            return res.status(501).json({ error: "Internal Server Error." });
                        }
                        if (results.affectedRows === 1) {
                            console.log("Updating sold status successfully.");
                        }
                    })
                }
            })
        })
        return res.status(201).json({ success: true, message: "New order added successfully.", orderId: orderId, orderCode: orderCode });
    })
})

module.exports = router;