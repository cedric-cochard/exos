const csv = require('csv-parser');
const DataExcel = require('./models/dataExcel');
const fs = require('fs');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');

const stream = fs.createReadStream('data.csv');

async function streamFile() {
    console.info('Deleting all elements ..');
    await DataExcel.deleteMany({});
    console.info('Collection has been cleaned');

    let linesCount = 0;
    try {
        // Entire file is here, right ?
        let data = '';

        stream.on('data', (chunk) => {
            linesCount++;
            // console.log('chunk:', chunk.length);
            // console.log('Line number :', linesCount);
            data += chunk;
        });

        // When entire file has been read
        stream.on('close', async () => {
            console.log('close');
            // console.log('data:', data);
            const lines = data.trim().split('\n');
            console.log('Damn : ', lines.length);
            const cleanLines = lines.slice(1);

            const dataInDatabase = [];
            for (const line of cleanLines) {
                const values = line.split(';');
                const valuesObject = new DataExcel({
                    codeOsp: values[0],
                    irefc: values[1],
                    date: values[2].replace(/\r$/, ''),
                });
                const savedData = await valuesObject.save();
                dataInDatabase.push(savedData);
            }

            console.log('sauvegarde terminée');
            process.exit(0);
        });
    } catch (error) {
        console.log('error:', error);
    }
}

async function streamFilePipeline() {
    console.info('Deleting all elements ..');
    await DataExcel.deleteMany({});
    console.info('Collection has been cleaned');

    let countLines = 0;

    // Dans un prmier temps de passer les éléments 1 par 1 pour ranger en base 1 par 1
    const oneByOneTransform = new Transform({
        objectMode: true,
        transform(chunk, _enc, callback) {
            countLines = countLines + 1;
            // { CODE_OSP: 'MPX_6602680', IREFC: '6602680', DATE_FIN: '9999-12-31' }
            console.log('Chunk : ', chunk);

            callback(null, chunk);
        },
    });

    /** 1 par 1 */
    const insertTransform = new Transform({
        objectMode: true,
        transform(chunk, _enc, callback) {
            // ...InsertIn DB one by one like before
            callback(null);
        },
    });

    // Mais après, il faut qu'il donne 500 élements par 500 à la suite de la pipeline
    //  const nByNTransform = new Transform({
    //     objectMode: true,
    //     transform(chunk, _enc, callback) {
    //         countLines = countLines + 1;
    //         // { CODE_OSP: 'MPX_6602680', IREFC: '6602680', DATE_FIN: '9999-12-31' }
    //         console.log('Chunk : ', chunk);

    //         callback(null, chunk);
    //     },
    // });

    /** 500 par 500 */
    // const insertBulkTransform = new Transform({
    //     objectMode: true,
    //     transform(chunk, _enc, callback) {
    //         // chunk.length === 500
    //         // ...InsertIn DB of 500 elements
    //         callback(null);
    //     },
    // });

    const asyncPipeline = promisify(pipeline);

    await asyncPipeline(
        stream,
        csv({ headers: ['CODE_OSP', 'IREFC', 'DATE_FIN'], separator: ';' }),
        oneByOneTransform,
        insertTransform
    );

    console.info('Number of lines in file, including headers : ', countLines);
    console.info('sauvegarde terminée');
    process.exit(0);
}

// streamFile();
streamFilePipeline();
