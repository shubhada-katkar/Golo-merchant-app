const Offer = require("../models/Offers");

// ================= CREATE OFFER =================
exports.createOffer = async (req, res) => {
    try {
      const merchantId = req.user._id;
        const {
            title,
            discountPercentage,
            products,
            loyaltyEnabled = false,
            stars = 0,
            validFrom,
            validTo,
            termsAndConditions,
        } = req.body;

        // Required fields check
        if (!title || !discountPercentage || !products?.length || !validFrom || !validTo) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        // Discount validation
        if (discountPercentage < 1 || discountPercentage > 100) {
            return res.status(400).json({
                message: "Discount must be between 1 and 100"
            });
        }

        // Date validation
        if (new Date(validFrom) >= new Date(validTo)) {
            return res.status(400).json({
                message: "Invalid offer date range"
            });
        }

        // Auto status
        const status = new Date(validTo) < new Date() ? "expired" : "active";

        const offer = await Offer.create({
            title,
            discountPercentage,
            products,
            loyaltyEnabled,
            stars,
            termsAndConditions,
            validFrom,
            validTo,
            status,
            merchantId
        });

        // Populate products for frontend
        const populatedOffer = await Offer.findById(offer._id)
            .populate("products");

        res.status(201).json({
            success: true,
            message: "Offer created successfully",
            offer: populatedOffer
        });

    } catch (error) {

        console.log("Create Offer Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ================= GET ALL OFFERS =================
exports.getAllOffers = async (req, res) => {
  try {
    const merchantId = req.user._id;

    await updateExpiredOffers();

    const offers = await Offer.find({ merchantId }) // 🔥 filter
      .populate("products")
      .sort({ createdAt: -1 });

    res.status(200).json(offers);

  } catch (error) {
    console.log("Get Merchant Offers Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getExpiredOffers = async (req, res) => {
  try {
    const merchantId = req.user._id;

    await updateExpiredOffers();

    const expiredOffers = await Offer.find({
      merchantId,          // 🔥 IMPORTANT
      status: "expired"
    })
      .populate("products")
      .sort({ createdAt: -1 });

    res.status(200).json(expiredOffers);

  } catch (error) {
    console.log("Get Expired Offers Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= AUTO EXPIRY =================
const updateExpiredOffers = async () => {
  try {
    const now = new Date();

    await Offer.updateMany(
      {
        validTo: { $lt: now }
      },
      {
        $set: { status: "expired" }
      }
    );

  } catch (err) {
    console.log("Expiry Update Error:", err);
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const merchantId = req.user._id;
    const {
      title,
      discountPercentage,
      products,
      loyaltyEnabled = false,
      stars = 0,
      validFrom,
      validTo,
      termsAndConditions,
    } = req.body;

    if (!title || !discountPercentage || !products?.length || !validFrom || !validTo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return res.status(400).json({ message: "Discount must be between 1 and 100" });
    }

    if (new Date(validFrom) >= new Date(validTo)) {
      return res.status(400).json({ message: "Invalid offer date range" });
    }

    const status = new Date(validTo) < new Date() ? "expired" : "active";
 const updatedOffer = await Offer.findOneAndUpdate(
      { _id: offerId, merchantId }, // 🔥 ownership check
      {
        title,
        discountPercentage,
        products,
        loyaltyEnabled,
        stars,
        termsAndConditions,
        validFrom,
        validTo,
        status
      },
      { new: true }
    ).populate("products");

    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer: updatedOffer
    });

  } catch (error) {
    console.log("Update Offer Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE OFFER =================
exports.deleteOffer = async (req, res) => {
  try {
    const offerId = req.params.id;
    const merchantId = req.user._id;

    // Check if the offer exists and belongs to this merchant
    const offer = await Offer.findOne({ _id: offerId, merchantId });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    await Offer.findByIdAndDelete(offerId);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully"
    });

  } catch (error) {
    console.log("Delete Offer Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
