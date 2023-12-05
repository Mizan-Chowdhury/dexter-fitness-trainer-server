require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.SECTET_PAYMENT_PK);
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://assigments-de09b.web.app",
      "https://assigments-de09b.firebaseapp.com",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

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
      // console.log(user, "from create token");
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "240h",
      });
      res.send({ token });
    });

    // token verify middleware
    const verifyToken = (req, res, next) => {
      // console.log("from verifyToken", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
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
    const classesCollection = client
      .db("dexterFitnessTrainer")
      .collection("classes");
    const bookingPlansCollection = client
      .db("dexterFitnessTrainer")
      .collection("bookingPlans");

    const bookingTrainerCollection = client
      .db("dexterFitnessTrainer")
      .collection("booking");

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

    // trainer booking api
    app.post("/bookingTrainer", verifyToken, async (req, res) => {
      const classAndSlot = req.body;
      const result = await bookingTrainerCollection.insertOne(classAndSlot);
      res.send(result);
    });

    app.patch("/bookingTrainer/:id", async (req, res) => {
      const id = req.params.id;
      const newRole = req.body.role;
      const userEmail = req.body.email;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: newRole,
        },
      };
      const result = await bookingTrainerCollection.updateOne(
        query,
        updatedDoc
      );

      const query2 = { email : userEmail, role: "member" };
      const result2 = await usersCollection.updateOne(query2, updatedDoc);
      res.send({ result, result2 });
    });

    app.get("/bookingPlans", verifyToken, async (req, res) => {
      const result = await bookingPlansCollection.find().toArray();
      res.send(result);
    });

    app.get("/allMember/:email", async (req, res) => {
      const trainerEmail = req.params.email;
      const query = { trainer_email: trainerEmail, role: "user" };
      const result = await bookingTrainerCollection.find(query).toArray();
      res.send(result);
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
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.get("/allTrainers", verifyToken, async (req, res) => {
      const query = { role: "trainer" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/allTrainers", async (req, res) => {
      const paymentInfo = req.body;
      const query = { email: paymentInfo.trainerEmail };
      console.log(paymentInfo);
      const updatedDoc = {
        $set: {
          payment: paymentInfo.payment,
          paymentAmount: paymentInfo.paymentAmount,
          joined_day: paymentInfo.paymentDate,
          transactionId: paymentInfo.transactionId,
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

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
      console.log(req.decoded, "from 178");
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

    app.get("/users/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(req.decoded, "from 193");
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const users = await usersCollection.findOne(query);
      let user = false;
      if (users) {
        user = users?.role === "user";
      }
      res.send(user);
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

    app.get("/applicantTrainer", verifyToken, async (req, res) => {
      const query = { role: "member" };
      const result = await newTrainersCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/applicantTrainer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const info = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: info.role,
        },
      };
      const result = await newTrainersCollection.updateOne(query, updatedDoc);

      const query2 = { email: info.email };
      const updatedUser = {
        $set: {
          role: info.role,
          payment: "pending",
          joined_day: info.joinedDay,
        },
      };
      const result2 = await usersCollection.updateOne(query2, updatedUser);
      res.send({ result, result2 });
    });

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

    app.post("/newTrainers", verifyToken, async (req, res) => {
      const newTrainers = req.body;
      const result = await newTrainersCollection.insertOne(newTrainers);
      res.send(result);
    });

    app.get("/trainerSlots", verifyToken, async (req, res) => {
      const email = req.decoded.email;
      console.log(email);
      const query = { email: email };
      const result = await newTrainersCollection.findOne(query);

      const query2 = { trainer_email: email, role: "member" };
      const result2 = await bookingTrainerCollection.find(query2).toArray();
      res.send({ result, result2 });
    });

    app.get("/memberActivity", verifyToken, async (req, res) => {
      const email = req.decoded.email;
      console.log(email, 'from 300');
      const query = { user_email: email, role: "user" };
      const result = await bookingTrainerCollection.find(query).toArray();
      res.send(result);
    });

    // acticles api

    app.get("/articles", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await articlesCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/articlesCount", async (req, res) => {
      const count = await articlesCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.post("/articles", verifyToken, async (req, res) => {
      const newArticle = req.body;
      const result = await articlesCollection.insertOne(newArticle);
      res.send(result);
    });

    // all classes api

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    app.post("/classes", verifyToken, async (req, res) => {
      const newClass = req.body;
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    });

    app.get("/admin-stats", verifyToken, async (req, res) => {
      const result = await bookingTrainerCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $toInt: "$pack_price",
                },
              },
            },
          },
        ])
        .toArray();

      const revenue = result.length > 0 ? result[0].totalRevenue : 0;

      const result2 = await usersCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalPayment: {
                $sum: "$paymentAmount",
              },
            },
          },
        ])
        .toArray();

      const payment = result2.length > 0 ? result2[0].totalPayment : 0;

      const totalSubscriber =
        await subscribersCollection.estimatedDocumentCount();
      const totalPaidUser =
        await bookingTrainerCollection.estimatedDocumentCount();

      const paymentDone = await bookingTrainerCollection
        .find()
        .limit(6)
        .toArray();

      res.send({
        revenue,
        payment,
        totalSubscriber,
        totalPaidUser,
        paymentDone,
      });
    });

    // payment intent
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const { salary } = req.body;
      const amount = parseInt(salary * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
