const express = require("express");
const cors = require('cors');
require('dotenv').config();
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const port = 3001
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000", // Allow requests from this origin, remember to change when cloud implemented.
      methods: ["GET", "POST"] // Allow only specified methods
    }
  });

const recordsRouter = require("./routes/records")
const userRouter = require("./routes/user")
const shoppingcartRouter = require("./routes/shoppingcart")
const chatRouter = require("./routes/chat")

app.use(cors());
app.use(express.json());

app.use("/records", recordsRouter)
app.use("/user", userRouter)
app.use("/shoppingcart", shoppingcartRouter)
app.use("/chat", chatRouter)

io.on('connection', (socket) => {
    socket.on("sendMessage", (message) => {
        console.log(`Message was sent ${message}`);
        io.emit("message", message)
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})