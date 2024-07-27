const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");
const Joi = require('joi');

const recordSchema = Joi.object({
    artist: Joi.string(),
    title: Joi.string(),
    label: Joi.string(),
    size: Joi.string(),
    lev: Joi.string(),
    kan: Joi.string(),
    price: Joi.number().positive(),
    genre: Joi.string(),
    discogs: Joi.string(),
    sold: Joi.boolean().default(false)
});

router.get("/", (req, res) => {
    const query = "SELECT * FROM rec";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" + error });
        } else {
            res.json(results);
        }
    })
})

//Used to test cloud implementation, delete later.
router.get("/test", (req, res) => {
    res.send("Test working");
})

router.delete("/:id", authenticateAdminToken, (req, res) => {
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

router.post("/addnewrecord", authenticateAdminToken, (req, res) => {
    const { artist, title, label, size, lev, kan, price, genre, discogs, sold } = req.body;
    const query = "INSERT INTO rec (artist, title, label, size, lev, kan, price, genre, discogs, sold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [artist, title, label, size, lev, kan, price, genre, discogs, sold];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            return res.status(501).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows === 1) {
            console.log("New record added successfully");
            return res.status(201).json({ success: true, message: "New record added successfully." });
        }
    })
})

router.post("/addrecords", authenticateAdminToken, (req, res) => {
    const records = req.body.records;

    // Validate each record against the schema
    const { error } = Joi.array().items(recordSchema).validate(records);
    if (error) {
        console.log(error, " Invalid data format: ", error.details)
        return res.status(400).json({ error: "Invalid data format", details: error.details });
    }

    const query = "INSERT INTO rec (artist, title, label, size, lev, kan, price, genre, discogs, sold) VALUES ?";
    const values = records.map(record => [
        record.artist,
        record.title,
        record.label,
        record.size,
        record.lev,
        record.kan,
        record.price,
        record.genre,
        record.discogs,
        false // default value for sold
    ]);

    dbConnection.query(query, [values], (error, results) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ error: "Internal Server Error." });
        }
        if (results.affectedRows > 0) {
            console.log("Records added successfully");
            return res.status(201).json({ success: true, message: "New records added successfully." });
        }
    });
});

router.get("/updatesoldstatustosold/:id", authenticateAdminToken, (req, res) => {
    const { id } = req.params;
    const query = "UPDATE rec SET sold = true WHERE id = ?";

    dbConnection.query(query, [id], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 1) {
            console.log("Sold status updated correctly.")
            return res.status(201).json({ success: true, message: "Sold status updated correctly." });
        }
    })
})

router.get("/updatesoldstatustonotsold/:id", authenticateAdminToken, (req, res) => {
    const { id } = req.params;
    const query = "UPDATE rec SET sold = false WHERE id = ?";

    dbConnection.query(query, [id], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(501).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 1) {
            console.log("Sold status updated correctly.")
            return res.status(201).json({ success: true, message: "Sold status updated correctly." });
        }
    })
})

module.exports = router;