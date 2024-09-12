const express = require("express");
const cors = require('cors');
const axios = require("axios");
require('dotenv').config();
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 3001
const server = http.createServer(app);

const corsOptions = {
  origin: [
    "https://recordstore-front-v2.vercel.app",
    "https://www.poppimikko.com",
    "http://localhost:3000"

  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = socketIo(server, {
  cors: {
    origin: [
      "https://recordstore-front-v2.vercel.app",
      "https://www.poppimikko.com",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
  }
});

const recordsRouter = require("./routes/records")
const userRouter = require("./routes/user")
const shoppingcartRouter = require("./routes/shoppingcart")
const chatRouter = require("./routes/chat")
const orderRouter = require("./routes/orders")
const feedbackRouter = require("./routes/feedback")
const searchRouter = require("./routes/search")
const notificationsRouter = require("./routes/notifications")
const playlistRouter = require("./routes/playlists")

app.use(cors(corsOptions));
app.use(express.json());

app.use("/records", recordsRouter)
app.use("/user", userRouter)
app.use("/shoppingcart", shoppingcartRouter)
app.use("/chat", chatRouter)
app.use("/orders", orderRouter)
app.use("/feedback", feedbackRouter)
app.use("/search", searchRouter)
app.use("/notifications", notificationsRouter)
app.use("/playlists", playlistRouter)

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

  socket.on("joinGlobalChat", () => {
    socket.join('globalChat'); // Use a room name if needed
    console.log("User joined Global Chat");
  });

  socket.on("sendMessageGlobalChat", (data) => {
    const { message, sender_id, sender_nickname, created_at } = data;
    console.log(`Message received: ${message} from ${sender_id}`);

    io.to('globalChat').emit("message", {
      message,
      user_id: sender_id,
      user_nickname: sender_nickname,
      created_at
    });
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);

  setInterval(async () => {
    try {
      const response = await axios.delete(`https://recordstore-front-v2.vercel.app/shoppingcart/shoppingcarttimerdelete`);
      console.log(response.data);
    } catch (error) {
      console.error(error.message);
    }
  }, 86400000);
});
