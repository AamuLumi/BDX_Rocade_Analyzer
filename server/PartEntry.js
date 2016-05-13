'use strict';

let mongoose = require('mongoose');

let PartEntrySchema = new mongoose.Schema({
  d: Date, // Date
  p: [{type : Number, default: -1}] // Parts
});

module.exports = mongoose.model('PartEntry', PartEntrySchema);
