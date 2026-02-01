const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.merchant = {
      id: decoded.id
    };

    next();

  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};
