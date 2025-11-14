import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateRefreshAndAcessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh or acess token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user detials from frontend
  const { userName, email, fullName, password } = req.body;

  // Validation empty to check whether all the firleds are there or not
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(200, "All fields are required");
  }
  // Check if user is already existing or not
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User is already existed");
  }
  // Check images and cover images

  const avatrLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatrLocalPath) {
    throw new ApiError(400, "Please upload the avatar");
  }
  // Upload the  avatar iamges on cloudnary
  const avatar = await uploadOncloudinary(avatrLocalPath);
  const coverImage = await uploadOncloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Please upload the avatar");
  }

  // Create user object - create enrty in db

  const user = await User.create({
    userName: userName.toLowerCase(),
    password,
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ",
  });

  // Remove passowrd and refreshtekn field from resonse
  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Check for user creation
  if (!checkUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, checkUser, "User registered sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, password, email } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "Email or userName is required");
  }

  // if (!(userName || email)) {
  //   throw new ApiError(400, "Email or userName is required");
  // }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User never existed");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password must be valid");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAcessToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, refreshToken, accessToken },
        "User logged in sucessfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    // Will return new value which is undefined
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: false,
  };
  return (
    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      // .clearCookie("acessToken", options)
      .json(new ApiResponse(200, {}, "User logged out sucessfullly"))
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateRefreshAndAcessToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid message token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
