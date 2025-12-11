import express from "express";
import expressWs from "express-ws";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import friendsRouter from "./routes/friends";
import subgedditRouter from "./routes/subgeddit";
import chatRouter, { setupChatWS } from "./routes/chat";
import profileRouter from "./routes/profile";

const cors = require("cors");
const PORT = 3000;

const corsOptions = {
  origin: "http://localhost:5173"
}

const app = express();
const wsInstance = expressWs(app);

wsInstance.applyTo(chatRouter)

setupChatWS()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions))

app.use("/auth", authRouter);
app.use("/post", postsRouter);
app.use("/comment", commentsRouter);
app.use("/friend", friendsRouter);
app.use("/subgeddit", subgedditRouter);
app.use("/chat", chatRouter);
app.use("/profile", profileRouter);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

