'use strict';

require('console-stamp')(console, '[HH:MM:ss.l]');

let express = require('express'),
  app = express();

let mongoose = require('mongoose'),
  PartEntry = require('./PartEntry');

// Mongoose Connection
mongoose.connect('mongodb://localhost/roccade');
mongoose.connection.on('error',
  console.error.bind(console, 'connection error:'));

// Check if a date is valid (http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript)
function isValidDate(d) {
  if (Object.prototype.toString.call(d) === "[object Date]")
    return !isNaN(d.getTime());
  else return false;
}

// Get all entries
app.get('/all', (req, res) => {
  PartEntry.find().select('date trafficState partNumber').then((entries) => {
    res.status(200).send(entries);
  }, (err) => {
    res.status(500).send(err);
  });
});

// Get entries since a specific date
app.get('/since/:date', (req, res) => {
  let d = new Date(req.params.date);

  if (!isValidDate(d))
    res.status(400).send('Invalid Date');
  else {
    PartEntry.find({
        date: {
          $gte: d
        }
      }).select('date trafficState partNumber')
      .then((entries) => {
        res.status(200).send(entries);
      })
  }
})

app.listen(9900, () => {
  console.log("> Server is ready !");
});
