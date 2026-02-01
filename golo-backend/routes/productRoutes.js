const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const verifyMerchant = require("../middleware/authMiddleware");


// Add product (PROTECTED)
router.post("/add", verifyMerchant, productController.createProduct);

// Get products (merchant wise)
router.get("/", verifyMerchant, productController.getAllProducts);

// Published products
router.get("/published", verifyMerchant, productController.getPublishedProducts);

// Draft products
router.get("/draft", verifyMerchant, productController.getDraftProducts);

// Update product
router.put("/:id", verifyMerchant, productController.updateProduct);

// Publish a draft
router.patch("/:id/publish", verifyMerchant, productController.publishProduct);

module.exports = router;
