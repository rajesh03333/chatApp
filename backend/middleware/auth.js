const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const cleanedToken = token.replace("Bearer ", "");
    const decoded = jwt.verify(cleanedToken, process.env.JWT_SECRET);

    req.user = decoded; // attach user id + name to request
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};
