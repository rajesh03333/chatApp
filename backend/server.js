require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const port = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("MongoDB Connected");

    app.listen(port, () => {
        console.log("Backend listening");
    });
})
.catch((e) => {
    console.log("MongoDB connection error:", e);
});