const Product = require("../models/Product");


// ================= CREATE PRODUCT =================

exports.createProduct = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const newProduct = new Product({
      ...req.body,
      merchantId
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= GET ALL PRODUCTS (MERCHANT) =================

exports.getAllProducts = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const products = await Product.find({ merchantId });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= GET DRAFT PRODUCTS =================

exports.getDraftProducts = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const products = await Product.find({
      merchantId,
      status: "draft"
    });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= GET PUBLISHED PRODUCTS =================

exports.getPublishedProducts = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const products = await Product.find({
      merchantId,
      status: "published"
    });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= UPDATE PRODUCT =================

exports.updateProduct = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, merchantId },
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated", product: updatedProduct });

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};


// ================= PUBLISH PRODUCT =================

exports.publishProduct = async (req, res) => {
  try {

    const merchantId = req.merchant.id;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, merchantId },
      { status: "published" },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
