const express = require("express");
const cors = require('cors');
require('dotenv').config();
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 3001
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "*", // Allow requests from all origins, REMEMBER TO CHANGE LATER!
      methods: ["GET", "POST"] // Allow only specified methods
    }
  });

  const userSockets = {}

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

  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation ${conversationId}`);
  })

    socket.on("sendMessage", (data) => {
      const { message, conversationId } = data
        console.log(`Message was sent ${message} in conversation ${conversationId} with token ${socket.id}`);
        io.to(conversationId).emit("message", data)
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})