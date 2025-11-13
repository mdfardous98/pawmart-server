const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========
app.use(
  cors({
    origin: [
      "https://pawmart-client-2025.netlify.app", 
      "http://localhost:5173", 
    ],
    credentials: true,
  })
);

app.use(express.json());

// ========== MONGODB CONNECTION ==========
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ums636c.mongodb.net/pawmart-user?retryWrites=true&w=majority`;
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

    const database = client.db("pawmart-user");
    const listingsCollection = database.collection("listings");
    const ordersCollection = database.collection("orders");

    // ========== TEST ROUTE ==========
    app.get("/", (req, res) => {
      res.send("PawMart Server is running!");
    });

    // ========== LISTINGS ROUTES ==========
    app.get("/listings", async (req, res) => {
      try {
        const result = await listingsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch listings" });
      }
    });

    app.get("/listings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await listingsCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch listing" });
      }
    });

    app.post("/listings", async (req, res) => {
      try {
        const listingData = req.body;
        const result = await listingsCollection.insertOne(listingData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create listing" });
      }
    });

    app.get("/listings/category/:categoryName", async (req, res) => {
      try {
        const category = decodeURIComponent(req.params.categoryName);
        const result = await listingsCollection.find({ category }).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch category listings" });
      }
    });

    app.get("/listings/user/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;
        const result = await listingsCollection
          .find({ email: userEmail })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user listings" });
      }
    });

    app.get("/recent-listings", async (req, res) => {
      try {
        const result = await listingsCollection
          .find()
          .sort({ addedAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch recent listings" });
      }
    });

    app.get("/search", async (req, res) => {
      try {
        const searchText = req.query.search;
        const result = await listingsCollection
          .find({ name: { $regex: searchText, $options: "i" } })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Search failed" });
      }
    });

    app.put("/listings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const result = await listingsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update listing" });
      }
    });

    app.delete("/listings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await listingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete listing" });
      }
    });

    // ========== ORDERS ROUTES ==========
    app.post("/orders", async (req, res) => {
      try {
        const orderData = req.body;
        const result = await ordersCollection.insertOne(orderData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create order" });
      }
    });

    app.get("/orders/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;
        const result = await ordersCollection
          .find({ email: userEmail })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch orders" });
      }
    });

    console.log("All routes are set up successfully!");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.error);

// ========== START SERVER ==========
app.listen(port, () => {
  console.log(`PawMart server running on port ${port}`);
});
