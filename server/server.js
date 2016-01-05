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
  PartEntry.find(function(err, entries){
    res.status(200).send(entries);
  });
});

app.listen(9900, () => {
  console.log("Server is ready !");
});
