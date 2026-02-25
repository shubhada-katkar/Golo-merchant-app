const express = require("express");
const router = express.Router();
const merchantController = require("../controllers/merchantAuthController");
const authMiddleware = require("../middleware/authMiddleware");
const Otp = require("../models/Otp");
const upload = require("../middleware/upload");

router.get("/profile", authMiddleware, merchantController.getProfile);
router.put("/profile/update", authMiddleware, merchantController.updateProfile);
router.put("/reset-password", authMiddleware, merchantController.resetPassword);

router.post("/register", upload.single("image"),merchantController.registerMerchant);
router.post("/login", merchantController.loginMerchant);
router.put("/profile/image",authMiddleware,
  upload.single("image"), merchantController.updateMerchantImage );

module.exports = router;