const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
    const query = "SELECT * FROM playlists";

    dbConnection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results);
        }
    })
})

router.post("/addplaylist", authenticateAdminToken, (req, res) => {
    const { url, playlistName, playlistSource } = req.body;

    const query = "INSERT INTO playlists (playlist_url, playlist_name, playlist_source) VALUES (?, ?, ?)";

    dbConnection.query(query, [url, playlistName, playlistSource], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (results.affectedRows === 1) {
            console.log("Playlist added successfully.");
            return res.status(201).json({ success: true, message: "Playlist added successfully." })
        }
    })
})

router.delete("/playlistdelete/:id", authenticateAdminToken, (req, res) => {
    const playlistId = req.params.id;
    const query = "DELETE FROM playlists WHERE id = ?";


    dbConnection.query(query, [playlistId], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal Server Error. " });
        }
        if (results.affectedRows === 1) {
            console.log("Playlist deleted successfully.");
            return res.status(201).json({ success: true, message: "Playlist deleted successfully." })
        } else {
            console.log("Nothing deleted");
            return res.status(404).json({ error: "Nothing deleted." });
        }
    })
})

module.exports = router;