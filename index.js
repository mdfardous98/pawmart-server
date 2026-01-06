const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import custom middleware and utilities
const { verifyToken, verifyAdmin, verifySeller } = require("./middleware/auth");
const {
  validate,
  userRegistrationSchema,
  listingSchema,
  orderSchema,
  reviewSchema,
} = require("./middleware/validation");
const logger = require("./utils/logger");
const { sendOrderConfirmation, sendWelcomeEmail } = require("./utils/email");

const app = express();
const port = process.env.PORT || 5000;

// ========== SECURITY MIDDLEWARE ==========
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

app.use(limiter);

// ========== CORS CONFIGURATION ==========
app.use(
  cors({
    origin: [
      "https://pawmart-client-2025.netlify.app",
      "http://localhost:5173",
      "https://pawmart-server-olive.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ========== MONGODB CONNECTION ==========
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ums636c.mongodb.net/pawmart-user?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("pawmart-user");
    logger.info("Connected to MongoDB!");

    // Create indexes for better performance
    await createIndexes();
  } catch (error) {
    logger.error("Database connection error:", error);
    process.exit(1);
  }
}

async function createIndexes() {
  try {
    const listingsCollection = db.collection("listings");
    const usersCollection = db.collection("users");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");

    // Create indexes
    await listingsCollection.createIndex({ email: 1 });
    await listingsCollection.createIndex({ category: 1 });
    await listingsCollection.createIndex({ name: "text", description: "text" });
    await listingsCollection.createIndex({ addedAt: -1 });

    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await ordersCollection.createIndex({ email: 1 });
    await reviewsCollection.createIndex({ listingId: 1 });

    logger.info("Database indexes created successfully");
  } catch (error) {
    logger.error("Error creating indexes:", error);
  }
}

// Middleware to attach database to request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ========== AUTHENTICATION ROUTES ==========

// Register user
app.post(
  "/auth/register",
  authLimiter,
  validate(userRegistrationSchema),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = "buyer",
        phone,
        address,
      } = req.body;
      const usersCollection = db.collection("users");

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User already exists with this email" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        address: address || null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(userData);

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.insertedId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Send welcome email
      await sendWelcomeEmail({ name, email });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: result.insertedId,
          name,
          email,
          role,
          phone,
          address,
        },
      });

      logger.info(`New user registered: ${email}`);
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Login user
app.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });

    logger.info(`User logged in: ${email}`);
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get user profile
app.get("/auth/profile", verifyToken, async (req, res) => {
  try {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile
app.put("/auth/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const usersCollection = db.collection("users");

    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      updatedAt: new Date(),
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    logger.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ========== TEST ROUTE ==========
app.get("/", (req, res) => {
  res.json({
    message: "PawMart Server is running!",
    version: "2.0.0",
    status: "Production Ready",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: db ? "connected" : "disconnected",
  });
});

// ========== LISTINGS ROUTES ==========

// Get all listings with pagination and filtering
app.get("/listings", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      location,
      sortBy = "addedAt",
      sortOrder = "desc",
    } = req.query;

    const listingsCollection = db.collection("listings");
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter query
    let filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.Price = {};
      if (minPrice) filter.Price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.Price.$lte = parseFloat(maxPrice);
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [listings, total] = await Promise.all([
      listingsCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      listingsCollection.countDocuments(filter),
    ]);

    res.json({
      listings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Listings fetch error:", error);
    // Return empty data instead of error to prevent client crashes
    res.json({
      listings: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: parseInt(limit),
      },
    });
  }
});

// Get single listing with reviews
app.get("/listings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const listingsCollection = db.collection("listings");
    const reviewsCollection = db.collection("reviews");

    const [listing, reviews] = await Promise.all([
      listingsCollection.findOne({ _id: new ObjectId(id) }),
      reviewsCollection.find({ listingId: id }).toArray(),
    ]);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    res.json({
      ...listing,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  } catch (error) {
    logger.error("Listing fetch error:", error);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// Create new listing (sellers and admins only)
app.post(
  "/listings",
  verifyToken,
  verifySeller,
  validate(listingSchema),
  async (req, res) => {
    try {
      const listingData = {
        ...req.body,
        userId: req.user.userId,
        addedAt: new Date(),
        updatedAt: new Date(),
        status: "active",
        views: 0,
      };

      const listingsCollection = db.collection("listings");
      const result = await listingsCollection.insertOne(listingData);

      res.status(201).json({
        message: "Listing created successfully",
        listingId: result.insertedId,
      });

      logger.info(
        `New listing created by ${req.user.email}: ${listingData.name}`
      );
    } catch (error) {
      logger.error("Listing creation error:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  }
);

// Get listings by category
app.get("/listings/category/:categoryName", async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.categoryName);
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listingsCollection = db.collection("listings");

    const [listings, total] = await Promise.all([
      listingsCollection
        .find({ category, status: "active" })
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      listingsCollection.countDocuments({ category, status: "active" }),
    ]);

    res.json({
      listings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Category listings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch category listings" });
  }
});

// Get user's listings
app.get("/listings/user/:email", verifyToken, async (req, res) => {
  try {
    const userEmail = req.params.email;

    // Users can only access their own listings unless they're admin
    if (req.user.email !== userEmail && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const listingsCollection = db.collection("listings");
    const listings = await listingsCollection
      .find({ email: userEmail })
      .sort({ addedAt: -1 })
      .toArray();

    res.json(listings);
  } catch (error) {
    logger.error("User listings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch user listings" });
  }
});

// Get recent listings
app.get("/recent-listings", async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    if (!db) {
      // If database is not connected, return empty array
      return res.json([]);
    }

    const listingsCollection = db.collection("listings");

    const listings = await listingsCollection
      .find({ status: "active" })
      .sort({ addedAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json(listings);
  } catch (error) {
    logger.error("Recent listings fetch error:", error);
    // Return empty array instead of error to prevent client crashes
    res.json([]);
  }
});

// Search listings
app.get("/search", async (req, res) => {
  try {
    const { search, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!search) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const listingsCollection = db.collection("listings");

    const filter = {
      status: "active",
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ],
    };

    const [listings, total] = await Promise.all([
      listingsCollection
        .find(filter)
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      listingsCollection.countDocuments(filter),
    ]);

    res.json({
      listings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Update listing
app.put("/listings/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const listingsCollection = db.collection("listings");

    // Check if listing exists and user owns it (or is admin)
    const listing = await listingsCollection.findOne({ _id: new ObjectId(id) });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.email !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await listingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    res.json({ message: "Listing updated successfully" });
    logger.info(`Listing updated: ${id} by ${req.user.email}`);
  } catch (error) {
    logger.error("Listing update error:", error);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// Delete listing
app.delete("/listings/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const listingsCollection = db.collection("listings");

    // Check if listing exists and user owns it (or is admin)
    const listing = await listingsCollection.findOne({ _id: new ObjectId(id) });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.email !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await listingsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.json({ message: "Listing deleted successfully" });
    logger.info(`Listing deleted: ${id} by ${req.user.email}`);
  } catch (error) {
    logger.error("Listing deletion error:", error);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

// ========== ORDERS ROUTES ==========

// Create order
app.post("/orders", verifyToken, validate(orderSchema), async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      buyerId: req.user.userId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ordersCollection = db.collection("orders");
    const result = await ordersCollection.insertOne(orderData);

    // Send order confirmation email
    await sendOrderConfirmation(orderData);

    res.status(201).json({
      message: "Order created successfully",
      orderId: result.insertedId,
    });

    logger.info(`New order created: ${result.insertedId} by ${req.user.email}`);
  } catch (error) {
    logger.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get user's orders
app.get("/orders/:email", verifyToken, async (req, res) => {
  try {
    const userEmail = req.params.email;

    // Users can only access their own orders unless they're admin
    if (req.user.email !== userEmail && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const ordersCollection = db.collection("orders");
    const orders = await ordersCollection
      .find({ email: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(orders);
  } catch (error) {
    logger.error("Orders fetch error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Update order status (sellers and admins only)
app.put("/orders/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (
      !["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ordersCollection = db.collection("orders");
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    logger.error("Order status update error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ========== REVIEWS ROUTES ==========

// Add review
app.post("/reviews", verifyToken, validate(reviewSchema), async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      buyerId: req.user.userId,
      createdAt: new Date(),
    };

    const reviewsCollection = db.collection("reviews");

    // Check if user already reviewed this listing
    const existingReview = await reviewsCollection.findOne({
      listingId: reviewData.listingId,
      buyerEmail: reviewData.buyerEmail,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this listing" });
    }

    const result = await reviewsCollection.insertOne(reviewData);

    res.status(201).json({
      message: "Review added successfully",
      reviewId: result.insertedId,
    });
  } catch (error) {
    logger.error("Review creation error:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
});

// Get reviews for a listing
app.get("/reviews/:listingId", async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const reviewsCollection = db.collection("reviews");

    const reviews = await reviewsCollection
      .find({ listingId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(reviews);
  } catch (error) {
    logger.error("Reviews fetch error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ========== ADMIN ROUTES ==========

// Get all users (admin only)
app.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const usersCollection = db.collection("users");

    const [users, total] = await Promise.all([
      usersCollection
        .find({}, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      usersCollection.countDocuments(),
    ]);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Admin users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get dashboard statistics (admin only)
app.get("/admin/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const usersCollection = db.collection("users");
    const listingsCollection = db.collection("listings");
    const ordersCollection = db.collection("orders");

    const [
      totalUsers,
      totalListings,
      totalOrders,
      activeListings,
      pendingOrders,
      recentUsers,
      recentOrders,
    ] = await Promise.all([
      usersCollection.countDocuments(),
      listingsCollection.countDocuments(),
      ordersCollection.countDocuments(),
      listingsCollection.countDocuments({ status: "active" }),
      ordersCollection.countDocuments({ status: "pending" }),
      usersCollection.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      ordersCollection.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      totalUsers,
      totalListings,
      totalOrders,
      activeListings,
      pendingOrders,
      recentUsers,
      recentOrders,
    });
  } catch (error) {
    logger.error("Admin stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Update user role (admin only)
app.put("/admin/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!["buyer", "seller", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const usersCollection = db.collection("users");
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User role updated successfully" });
  } catch (error) {
    logger.error("User role update error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// ========== ERROR HANDLING MIDDLEWARE ==========
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// ========== START SERVER ==========
connectDB().then(() => {
  app.listen(port, () => {
    logger.info(`PawMart server running on port ${port}`);
    console.log(`PawMart server running on port ${port}`);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down server...");
  await client.close();
  process.exit(0);
});
