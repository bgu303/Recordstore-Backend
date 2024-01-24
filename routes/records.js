const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");

router.get("/", (req, res) => {
    const query = "SELECT * FROM rec";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

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

router.delete("/:id", (req, res) => {
    const recordId = req.params.id;
    const query = "DELETE FROM rec WHERE id = ?";

    dbConnection.query(query, [recordId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true, message: "Record deleted successfully" });
        console.log(`Record deleted with id: ${recordId}`);
    })
})

router.delete("/shoppingcartdelete/:id", (req, res) => {
    const recordId = req.params.id;
    const query = "DELETE FROM shoppingcart WHERE record_id = ?";

    dbConnection.query(query, [recordId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 0) {
            console.log("asd")
            return res.status(404).json({ error: "Nothing deleted." });
        }
        res.json({ success: true, message: "Record deleted successfully" });
        console.log(`Record deleted with id: ${recordId}`);
    })
})

router.post("/addtocart", (req, res) => {
    const { userId, recordId } = req.body;
    const query = "INSERT INTO shoppingcart (user_id, record_id) VALUES (?, ?)";
    const values = [userId, recordId];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            if (error.errno === 1062) {
                console.log(error);
                return res.status(501).json({ error: "Internal Server Error." });
            } else {
                console.log(error)
                return res.status(500).json({ error: "Internal Server Error." });
            }
        }
        if (results.affectedRows === 1) {
            console.log("Added to shopping cart successfully");
            return res.status(201).json({ success: true, message: "Added to shopping cart successfully" });
        }
    })
})

router.post("/addnewrecord", (req, res) => {
    const { artist, title, label, size, lev, kan, price, genre, discogs } = req.body;
    const query = "INSERT INTO rec (artist, title, label, size, lev, kan, price, genre, discogs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [artist, title, label, size, lev, kan, price, genre, discogs] ;

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            return res.status(501).json({ error: "Internal Server Error. "});
        }
        if (results.affectedRows === 1) {
            console.log("New record added successfully");
            return res.status(201).json({ success: true, message: "New record added successfully" });
        }
    })
})

module.exports = router;