const DataExcel = require("./models/dataExcel");
const fs = require("fs");

const stream = fs.createReadStream("data.csv");

async function streamFile() {
  try {
    let data = "";
    stream.on("data", (chunk) => {
      console.log("chunk:", chunk.length);
      data += chunk;
    });
    stream.on("close", async () => {
      console.log("close");
      console.log("data:", data);
      const lines = data.trim().split("\n");
      const cleanLines = lines.slice(1);

      const dataInDatabase = [];
      for (const line of cleanLines) {
        const values = line.split(";");
        const valuesObject = new DataExcel({
          codeOsp: values[0],
          irefc: values[1],
          date: values[2].replace(/\r$/, ""),
        });
        const savedData = await valuesObject.save();
        dataInDatabase.push(savedData);
      }

      console.log("sauvegarde terminée");
    });
  } catch (error) {
    console.log("error:", error);
  }
}

streamFile();
