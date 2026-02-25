const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
    },

    shopName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    phone: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    image: {
        url: {
            type: String,
        },
        public_id: {
            type: String,
        },
    },

    status: {
        type: String,
        enum: ["pending", "approved", "blocked"],
        default: "pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Merchant", merchantSchema);