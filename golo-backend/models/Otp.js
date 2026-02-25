const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["merchant", "customer"],
    required: true,
  },

  otp: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  },

  verified: {
    type: Boolean,
    default: false,
  }

}, { timestamps: true });

module.exports = mongoose.model("Otp", otpSchema);