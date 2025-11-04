import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Folder where uploaded files are stored temporarily
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keeps the original file name
  },
});

export const upload = multer({ storage: storage });
