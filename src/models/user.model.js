import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt, { compare } from "bcrypt";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      unique: true, // Must be unique across users
      required: true, // Cannot be empty
      lowercase: true, // Always stored in lowercase
      trim: true, // Removes extra spaces
      index: true, // Improves search performance
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowerCase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //gonna use cloudnary url
      required: true,
    },
    coverImage: {
      type: String, //gonna use cloudnary url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId, // References a Video document
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String, // Stores user's refresh token for session renewal
    },
  },
  { timestamps: true }
);

//
// 🔐 Pre-save hook to hash password before saving
//
userSchema.pre("save", async function (next) {
  // Only hash the password if it’s new or modified
  if (!this.isModified("password")) return next();

  // Hash the password with salt rounds = 10
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//
// 🧠 Instance method to compare entered password with stored hashed password
//
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//
// 🔑 Instance method to generate an Access Token
// - Short-lived token (e.g., 15m, 1h)
// - Used for authorizing protected routes
//

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id, //will get this from mongoDb
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET, // Secret key for access token
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Example: "15m" or "1h"
  );
};

//
// 🔁 Instance method to generate a Refresh Token
// - Long-lived token (e.g., 7d, 30d)
// - Used to get new access tokens when old ones expire
//

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id, //will get this from mongoDb
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET, // Separate secret for refresh token
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
