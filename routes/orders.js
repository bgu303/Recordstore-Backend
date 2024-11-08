const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

router.get("/getorderdata", authenticateAdminToken, (req, res) => {
    //GPT-magic. :) The query returns all of the order items with the order details aswell. So, grouping is needed on front-end side to only show customer data once, then item data.
    const query = `SELECT o.*, oi.record_id, r.artist, r.title, r.size, r.price, r.label, r.shelf_space
    FROM orders o
    INNER JOIN order_items oi ON o.id = oi.order_id
    INNER JOIN rec r ON oi.record_id = r.id;
    `;

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error." });
        } else {
            res.json(results);
        }
    });
});

router.get("/getorderdatabyid/:id", (req, res) => {
    const userId = req.params.id
    const query = `
        SELECT o.*, oi.record_id, r.artist, r.title, r.size, r.price, r.label
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN rec r ON oi.record_id = r.id
        WHERE o.user_id = ?;`;

    dbConnection.query(query, [userId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error." });
        } else {
            res.json(results);
        }
    });
})

router.delete("/deleteorder/:id", authenticateAdminToken, (req, res) => {
    const orderId = req.params.id;
    const getOrderItemsQuery = "SELECT record_id FROM order_items WHERE order_id = ?"
    const deleteOrderQuery = "DELETE FROM orders WHERE id = ?";
    const updateOrderItemsQuery = "UPDATE rec SET sold = false, is_inshoppingcart = false WHERE id IN (?)";

    //First gets the record ids associated with the order (used to set status later)
    //Secondly, the order is deleted (order items will be deleted on order deletion)
    //Third, updates the status of sold items of the order back set to false, based on the fetched record ids in the first step.
    dbConnection.query(getOrderItemsQuery, [orderId], (error, results) => {
        const recordIds = results.map(row => row.record_id);

        dbConnection.query(deleteOrderQuery, [orderId], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Internal Server Error." });
            }
            if (results.affectedRows === 0) {
                console.log("No order deleted");
                return res.status(404).json({ error: "No order deleted." });
            }
            console.log(`Order deleted with id: ${orderId}`);

            dbConnection.query(updateOrderItemsQuery, [recordIds], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ error: "Internal Server Error." });
                }

                console.log("Records updated successfully.");
                res.json({ success: true, message: "Order deleted successfully." });
            });
        });
    });
});

router.get("/changeorderstatus/:id/:status", (req, res) => {
    const orderId = req.params.id;
    const orderStatus = req.params.status;
    const query = "UPDATE orders SET order_status = ? WHERE id = ?";
    const values = [orderStatus, orderId];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows === 1) {
            console.log("Order status updated correctly.");
            return res.status(201).json({ success: true, message: "Order status updated correctly." });
        } else {
            return res.status(404).json({ error: "Order not found." });
        }
    });
});

router.get("/getallorders", authenticateAdminToken, (req, res) => {
    const query = "SELECT * FROM orders";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error." });
        } else {
            res.json(results);
        }
    })
})

router.delete("/deletefromorder/:orderId/:recordId", authenticateAdminToken, (req, res) => {
    const { orderId, recordId } = req.params;

    const deleteOrderItemQuery = "DELETE FROM order_items WHERE order_id = ? AND record_id = ?";
    const updateStatusQuery = "UPDATE rec SET sold = false, is_inshoppingcart = false WHERE id = ?";

    dbConnection.query(deleteOrderItemQuery, [orderId, recordId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Order item not found." });
        }

        dbConnection.query(updateStatusQuery, [recordId], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: "Failed to update record status." });
            }

            res.json({ success: true, message: "Order item deleted and record status updated successfully." });
            console.log("Order item deleted and record sold status updated to false.");
        });
    });
});

module.exports = router;