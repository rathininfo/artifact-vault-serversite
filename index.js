const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); // Corrected from "dotnv" to "dotenv"
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
dotenv.config();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// rathininfo7;
// hpngBFYgzrgRslcB;

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster1.mynmq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Test Route
app.get("/", (req, res) => {
  res.send("Server Is connected");
});

// Start Server
app.listen(port, () => {
  console.log(`The Server is running on port ${port}`);
});
