const express = require("express");
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = 3001

const recordsRouter = require("./routes/records")
const userRouter = require("./routes/user")
const shoppingcartRouter = require("./routes/shoppingcart")

app.use(cors());
app.use(express.json());

app.use("/records", recordsRouter)
app.use("/user", userRouter)
app.use("/shoppingcart", shoppingcartRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})