const Merchant = require("../models/Merchant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================

exports.registerMerchant = async (req, res) => {
  try {
    const { username, shopName, email, phone, password, image } = req.body;

    const existingMerchant = await Merchant.findOne({ email });

    if (existingMerchant) {
      return res.status(400).json({ message: "Merchant already exists" });
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newMerchant = new Merchant({
      username,
      shopName,
      email,
      phone,
      password: hashedPassword,
      image,
    });

    await newMerchant.save();

    res.status(201).json({ message: "Merchant Registered Successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= LOGIN =================

exports.loginMerchant = async (req, res) => {
  try {
    const { email, password } = req.body;

    const merchant = await Merchant.findOne({ email });

    if (!merchant) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, merchant.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: merchant._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      merchant: {
        _id: merchant._id,
        username: merchant.username,
        shopName: merchant.shopName,
        email: merchant.email,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get merchant profile
exports.getProfile = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const merchant = await Merchant.findById(merchantId).select("-password");

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    res.json({ merchant });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update merchant profile
exports.updateProfile = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const { password, ...safeData } = req.body; // block password update here

    const updated = await Merchant.findByIdAndUpdate(
      merchantId,
      safeData,
      { new: true, select: "-password" }
    );

    res.json({ message: "Profile updated", merchant: updated });

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


// ================= RESET PASSWORD =================

exports.resetPassword = async (req, res) => {
  try {

    const merchantId = req.merchant.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Merchant.findByIdAndUpdate(
      merchantId,
      { password: hashedPassword },
      { new: true }
    );

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
