require("dotenv").config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json())



app.get('/', async(req,res)=>{
    res.send('server is running on UI');
})

app.listen(port, ()=>{
    console.log('server is on port :', port);
})