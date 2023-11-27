require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    // optionsSuccessStatus: 200
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qzinma9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // create secret token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // remove token
    app.post("/logout", (req, res) => {
      res.clearCookie("token", { maxAge: 0 }).send({ success: false });
    });

    // token verify middleware
    const verifyToken = (req, res, next) => {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).send({ error: "unAuthorized" });
      }
      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ error: "unAuthorized" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const galleryPhotosCollection = client
      .db("dexterFitnessTrainer")
      .collection("galleryPhotos");
    const subscribersCollection = client
      .db("dexterFitnessTrainer")
      .collection("subscribers");
    const usersCollection = client
      .db("dexterFitnessTrainer")
      .collection("users");
    const newTrainersCollection = client
      .db("dexterFitnessTrainer")
      .collection("newTrainers");
    const articlesCollection = client
      .db("dexterFitnessTrainer")
      .collection("articles");

    // gallery photos api
    app.get("/photos", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const page = parseInt(req.query.page);
      const totalCount = await galleryPhotosCollection.estimatedDocumentCount();
      const result = await galleryPhotosCollection
        .find()
        .skip(page)
        .limit(limit)
        .toArray();
      res.send({ totalCount, result });
    });

    // subscribers api
    app.get("/subscribers", verifyToken, async (req, res) => {
      const result = await subscribersCollection.find().toArray();
      res.send(result);
    });

    app.post("/subscribers", async (req, res) => {
      const newSubscriber = req.body;
      const result = await subscribersCollection.insertOne(newSubscriber);
      res.send(result);
    });

    // users api
    app.get('/users/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {email : email}
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send(admin);
    });

    app.get("/users/trainer/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let trainer = false;
      if (user) {
        trainer = user?.role === "trainer";
      }
      res.send(trainer);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const insertedUser = await usersCollection.findOne(query);
      if (insertedUser) {
        return res.send({ message: "user already existed", insertedId: null });
      }
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // new trainers api
    app.get("/trainers", async (req, res) => {
      const query = { role: "trainer" };
      const result = await newTrainersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/trainers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newTrainersCollection.findOne(query);
      res.send(result);
    });

    app.post("/newTrainers", async (req, res) => {
      const newTrainers = req.body;
      const result = await newTrainersCollection.insertOne(newTrainers);
      res.send(result);
    });

    // acticles api

    app.get('/articles', verifyToken, async(req,res)=>{
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await articlesCollection.find()
      .skip(page * size)
      .limit(size)
      .toArray();
      res.send(result);
    })

    app.get('/articlesCount', async(req,res)=>{
      const count = await articlesCollection.estimatedDocumentCount();
      res.send({count});
    })

    app.post("/articles", async(req,res)=>{
      const newArticle = req.body;
      const result = await articlesCollection.insertOne(newArticle);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("server is running on UI");
});

app.listen(port, () => {
  console.log("server is on port :", port);
});
