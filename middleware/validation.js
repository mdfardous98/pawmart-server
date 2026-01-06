const Joi = require("joi");

// User registration validation schema
const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("buyer", "seller").default("buyer"),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional(),
  address: Joi.string().max(200).optional(),
});

// Listing validation schema
const listingSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string()
    .valid("Pets", "Pet Food", "Accessories", "Pet Care Products")
    .required(),
  Price: Joi.number().positive().required(),
  location: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  image: Joi.string().uri().required(),
  email: Joi.string().email().required(),
  breed: Joi.string().max(50).optional(),
  age: Joi.string().max(20).optional(),
  gender: Joi.string().valid("Male", "Female").optional(),
  vaccinated: Joi.boolean().optional(),
  trained: Joi.boolean().optional(),
});

// Order validation schema
const orderSchema = Joi.object({
  productName: Joi.string().min(2).max(100).required(),
  buyerName: Joi.string().min(2).max(50).required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  address: Joi.string().min(10).max(200).required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  email: Joi.string().email().required(),
  listingId: Joi.string().required(),
  sellerId: Joi.string().required(),
});

// Review validation schema
const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(5).max(500).required(),
  listingId: Joi.string().required(),
  buyerEmail: Joi.string().email().required(),
});

// Validation middleware function
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }
    next();
  };
};

module.exports = {
  validate,
  userRegistrationSchema,
  listingSchema,
  orderSchema,
  reviewSchema,
};
