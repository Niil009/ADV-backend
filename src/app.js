import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Enable CORS and allow requests only from the defined origin, also send cookies
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Parse incoming JSON data with a maximum limit of 16kb
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded data (form data) with a 16kb size limit
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files (like images, CSS, JS) from the "publics" folder
app.use(express.static("publics"));

// Parse cookies from client requests and make them available in req.cookies
app.use(cookieParser());

export { app };
