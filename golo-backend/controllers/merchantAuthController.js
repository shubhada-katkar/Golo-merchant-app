const Merchant = require("../models/Merchant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ================= REGISTER =================
exports.registerMerchant = async (req, res) => {
  try {
    const { username, shopName, email, phone, password } = req.body;

    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ message: "Merchant already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageData = {};

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "golo/merchants" }
      );

      imageData = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    const merchant = await Merchant.create({
      username,
      shopName,
      email,
      phone,
      password: hashedPassword,
      image: imageData,
    });

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

    const isMatch = await bcrypt.compare(password, merchant.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: merchant._id, role:"merchant" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      merchant: {
        _id: merchant._id,
        username: merchant.username,
        shopName: merchant.shopName,
        email: merchant.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.user._id).select("-password");
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }
    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= UPDATE PROFILE (NO IMAGE) =================
exports.updateProfile = async (req, res) => {
  try {
    const { password, image, ...safeData } = req.body;

    const updated = await Merchant.findByIdAndUpdate(
      req.user._id,
      safeData,
      { new: true, select: "-password" }
    );

    res.json({ message: "Profile updated", merchant: updated });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= UPDATE IMAGE =================
exports.updateMerchantImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const merchant = await Merchant.findById(req.user._id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    if (merchant.image?.public_id) {
      await cloudinary.uploader.destroy(merchant.image.public_id);
    }

    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      { folder: "golo/merchants" }
    );

    merchant.image = {
      url: result.secure_url,
      public_id: result.public_id,
    };

    await merchant.save();

    res.json({ message: "Image updated", image: merchant.image });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Merchant.findByIdAndUpdate(req.user._id, {
      password: hashedPassword,
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};