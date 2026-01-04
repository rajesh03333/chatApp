const express = require("express");
const router = express.Router();
const User = require("../models/User1");

router.get("/search", async (req, res) => {
  try {
    const q = req.query.username;
    if (!q) return res.json([]);

    const users = await User.find({
      name: { $regex: q, $options: "i" }
    }).select("name publicKey publicECDH publicSign");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});


router.post("/auto-add", async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId || userId === friendId) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFriends = user.friends.includes(friendId);

    if (!alreadyFriends) {
      user.friends.push(friendId);
      friend.friends.push(userId);
      await user.save();
      await friend.save();
    }

    res.json({ success: true, alreadyFriends });
  } catch (err) {
    res.status(500).json({ error: "Friend add failed" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);

    const user = await User.findById(userId).populate("friends", "name publicKey publicECDH publicSign");

    console.log("user:",user);

    if (!user) return res.status(200).json([]); 
    console.log(user.friends);

    return res.status(200).json(user.friends || []);
  } catch (err) {
    return res.status(200).json([]); 
  }
});


module.exports = router;
