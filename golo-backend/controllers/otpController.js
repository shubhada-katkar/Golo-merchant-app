const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");

// ================= EMAIL CONFIG =================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= SEND OTP =================

exports.sendOtp = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      {
        otp,
        expiresAt,
        verified: false,
      },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: `"GOLO App" <${process.env.EMAIL}>`,
      to: email,
      subject: "GOLO Email Verification OTP",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "OTP send failed" });
  }
};


// ================= VERIFY OTP =================

exports.verifyOtp = async (req, res) => {

  try {

    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.otp !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Delete OTP after success (more secure)
    await Otp.deleteOne({ email });

    res.json({ message: "Email verified successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};