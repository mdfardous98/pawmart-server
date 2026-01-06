const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token." });
  }
};

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
  try {
    const { db } = req;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.user.userId),
    });

    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Server error during authorization check." });
  }
};

// Middleware to check if user is seller or admin
const verifySeller = async (req, res, next) => {
  try {
    const { db } = req;
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.user.userId),
    });

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res
        .status(403)
        .json({ error: "Access denied. Seller privileges required." });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Server error during authorization check." });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifySeller,
};
