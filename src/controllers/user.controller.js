import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
