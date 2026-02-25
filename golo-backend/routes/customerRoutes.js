const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { logoutCustomer } = require("../controllers/customerController");

router.post("/logout", auth, logoutCustomer);

module.exports = router;