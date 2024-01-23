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

module.exports = router;