// require("dotenv").config({ path: "./.env" });
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./env",
});

// connectDB(): wiil retrun a promise that we need to handle
// Establish MongoDB connection first, and only start the Express server
// after a successful connection. This ensures the server doesn't run
// without a valid database connection.
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(error, "error");
      throw new error();
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening at ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("MongoDB conncetion failed", err));

/*
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log(error, "error");
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening at ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error, "error");
    throw error;
  }
})();
*/
