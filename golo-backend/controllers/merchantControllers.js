const Merchant = require("../models/Merchant");

// CREATE / UPDATE PROFILE
exports.saveMerchantProfile = async (req, res) => {

  try {

    const { name, phone, email } = req.body;

    // Basic validation
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    // Check existing merchant
    let merchant = await Merchant.findOne({ phone });

    if (merchant) {

      // Update profile
      merchant.name = name;
      merchant.email = email;

      await merchant.save();

      return res.json({
        success: true,
        message: "Profile updated successfully",
        merchant
      });
    }

    // Create new merchant
    merchant = new Merchant({
      name,
      phone,
      email
    });

    await merchant.save();

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      merchant
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};