'use strict';

require('console-stamp')(console, '[HH:MM:ss.l]');
require('datejs');

let express = require('express'),
    app = express(),
    bodyParser = require('body-parser');

let mongoose = require('mongoose'),
    PartEntry = require('./PartEntry');

// Default period of entries selection (in hours)
let defaultPeriod = 6;

const PORT = 9900;

const CODE_SUCCESS = 200;
const CODE_INVALID = 400;
const CODE_ERROR = 500;

// For searching elements of same period,
//  we say that elements are recorded in one minute max.
const periodThreshold = 1;

// Mongoose Connection
mongoose.connect('mongodb://localhost/roccade');
mongoose.connection.on('error',
    console.error.bind(console, 'connection error:'));

// Express server configuration
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin',
        'http://localhost:9901');
    res.header('Access-Control-Allow-Methods',
        'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Check if a date is valid
// (http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript)
function isValidDate(d) {
    if (Object.prototype.toString.call(d) === '[object Date]') {
        return !isNaN(d.getTime());
    } else {
        return false;
    }
}

// Parse date request ONLY for POST /request
function parseDateForRequest(req) {
    // Default : get today entries
    let date = {
        '$gte': Date.today()
    };

    // If sinceDate, add it to date
    if ('since' in req.body) {
        date.$gte = Date.parse(req.body.since).toString('s');

        // If untilDate, add it
        if ('until' in req.body) {
            date.$lte = Date.parse(req.body.until).toString('s');
        } else { // Else we must calculate the untilDate
            let period = defaultPeriod;

            // If period precised, use it
            if ('period' in req.body) {
                period = parseInt(req.body.period);
            }

            // Calculate untilDate
            date.$lte = Date.parse(req.body.since).addHours(
                period).toString('s');
        }
    } else if ('until' in req.body) {
        // No since Date, but an untilDate ?
        date.$lte = Date.parse(req.body.until).toString('s');

        // Calculate period
        let period = defaultPeriod;

        if ('period' in req.body) {
            period = parseInt(req.body.period);
        }

        date.$gte = Date.parse(req.body.until).addHours(-
            period).toString('s');
    }

    return date;
}

function parseEntriesByDate(entries) {
    let res = [];
    let dateFound = false;

    for (let entry of entries) {
        dateFound = false;
        for (let el of res) {
            if (entry.date.compareTo(el.date) < 0) {
                el.parts.push({
                    partNumber: entry.partNumber,
                    trafficState: entry.trafficState
                });

                dateFound = true;
            }
        }

        if (!dateFound) {
            res.push({
                date: entry.date.add(1).minute(),
                parts: [{
                    partNumber: entry.partNumber,
                    trafficState: entry.trafficState
                }]
            });
        }
    }

    for (let el of res) {
      el.date.add(-1).minute();
    }

    return res;
}

// Search entries with parameters
// Available parameters :
//  - part : the part to select
//  - state : the state of traffic
//    (0 - GREEN | 1 - ORANGE | 2 - RED | 3 - BLACK)
//  - since : since a date
//  - until : until a date
//  - period : time of period to get (in hours)
//
// Default : period is 6 hours
app.post('/request', (req, res) => {
  console.log(req.body);
    let searchRequest = {};

    // Part number parsing
    if ('part' in req.body) {
        searchRequest.partNumber = parseInt(req.body.part);
    }

    // Period parsing
    searchRequest.date = parseDateForRequest(req);

    // Traffic state parsing
    if ('state' in req.body) {
        searchRequest.trafficState = parseInt(req.body.state);
    }

    PartEntry.find(searchRequest).select(
            'date trafficState partNumber')
        .then((entries) => {
            res.status(CODE_SUCCESS).send(
                parseEntriesByDate(entries));
        }, (err) => {
            res.status(CODE_ERROR).send(err);
        });
});

// Get all entries
app.get('/all', (req, res) => {
    PartEntry.find().select(
        'date trafficState partNumber').then((
        entries) => {
        res.status(CODE_SUCCESS).send(
            parseEntriesByDate(entries));
    }, (err) => {
        res.status(CODE_ERROR).send(err);
    });
});

// Get entries since a specific date
app.get('/since/:date', (req, res) => {
    let d = new Date(req.params.date);

    if (!isValidDate(d)) {
        res.status(CODE_INVALID).send('Invalid Date');
    } else {
        PartEntry.find({
                date: {
                    $gte: d
                }
            }).select('date trafficState partNumber')
            .then((entries) => {
                res.status(CODE_SUCCESS).send(
                    parseEntriesByDate(entries));
            }, (err) => {
                res.status(CODE_ERROR).send(err);
            });
    }
});

// Get entries for part p
app.get('/part/:part', (req, res) => {
    PartEntry.find({
            partNumber: req.params.part
        }).select('date trafficState partNumber')
        .then((entries) => {
            res.status(CODE_SUCCESS).send(
                parseEntriesByDate(entries));
        }, (err) => {
            res.status(CODE_ERROR).send(err);
        });
});

app.listen(PORT, () => {
    console.log('> Server is ready !');
});
