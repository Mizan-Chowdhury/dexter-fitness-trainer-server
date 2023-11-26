require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qzinma9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const galleryPhotos = client.db('dexterFitnessTrainer').collection('galleryPhotos')
    const subscribers = client.db('dexterFitnessTrainer').collection('subscribers')
    const users = client.db('dexterFitnessTrainer').collection('users')
    

    // gallery photos api
    app.get('/photos', async(req,res)=>{
        const limit = parseInt(req.query.limit);
        const page = parseInt(req.query.page);
        const totalCount = await galleryPhotos.estimatedDocumentCount();
        const result = await galleryPhotos.find().skip(page).limit(limit).toArray();
        res.send({totalCount,result });
    })

    // subscribers api
    app.post('/subscribers', async(req,res)=>{
      const newSubscriber = req.body;
      const result = await subscribers.insertOne(newSubscriber);
      res.send(result);
    })

    // users api
    app.post('/users', async(req,res)=>{
      const newUser = req.body;
      const query = {email : newUser.email}
      const insertedUser = await users.findOne(query)
      if(insertedUser){
       return res.send({message: 'user already existed', insertedId: null})
      }
      const result = await users.insertOne(newUser);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', async(req,res)=>{
    res.send('server is running on UI');
})

app.listen(port, ()=>{
    console.log('server is on port :', port);
})