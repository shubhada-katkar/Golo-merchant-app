const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");
const streamifier = require("streamifier");

const uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" }, // optional folder
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });


// ================= CREATE PRODUCT =================
exports.createProduct = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const { productname, category, description, price, status } = req.body;

    if (!productname || !category || !price) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than zero" });
    }

    let imageObj = null;
    if (req.file) {
      // ✅ Upload to Cloudinary from buffer
      const result = await uploadFromBuffer(req.file.buffer);
      imageObj = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    const newProduct = new Product({
      productname,
      category,
      description,
      price,
      status,
      merchantId,
      image: imageObj,
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE PRODUCT =================
exports.deleteProduct = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const productId = req.params.id;

    // Find the product
    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete image from Cloudinary if exists
    if (product.image?.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    // Delete product from database
    await Product.deleteOne({ _id: productId, merchantId });

    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL PRODUCTS (MERCHANT) =================
exports.getAllProducts = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const products = await Product.find({ merchantId });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET DRAFT PRODUCTS =================
exports.getDraftProducts = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const products = await Product.find({ merchantId, status: "draft" });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET PUBLISHED PRODUCTS =================
exports.getPublishedProducts = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const products = await Product.find({ merchantId, status: "published" });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE PRODUCT =================
exports.updateProduct = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const { productname, category, description, price, status } = req.body;

    if (price && price <= 0) {
      return res.status(400).json({ message: "Price must be greater than zero" });
    }

    const product = await Product.findOne({ _id: req.params.id, merchantId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ Handle new image
    if (req.file) {
      if (product.image?.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }
      const result = await uploadFromBuffer(req.file.buffer);
      product.image = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // ✅ Update other fields
    product.productname = productname ?? product.productname;
    product.category = category ?? product.category;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.status = status ?? product.status;

    await product.save();

    res.json({ message: "Product updated successfully", product });

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= PUBLISH PRODUCT =================
exports.publishProduct = async (req, res) => {
  try {
    const merchantId = req.user._id;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, merchantId },
      { status: "published" },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET PRODUCTS BY IDS =================
exports.getProductsByIds = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided" });
    }

    const products = await Product.find({
      _id: { $in: ids },
      merchantId,
    });

    res.json(products);

  } catch (error) {
    console.error("Get products by ids error:", error);
    res.status(500).json({ message: "Server error" });
  }
};