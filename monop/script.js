require("./models/connection");

const DataExcel = require("./models/dataExcel");

const updateData = () => {
  const newDataExcel = new DataExcel({
    codeOsp: "coucou",
    irefc: 122345,
    date: "06/03/2024",
  });

  if (!newDataExcel.codeOsp || !newDataExcel.irefc || !newDataExcel.date) {
    console.log("un champ est manquant ! ");
    return;
  }

  newDataExcel
    .save()
    .then(() => console.log("données sauvegardées ! "))
    .catch((error) => console.log(error, "error"));
};

updateData();
