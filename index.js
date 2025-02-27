const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://historical-artifacts-bfa1a.web.app",
      "https://historical-artifacts-bfa1a.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

const varifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  console.log("token inside the verify token", token);
  if (!token) {
    return res.status(401).send({ message: "unauthroized access" });
  }
  //verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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
    // await client.connect();
    console.log("Connected to MongoDB!");

    // Collections
    const artifactCollections = client
      .db("historical-artifacts")
      .collection("artifacts_collection");
    const userAddedArtifacts = client
      .db("historical-artifacts")
      .collection("added-artifacts");

    // jwt token Auth relted api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "Production",
        })
        .send({ success: true });
    });

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

    app.get("/artifacts", async (req, res) => {
      const { search } = req.query; // Get the 'search' query parameter
      try {
        const filter = search
          ? { artifactName: { $regex: search, $options: "i" } } // Case-insensitive search
          : {};

        const artifacts = await artifactCollection.find(filter).toArray();
        res.status(200).json(artifacts);
      } catch (error) {
        console.error("Error fetching artifacts:", error);
        res.status(500).json({ error: "Failed to fetch artifacts" });
      }
    });

    app.get("/user-likes/:userId", async (req, res) => {
      try {
        const { userId } = req.params;

        // Fetch liked artifacts from the user_likes collection
        const userLikesCollection = client
          .db("historical-artifacts")
          .collection("user_likes");

        const likedArtifacts = await userLikesCollection
          .find({ userId })
          .toArray();

        if (likedArtifacts.length === 0) {
          return res.status(404).send({ message: "No liked artifacts yet." });
        }

        const artifactIds = likedArtifacts.map(
          (like) => new ObjectId(like.artifactId)
        );

        // Fetch full artifact details
        const artifacts = await artifactCollections
          .find({ _id: { $in: artifactIds } })
          .toArray();

        res.status(200).send(artifacts);
      } catch (err) {
        console.error("Error fetching liked artifacts:", err);
        res.status(500).send({ error: "Failed to fetch liked artifacts" });
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
    app.get("/added_artifacts_collection", varifyToken, async (req, res) => {
      try {
        const email = req.query.email;
        const query = { addedByEmail: email };

        if (req.user.email !== req.query.email) {
          return res.status(403).send({ message: "forbidden access" });
        }

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
    app.put("/user-added-artifacts/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Validate the ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ObjectId format" });
        }

        const updatedArtifact = req.body;

        console.log("Received updated data:", updatedArtifact);

        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedArtifact };

        const result = await userAddedArtifacts.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: "Artifact not found" });
        }

        res.status(200).send({ message: "Artifact updated successfully" });
      } catch (err) {
        console.error("Error updating artifact:", err);
        res.status(500).send({ error: "Failed to update artifact" });
      }
    });

    // handle delete

    app.delete("/user-added-artifacts/:id", async (req, res) => {
      try {
        const { id } = req.params; // Get the artifact ID from the request URL
        const result = await userAddedArtifacts.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Artifact not found" });
        }

        res.status(200).send({ message: "Artifact deleted successfully" });
      } catch (err) {
        console.error("Error deleting artifact:", err);
        res.status(500).send({ error: "Failed to delete artifact" });
      }
    });

    // Test MongoDB Connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged MongoDB successfully!");
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
