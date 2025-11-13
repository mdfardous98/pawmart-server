const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware - 
app.use(
  cors({
    origin: [
      "https://pawmart-client.vercel.app", 
      "http://localhost:5173", 
    ],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ums636c.mongodb.net/pawmart-user?retryWrites=true&w=majority`;

// Mongo Client Setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connection Test
async function run() {
  try {
    // await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("pawmart-user");
    const listingsCollection = database.collection("listings");
    const ordersCollection = database.collection("orders");

    // Test route
    app.get("/", (req, res) => {
      res.send("PawMart Server is running!");
    });

    // ========== LISTINGS ROUTES ==========

    // Get all listings
    app.get("/listings", async (req, res) => {
      try {
        const result = await listingsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch listings" });
      }
    });

    // Get listing by ID
    app.get("/listings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await listingsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch listing" });
      }
    });

    // Create new listing
    app.post("/listings", async (req, res) => {
      try {
        const listingData = req.body;
        const result = await listingsCollection.insertOne(listingData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create listing" });
      }
    });

    // Get listings by category
    app.get("/listings/category/:categoryName", async (req, res) => {
      try {
        const category = req.params.categoryName;
        const query = { category: category };
        const result = await listingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch category listings" });
      }
    });

    // Get user's listings
    app.get("/listings/user/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;
        const query = { email: userEmail };
        const result = await listingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user listings" });
      }
    });

    // Get recent listings
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

    // Search listings by name
    app.get("/search", async (req, res) => {
      try {
        const searchText = req.query.search;
        const query = { name: { $regex: searchText, $options: "i" } };
        const result = await listingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Search failed" });
      }
    });

    // Update listing
    app.put("/listings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const query = { _id: new ObjectId(id) };
        const update = { $set: updatedData };
        const result = await listingsCollection.updateOne(query, update);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update listing" });
      }
    });

    // Delete listing
    app.delete("/listings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await listingsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete listing" });
      }
    });

    // ========== ORDERS ROUTES ==========

    // Create order
    app.post("/orders", async (req, res) => {
      try {
        const orderData = req.body;
        const result = await ordersCollection.insertOne(orderData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create order" });
      }
    });

    // Get user's orders
    app.get("/orders/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;
        const query = { email: userEmail };
        const result = await ordersCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch orders" });
      }
    });

    console.log("All routes are set up successfully!");
  } catch (error) {
    console.log("Database connection error:", error);
  }
}

run().catch(console.dir);

// Start server
app.listen(port, () => {
  console.log(`PawMart server running on port ${port}`);
});
