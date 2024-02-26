const express = require("express");
const router = express.Router();

router.post("/createconversation", (req, res) => {
    const userId = req.body.userId;
    console.log(userId)
})

module.exports = router;