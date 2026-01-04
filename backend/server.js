require('dotenv').config()

const express=require('express')
const app=express()
const cors=require('cors')
const mongoose=require('mongoose'); 
const authRoutes=require('./routes/authRoutes');
const friendRoutes = require("./routes/friendRoutes");



const port= process.env.PORT || 5000
const mongoURI=process.env.MONGO_URI;

app.use(cors())
app.use(express.json())
app.use('/auth',authRoutes);
app.use("/api/friends", friendRoutes);

app.get('/',(req,res)=>{
    res.send("Hello from backend");
});

mongoose.connect(mongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>console.log("MongoDB Connected"))
.catch(e=>console.log("MongoDB connection error:",e));

app.listen(port,()=>{
    console.log("Backend listening");
});