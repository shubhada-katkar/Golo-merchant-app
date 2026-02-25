const Customer = require("../models/Customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");


// ================= REGISTER =================
exports.registerCustomer = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageData = {};

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "golo/customers" } // 👈 different folder
      );

      imageData = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await Customer.create({
      username,
      email,
      phone,
      password: hashedPassword,
      image: imageData,
    });

    res.status(201).json({ message: "Customer Registered Successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ================= LOGIN =================
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: customer._id, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      customer: {
        _id: customer._id,
        username: customer.username,
        email: customer.email,
        phone: customer.phone,
        image: customer.image,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .select("-password");

    res.json({
      success: true,
      customer
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.updateCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);

    const { username, phone, email } = req.body;

    // ================= UPDATE USERNAME =================
    if (username) customer.username = username;

    // ================= UPDATE PHONE =================
    if (phone) customer.phone = phone;

    // ================= UPDATE EMAIL =================
    if (email && email !== customer.email) {

      const existingEmail = await Customer.findOne({ email });

      if (existingEmail) {
        return res.status(400).json({
          message: "Email already in use"
        });
      }

      customer.email = email;
    }

    // ================= UPDATE IMAGE =================
    if (req.file) {

      if (customer.image?.public_id) {
        await cloudinary.uploader.destroy(customer.image.public_id);
      }

      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "golo/customers" }
      );

      customer.image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await customer.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      customer: {
        _id: customer._id,
        username: customer.username,
        email: customer.email,
        phone: customer.phone,
        image: customer.image
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};