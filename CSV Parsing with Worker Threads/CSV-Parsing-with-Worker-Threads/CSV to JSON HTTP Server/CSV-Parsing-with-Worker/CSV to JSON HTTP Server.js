const http = require('http');
const express = require('express');
const csvtojson = require('csvtojson');
const fs = require('fs');

const app = express();
const port = 3000;

app.post('/exports', (req, res) => {
    const directoryPath = req.body.directoryPath; // Assuming the directory path is provided in the request body

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            res.status(500).send('Error reading directory');
        } else {
            const jsonPromises = files.map((file) => {
                const filePath = `${directoryPath}/${file}`;
                return csvtojson().fromFile(filePath);
            });

            Promise.all(jsonPromises)
                .then((jsonArray) => {
                    const filenames = [];

                    jsonArray.forEach((json, index) => {
                        const filename = files[index].replace('.csv', '.json');
                        const jsonString = JSON.stringify(json, null, 2);

                        fs.writeFile(filename, jsonString, (err) => {
                            if (err) {
                                console.error(`Error writing file ${filename}: ${err}`);
                            }
                        });

                        filenames.push(filename);
                    });

                    res.status(200).json({ success: true, filenames });
                })
                .catch((err) => {
                    console.error('Error converting CSV to JSON:', err);
                    res.status(500).send('Error converting CSV to JSON');
                });
        }
    });
});

app.get('/files', (req, res) => {
    fs.readdir('.', (err, files) => {
        if (err) {
            res.status(500).send('Error reading directory');
        } else {
            const jsonFiles = files.filter((file) => file.endsWith('.json'));
            res.status(200).json(jsonFiles);
        }
    });
});

app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            const jsonData = JSON.parse(data);
            res.status(200).json(jsonData);
        }
    });
});

app.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    fs.unlink(filename, (err) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            res.status(200).send('File deleted successfully');
        }
    });
});

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
