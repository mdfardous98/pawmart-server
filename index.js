const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
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

//  Connection Test
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(" Successfully connected to MongoDB!");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}

const database = client.db("pawmart-user");
const listingsCollection = database.collection("listings");

//

// Test Route
app.get("/", (req, res) => {
  res.send("PawMart Server is running!");
});


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











run();




// Start Server
app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
