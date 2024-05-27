const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("bistro server is running....");
});

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pvtbyiu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client
      .db("bistroRestaurantDB")
      .collection("allMenu");
    const myCartCollection = client
      .db("bistroRestaurantDB")
      .collection("myCart");
    const allUsersCollection = client
      .db("bistroRestaurantDB")
      .collection("allUsers");
    //  all apis

    // ----------Payment apis-------------- 

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      console.log(price)
      const amount = parseInt(price * 100); 

       if(amount > 0 ){
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
  
          payment_method_types: ["card"],
        });
  
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
       }
    });

    // ----------------------------------get apis----------------------------------
    app.get("/allMenu", async (req, res) => {
      const menu = await menuCollection.find().toArray();
      res.send(menu);
    });
    app.get("/myCart", async (req, res) => {
      const { email } = req.query;
      const filter = { email: email };
      const result = await myCartCollection.find(filter).toArray();
      res.send(result);
    });
    app.get("/allUsers", async (req, res) => {
      const result = await allUsersCollection.find().toArray();
      res.send(result);
    });

    // -------------------------post apis-------------------------

    app.post("/myCart", async (req, res) => {
      const newMenu = req.body;
      const result = await myCartCollection.insertOne(newMenu);
      res.send(result);
    });
    app.post("/allUsers", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const existingUser = await allUsersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await allUsersCollection.insertOne(newUser);
      res.send(result);
    });

    // --------------------------update apis--------------------------
    app.patch("/myCart/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { menuId: id };
      const updatedValue = req.body;
      const updatedDoc = {
        $set: {
          quantity: updatedValue.quantity,
        },
      };
      const result = await myCartCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.patch("/allUsers/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedValue = req.body;
      const updatedDoc = {
        $set: {
          role: updatedValue.role,
        },
      };
      const result = await allUsersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // ------------------------------delete apis------------------------------
    app.delete("/myCart/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const result = await myCartCollection.deleteOne(filter);
      res.send(result);
    });
    app.delete("/allUsers/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const result = await allUsersCollection.deleteOne(filter);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`bistro server is running on port: ${port}`);
});
