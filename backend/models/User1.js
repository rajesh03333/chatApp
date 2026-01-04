const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    publicKey: {
      type: String,
      required: true
    },
    publicECDH: {
      type: String,
      required: true
    },
    publicSign: {
      type: String,
      required: true
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User1"
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User1", UserSchema);
