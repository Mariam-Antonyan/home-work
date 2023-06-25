const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
function parseCSVRow(row) {
    return row.split(',');
}


function processRows(workerId, rows) {
    const parsedRows = rows.map(parseCSVRow);
    console.log(`Worker ${workerId}: Processed ${rows.length} rows`);
    return parsedRows;
}

function spawnWorker(workerId, rows) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: rows });

        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker ${workerId} stopped with exit code ${code}`));
        });
    });
}

function parseCSVWithWorkers(filename, numWorkers) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const rows = data.trim().split('\n');
            const chunkSize = Math.ceil(rows.length / numWorkers);
            const chunks = [];

            for (let i = 0; i < rows.length; i += chunkSize) {
                chunks.push(rows.slice(i, i + chunkSize));
            }

            const workers = [];
            for (let i = 0; i < Math.min(numWorkers, chunks.length); i++) {
                workers.push(spawnWorker(i, chunks[i]));
            }

            Promise.all(workers)
                .then((results) => {
                    const parsedRows = results.flat();
                    resolve(parsedRows);
                })
                .catch(reject);
        });
    });
}

if (!isMainThread) {
    const { workerData } = require('worker_threads');
    const parsedRows = processRows(workerData.workerId, workerData.rows);
    parentPort.postMessage(parsedRows);
}

const filename = 'data.csv';
const numWorkers = 4;

parseCSVWithWorkers(filename, numWorkers)
    .then((parsedRows) => {
        console.log('Parsed rows:', parsedRows);
    })
    .catch((error) => {
        console.error('Error parsing CSV:', error);
    });

