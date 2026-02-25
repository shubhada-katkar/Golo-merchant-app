const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const verifyMerchant = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }
  next();
};

// ================= ADD PRODUCT =================
router.post(
  "/add",
  verifyMerchant,
  upload.single("image"),
  productController.createProduct
);

// ================= GET PRODUCTS =================
router.get("/", verifyMerchant, productController.getAllProducts);

// ================= PUBLISHED PRODUCTS =================
router.get("/published", verifyMerchant, productController.getPublishedProducts);

// ================= DRAFT PRODUCTS =================
router.get("/draft", verifyMerchant, productController.getDraftProducts);

// ================= UPDATE PRODUCT =================
router.put(
  "/:id",
  verifyMerchant,
  validateObjectId,
  upload.single("image"),
  productController.updateProduct
);

// ================= PUBLISH PRODUCT =================
router.patch(
  "/:id/publish",
  verifyMerchant,
  validateObjectId,
  productController.publishProduct
);

// ================= GET PRODUCTS BY IDS =================
router.post("/by-ids", verifyMerchant, productController.getProductsByIds);

router.delete("/:id", verifyMerchant, validateObjectId, productController.deleteProduct);

module.exports = router;