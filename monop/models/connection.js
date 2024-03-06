const mongoose = require("mongoose");

const connectionString =
  "mongodb+srv://admin:fDGe3xUACUsaMIrA@cluster0.k1mrads.mongodb.net/monop";

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database Connected"))
  .catch((error) => console.log(error, "error"));
