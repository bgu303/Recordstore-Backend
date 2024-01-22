const express = require("express");
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = 3001

const recordsRouter = require("./routes/records")

app.use(cors());

app.use("/records", recordsRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})