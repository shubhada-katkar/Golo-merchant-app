const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  discountPercentage: {
    type: Number,
    required: true
  },

  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  }],

  loyaltyEnabled: {
    type: Boolean,
    default: false
  },

  stars: {
    type: Number,
    default: 0
  },

  validFrom: {
    type: Date,
    required: true
  },

  validTo: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ["active", "expired"],
    default: "active"
  },

  termsAndConditions: {
    type: String
  },

  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Offer", offerSchema);