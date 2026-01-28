const express = require("express");
const router = express.Router();

const { saveMerchantProfile } = require("../controllers/merchantControllers");

router.post("/profile", saveMerchantProfile);

module.exports = router;