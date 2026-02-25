const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Merchant = require("../models/Merchant");
const BlacklistedToken = require("../models/BlacklistedToken");

module.exports = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
      req.token = token; // ✅ pass token to controller
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Session expired, please login again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "customer") {
      const customer = await Customer.findById(decoded.id).select("-password");
      if (!customer) return res.status(401).json({ message: "Customer not found" });
      req.user = customer;
    } else if (decoded.role === "merchant") {
      const merchant = await Merchant.findById(decoded.id).select("-password");
      if (!merchant) return res.status(401).json({ message: "Merchant not found" });
      req.user = merchant;
    } else {
      return res.status(401).json({ message: "Invalid role" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
