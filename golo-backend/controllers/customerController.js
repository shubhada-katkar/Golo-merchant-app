const jwt = require("jsonwebtoken");
const BlacklistedToken = require("../models/BlacklistedToken");

exports.logoutCustomer = async (req, res) => {
  try {
    const token = req.token;

    console.log("🔥 Logout API hit");
    console.log("TOKEN:", token);

    if (!token) {
      return res.status(400).json({ message: "Token missing in request" });
    }

    const decoded = jwt.decode(token); // decode only, already verified in middleware

    await BlacklistedToken.create({
      token,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from logout
    });

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Logout failed" });
  }
};