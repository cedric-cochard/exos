const mongoose = require("mongoose");

const excelDataSschema = new mongoose.Schema({
  codeOsp: { type: String, required: true },
  irefc: { type: Number, required: true },
  date: { type: String, required: true },
});

const DataExcel = mongoose.model("excelData", excelDataSschema);

module.exports = DataExcel;
