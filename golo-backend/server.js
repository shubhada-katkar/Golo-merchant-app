const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

{/*Merchant Profile*/}
const merchantRoutes = require("./routes/merchantAuthRoutes");
app.use("/api/merchant", merchantRoutes);

{/*Product Details*/}
const productRoutes = require("./routes/productRoutes");
app.use("/api/products",productRoutes);

{/*Otp*/}
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("GOLO Backend Running Successfully");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});