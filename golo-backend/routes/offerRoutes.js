const express = require("express");
const router = express.Router();

const {
  createOffer,
  getAllOffers,
  getExpiredOffers,
  updateOffer,
  deleteOffer
} = require("../controllers/offerController");

const merchantAuth = require("../middleware/authMiddleware");

// Merchant creates offer
router.post("/create", merchantAuth, createOffer);

// Merchant updates offer
router.put("/:id", merchantAuth, updateOffer); 

// Merchant deltes offer
router.delete("/:id",merchantAuth,deleteOffer)

// Merchant dashboard offers
router.get("/all", merchantAuth,getAllOffers);
router.get("/expired", merchantAuth,getExpiredOffers);

module.exports = router;