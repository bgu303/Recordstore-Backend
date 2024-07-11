const express = require("express");
const router = express.Router();
const dbConnection = require("../databaseconnection/databaseconnection");
const { authenticateToken, authenticateAdminToken } = require("../middleware/authMiddleware");

router.get('/:searchterm', (req, res) => {
    const searchTerm = req.params.searchterm;
    const searchValue = `%${searchTerm}%`;
    console.log(searchValue);
    const query = `
      SELECT * FROM rec 
      WHERE 
        artist LIKE ? 
        OR size LIKE ? 
        OR label LIKE ? 
        OR title LIKE ? 
        OR kan LIKE ? 
        OR lev LIKE ? 
        OR price LIKE ?
        OR genre LIKE ?;
    `;

    dbConnection.query(query,
        [searchValue, searchValue, searchValue, searchValue, searchValue,
            searchValue, searchValue, searchValue, searchValue, searchValue],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(results);
        });
});

module.exports = router;