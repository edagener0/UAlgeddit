import express from "express";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import friendsRouter from "./routes/friends";
import subgedditRouter from "./routes/subgeddit";

const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:5173"
}

const app = express();

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions))


app.use("/auth", authRouter);
app.use("/post", postsRouter);
app.use("/comment", commentsRouter);
app.use("/friend", friendsRouter);
app.use("/subgeddit", subgedditRouter)

app.get("/", (req, res) => {
  res.send("UAlgeddit server is running!");
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

