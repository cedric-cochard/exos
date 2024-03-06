const mongoose = require("mongoose");

const connectionString = process.env.CONNECTION_STRING;

console.log("connectionString:", connectionString);

mongoose
  // @ts-ignore
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database Connected"))
  .catch((error) => console.log(error, "error"));
