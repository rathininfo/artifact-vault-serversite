const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster1.mynmq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    // Collections
    const artifactCollections = client
      .db("historical-artifacts")
      .collection("artifacts_collection");
    const userAddedArtifacts = client
      .db("historical-artifacts")
      .collection("added-artifacts");

    // Increment Like Count
    app.patch("/artifacts_collection/:id/like", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const update = { $inc: { likeCount: 1 } };
        const options = { returnDocument: "after" };

        const result = await artifactCollections.findOneAndUpdate(
          query,
          update,
          options
        );

        if (result) {
          res.status(200).send({ likeCount: result.likeCount });
        } else {
          res.status(404).send({ error: "Artifact not found" });
        }
      } catch (err) {
        console.error("Error updating like count:", err);
        res.status(500).send({ error: "Failed to update like count" });
      }
    });

    // Fetch Single Artifact by ID
    app.get("/artifacts_collection/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await artifactCollections.findOne(query);

        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ error: "Artifact not found" });
        }
      } catch (err) {
        console.error("Error fetching artifact by ID:", err);
        res.status(500).send({ error: "Failed to fetch artifact" });
      }
    });

    // Fetch All Artifacts
    app.get("/artifacts_collection", async (req, res) => {
      try {
        const result = await artifactCollections.find().toArray();
        res.status(200).send(result);
      } catch (err) {
        console.error("Error fetching artifacts:", err);
        res.status(500).send({ error: "Failed to fetch artifacts" });
      }
    });

    // Fetch All added Artifacts specific id
    app.get("/user-addded-artifacts/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userAddedArtifacts.findOne(query);

        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ error: "Artifact not found" });
        }
      } catch (err) {
        console.error("Error fetching artifact by ID:", err);
        res.status(500).send({ error: "Failed to fetch artifact" });
      }
    });

    // Fetch All added Artifacts
    app.get("/user-addded-artifacts", async (req, res) => {
      try {
        const result = await userAddedArtifacts.find().toArray();
        res.status(200).send(result);
      } catch (err) {
        console.error("Error fetching artifacts:", err);
        res.status(500).send({ error: "Failed to fetch artifacts" });
      }
    });

    // Fetch Artifacts Added by User (by email)
    app.get("/added_artifacts_collection", async (req, res) => {
      try {
        const email = req.query.email;
        const query = { addedByEmail: email };
        const result = await userAddedArtifacts.find(query).toArray();

        if (result.length > 0) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ error: "No artifacts found for this user" });
        }
      } catch (err) {
        console.error("Error fetching user artifacts:", err);
        res.status(500).send({ error: "Failed to fetch user artifacts" });
      }
    });

    // Add a New Artifact
    app.post("/artifacts-info", async (req, res) => {
      try {
        const artifactsInfo = req.body;
        const result = await userAddedArtifacts.insertOne(artifactsInfo);

        res.status(201).send(result);
      } catch (err) {
        console.error("Error inserting artifact:", err);
        res.status(500).send({ error: "Failed to add artifact" });
      }
    });

    // Update Artifact Information
    app.put("/update_artifact/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedArtifact = req.body;

        // Ensure fields like likeCount and addedByEmail are not updated
        delete updatedArtifact.likeCount;
        delete updatedArtifact.addedByEmail;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedArtifact };

        const result = await userAddedArtifacts.updateOne(filter, updateDoc);

        if (result.modifiedCount === 1) {
          res.status(200).send({ message: "Artifact updated successfully" });
        } else {
          res
            .status(404)
            .send({ error: "Artifact not found or no changes made" });
        }
      } catch (err) {
        console.error("Error updating artifact:", err);
        res.status(500).send({ error: "Failed to update artifact" });
      }
    });

    // Test MongoDB Connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB successfully!");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}
run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Server is connected and running!");
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
