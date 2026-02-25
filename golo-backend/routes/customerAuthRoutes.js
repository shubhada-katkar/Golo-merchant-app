const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerAuthController");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", upload.single("image"), customerController.registerCustomer);
router.post("/login", customerController.loginCustomer);

router.get("/profile", authMiddleware, customerController.getCustomerProfile);
router.put("/profile", authMiddleware, upload.single("image"), customerController.updateCustomerProfile);

module.exports = router;