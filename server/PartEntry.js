'use strict';

let mongoose = require('mongoose');

let PartEntrySchema = new mongoose.Schema({
  date: Date,
  partNumber: Number,
  trafficState: Number
});

module.exports = mongoose.model('PartEntry', PartEntrySchema);
