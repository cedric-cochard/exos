// @ts-ignore
const csv = require("csv-parser");
const DataExcel = require("./models/dataExcel");
const fs = require("fs");
const { Transform, pipeline } = require("stream");
const { promisify } = require("util");

const stream = fs.createReadStream("data.csv");

async function streamFile() {
  console.info("Deleting all elements ..");
  await DataExcel.deleteMany({});
  console.info("Collection has been cleaned");

  let linesCount = 0;
  try {
    // Entire file is here, right ?
    let data = "";

    stream.on("data", (chunk) => {
      linesCount++;
      // console.log('chunk:', chunk.length);
      // console.log('Line number :', linesCount);
      data += chunk;
    });

    // When entire file has been read
    stream.on("close", async () => {
      console.log("close");
      // console.log('data:', data);
      const lines = data.trim().split("\n");
      console.log("Damn : ", lines.length);
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
      process.exit(0);
    });
  } catch (error) {
    console.log("error:", error);
  }
}

async function streamFilePipeline() {
  console.info("Deleting all elements ..");
  await DataExcel.deleteMany({});
  console.info("Collection has been cleaned");

  let countLines = 0;

  // Dans un prmier temps de passer les éléments 1 par 1 pour ranger en base 1 par 1
  // const oneByOneTransform = new Transform({
  //   objectMode: true,
  //   transform(chunk, _enc, callback) {
  //     countLines = countLines + 1;
  //     // { CODE_OSP: 'MPX_6602680', IREFC: '6602680', DATE_FIN: '9999-12-31' }
  //     console.log("Chunk : ", chunk);

  //     callback(null, chunk);
  //   },
  // });

  /** 1 par 1 */
  // const insertTransform = new Transform({
  //   objectMode: true,
  //   async transform(chunk, _enc, callback) {
  //     // ...InsertIn DB one by one like before
  //     console.log("enc:", _enc);
  //     const valuesObject = new DataExcel({
  //       codeOsp: chunk.CODE_OSP,
  //       irefc: chunk.IREFC,
  //       date: chunk.DATE_FIN,
  //     });
  //     await valuesObject.save();
  //     console.log("Saved:", chunk);
  //     callback(null);
  //   },
  // });

  // Mais après, il faut qu'il donne 500 élements par 500 à la suite de la pipeline
  const limit = 500;
  let bufferElements = [];
  const nByNTransform = new Transform({
    objectMode: true,
    transform(chunk, _enc, callback) {
      countLines = countLines + 1;
      // { CODE_OSP: 'MPX_6602680', IREFC: '6602680', DATE_FIN: '9999-12-31' }
      let batch = null;
      bufferElements.push(chunk);
      while (bufferElements.length >= limit) {
        batch = bufferElements.splice(0, limit);
        console.log("batchL:", batch.length);
        this.push(batch);
      }
      // if (bufferElements.length < limit) {
      //   this.push(batch);
      // }
      callback(null, batch);
    },
  });

  /** 500 par 500 */
  const insertBulkTransform = new Transform({
    objectMode: true,
    async transform(batch, _enc, callback) {
      // chunk.length === 500
      // ...InsertIn DB of 500 elements

      for (const element of batch) {
        const valuesObject = new DataExcel({
          codeOsp: element.codeOsp,
          irefc: element.irefc,
          date: element.date,
        });
        await valuesObject.save();
      }

      bufferElements = [];
      callback(null);
    },
  });

  const asyncPipeline = promisify(pipeline);

  await asyncPipeline(
    stream,
    csv({ headers: ["codeOsp", "irefc", "date"], separator: ";" }),
    nByNTransform,
    insertBulkTransform
  );

  console.info("Number of lines in file, including headers : ", countLines);
  console.info("sauvegarde terminée");
  process.exit(0);
}

// streamFile();
streamFilePipeline();
