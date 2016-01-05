'use strict';

let express = require('express'),
    app = express();

let mongoose = require('mongoose'),
    PartEntry = require('./PartEntry');

// Mongoose Connection
mongoose.connect('mongodb://localhost/roccade');
mongoose.connection.on('error',
  console.error.bind(console, 'connection error:'));

app.get('/all', (req, res) => {
  PartEntry.find().select('date trafficState partNumber').then((entries) => {
    res.status(200).send(entries);
  }, (err) => {
    res.status(500).send(err);
  });
});

app.listen(9900, () => {
  console.log("> Server is ready !");
});
