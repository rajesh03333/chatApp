const User = require('../models/User1');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// console.log(User.schema.obj);

exports.signup = async (req, res) => {
  try {
    console.log("received Data:", req.body);

    const { name, email, password, publicKey ,publicECDH,publicSign } = req.body;

    if (!name || !email || !password || !publicKey || !publicECDH || !publicSign) {
      return res.status(400).json({ msg: "All Fields Required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User Already Exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      publicKey, 
      publicECDH,
      publicSign,
    });

    console.log(user);

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7D' }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
        publicECDH: user.publicECDH,
        publicSign: user.publicSign,
      },
    });

  } catch (err) {
    console.error("SIGNUP ERROR FULL:", err);
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "All Fields Required" });

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ msg: "Invalid Credentials" });

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7D' }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
        publicECDH: user.publicECDH,
        publicSign: user.publicSign,  
      },
    });

  } catch (err) {
    return res.status(500).json({
      msg: "Server Error",
      error: err.message,
    });
  }
};
