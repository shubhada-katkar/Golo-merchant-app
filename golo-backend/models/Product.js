const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Merchant",
        required: true
    },

    productname: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number },
    finalPrice: { type: Number },
    stars: { type: Number },
    terms: { type: String },
    image: { type: String }, // URL or file path
    loyaltyReward: { type: Boolean, default: false },
    status: {type: String, enum:["draft","published"], default:"draft"},
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);