const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv"); // Corrected from "dotnv" to "dotenv"
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
dotenv.config();
const port = process.env.PORT || 5000;

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

    // Get the collection
    const artifactCollections = client
      .db("historical-artifacts")
      .collection("artifacts_collection");

    const userAddedArtifacts = client
      .db("historical-artifacts")
      .collection("added-artifacts");

    app.patch("/artifacts_collection/:id/like", async (req, res) => {
      try {
        const id = req.params.id; // Get the artifact ID from the URL
        const query = { _id: new ObjectId(id) }; // Convert the ID to ObjectId

        // Increment the like count by 1
        const update = { $inc: { likeCount: 1 } }; // MongoDB operator to increment
        const options = { returnDocument: "after" }; // Return the updated document

        const result = await artifactCollections.findOneAndUpdate(
          query,
          update,
          options
        );

        console.log("result", result);

        if (result) {
          res.send({ likeCount: result }); // Send the updated artifact back
        } else {
          res.status(404).send({ error: "Artifact not found" }); // If not found
        }
      } catch (err) {
        console.error("Error updating like count:", err);
        // res.status(500).send({ error: "Failed to update like count" }); // Handle server errors
      }
    });

    // GET route to fetch a specific visa by ID
    app.get("/artifacts_collection/:id", async (req, res) => {
      try {
        const id = req.params.id; // Get the ID from the URL
        const query = { _id: new ObjectId(id) }; // Correctly convert the ID to ObjectId
        const result = await artifactCollections.findOne(query);
        res.send(result); // Send the result
      } catch (err) {
        console.error("Error fetching artifact by ID:", err);
        res.status(500).send({ error: "Failed to fetch artifact information" });
      }
    });

    app.get("/artifacts_collection", async (req, res) => {
      const result = await artifactCollections.find().toArray(); // Fetch all jobs
      res.send(result); // Send result with status code 200 (OK)
    });

    app.get("/added_artifacts_collection", async (req, res) => {
      const email = req.query.email;
      const query = { addedByEmail: email };
      const result = await userAddedArtifacts.find(query).toArray(); // Fetch all jobs
      res.send(result); // Send result with status code 200 (OK)
    });

    app.post("/artifacts-info", async (req, res) => {
      try {
        const artifactsInfo = req.body;
        const result = await userAddedArtifacts.insertOne(artifactsInfo);
        res.status(201).send(result);
      } catch (err) {
        console.error("Error inserting artifacts info:", err);
        res
          .status(500)
          .send({ error: "Failed to insert artifacts information" });
      }
    });

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
