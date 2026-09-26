require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/api/friends", friendRoutes);

app.get("/", (req, res) => {
    res.send("Hello from backend");
});

module.exports = app;