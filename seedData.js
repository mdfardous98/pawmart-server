const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ums636c.mongodb.net/pawmart-user?retryWrites=true&w=majority`;

const sampleListings = [
  {
    name: "Golden Retriever Puppy",
    category: "Pets",
    Price: 800,
    location: "New York, NY",
    description:
      "Beautiful, healthy Golden Retriever puppy. 8 weeks old, vaccinated, and ready for a loving home. Great with kids and other pets.",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop",
    email: "seller1@example.com",
    breed: "Golden Retriever",
    age: "8 weeks",
    gender: "Male",
    vaccinated: true,
    trained: false,
    addedAt: new Date(),
    status: "active",
    views: 45,
  },
  {
    name: "Persian Cat",
    category: "Pets",
    Price: 600,
    location: "Los Angeles, CA",
    description:
      "Adorable Persian cat, 1 year old. Very friendly and well-behaved. Comes with all necessary supplies.",
    image:
      "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=500&h=400&fit=crop",
    email: "seller2@example.com",
    breed: "Persian",
    age: "1 year",
    gender: "Female",
    vaccinated: true,
    trained: true,
    addedAt: new Date(Date.now() - 86400000), // 1 day ago
    status: "active",
    views: 32,
  },
  {
    name: "Premium Dog Food - 20kg",
    category: "Pet Food",
    Price: 45,
    location: "Chicago, IL",
    description:
      "High-quality dry dog food suitable for all breeds. Rich in protein and essential nutrients.",
    image:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&h=400&fit=crop",
    email: "seller3@example.com",
    addedAt: new Date(Date.now() - 172800000), // 2 days ago
    status: "active",
    views: 28,
  },
  {
    name: "Cat Scratching Post",
    category: "Accessories",
    Price: 35,
    location: "Miami, FL",
    description:
      "Tall scratching post perfect for cats. Helps keep claws healthy and furniture safe.",
    image:
      "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500&h=400&fit=crop",
    email: "seller4@example.com",
    addedAt: new Date(Date.now() - 259200000), // 3 days ago
    status: "active",
    views: 19,
  },
  {
    name: "Dog Shampoo & Conditioner Set",
    category: "Pet Care Products",
    Price: 25,
    location: "Seattle, WA",
    description:
      "Natural, gentle shampoo and conditioner set for dogs. Suitable for sensitive skin.",
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&h=400&fit=crop",
    email: "seller5@example.com",
    addedAt: new Date(Date.now() - 345600000), // 4 days ago
    status: "active",
    views: 15,
  },
  {
    name: "Labrador Mix Puppy",
    category: "Pets",
    Price: 400,
    location: "Austin, TX",
    description:
      "Energetic and friendly Labrador mix puppy. 10 weeks old, loves to play and great with children.",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=400&fit=crop",
    email: "seller6@example.com",
    breed: "Labrador Mix",
    age: "10 weeks",
    gender: "Female",
    vaccinated: true,
    trained: false,
    addedAt: new Date(Date.now() - 432000000), // 5 days ago
    status: "active",
    views: 67,
  },
];

const sampleUsers = [
  {
    name: "John Doe",
    email: "seller1@example.com",
    role: "seller",
    isVerified: true,
    createdAt: new Date(Date.now() - 2592000000), // 30 days ago
    updatedAt: new Date(),
  },
  {
    name: "Jane Smith",
    email: "seller2@example.com",
    role: "seller",
    isVerified: true,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date(),
  },
  {
    name: "Mike Johnson",
    email: "seller3@example.com",
    role: "seller",
    isVerified: true,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date(),
  },
  {
    name: "Sarah Wilson",
    email: "seller4@example.com",
    role: "seller",
    isVerified: true,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date(),
  },
  {
    name: "Admin User",
    email: "admin@pawmart.com",
    role: "admin",
    isVerified: true,
    createdAt: new Date(Date.now() - 2592000000),
    updatedAt: new Date(),
  },
];

const sampleOrders = [
  {
    productName: "Golden Retriever Puppy",
    buyerName: "Alice Brown",
    price: 800,
    quantity: 1,
    address: "123 Main St, Boston, MA 02101",
    phone: "555-0123",
    email: "alice@example.com",
    listingId: "sample-listing-1",
    sellerId: "seller1@example.com",
    status: "delivered",
    createdAt: new Date(Date.now() - 604800000), // 7 days ago
    updatedAt: new Date(Date.now() - 259200000), // 3 days ago
  },
  {
    productName: "Premium Dog Food - 20kg",
    buyerName: "Bob Davis",
    price: 45,
    quantity: 2,
    address: "456 Oak Ave, Portland, OR 97201",
    phone: "555-0456",
    email: "bob@example.com",
    listingId: "sample-listing-3",
    sellerId: "seller3@example.com",
    status: "shipped",
    createdAt: new Date(Date.now() - 432000000), // 5 days ago
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
  },
];

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("pawmart-user");

    // Clear existing data
    await db.collection("listings").deleteMany({});
    await db.collection("users").deleteMany({});
    await db.collection("orders").deleteMany({});

    // Insert sample data
    await db.collection("listings").insertMany(sampleListings);
    await db.collection("users").insertMany(sampleUsers);
    await db.collection("orders").insertMany(sampleOrders);

    console.log("✅ Sample data inserted successfully!");
    console.log(`📦 ${sampleListings.length} listings added`);
    console.log(`👥 ${sampleUsers.length} users added`);
    console.log(`🛒 ${sampleOrders.length} orders added`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
