'use strict';

require('console-stamp')(console, '[HH:MM:ss.l]');
require('datejs');

let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    compression = require('compression');

let mongoose = require('mongoose'),
    PartEntry = require('./PartEntry');

let conf = require('./conf');

// Default period of entries selection (in hours)
let defaultPeriod = 6;

const PORT = 9900;

const CODE_SUCCESS = 200;
// const CODE_INVALID = 400;
const CODE_ERROR = 500;

// Constants to select search parameters
const GROUP_BY_DATE = 0;
const GROUP_BY_PART = 1;

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

// GZIP compression of body
app.use(compression());

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin',
        conf.url);
    res.header('Access-Control-Allow-Methods',
        'GET, POST');
    res.header('Access-Control-Allow-Headers',
        'Content-Type');
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
        date.$gte = Date.parse(req.body.since);

        // If untilDate, add it
        if ('until' in req.body) {
            date.$lte = Date.parse(req.body.until);
        } else { // Else we must calculate the untilDate
            let period = defaultPeriod;

            // If period precised, use it
            if ('period' in req.body) {
                period = parseInt(req.body.period);
            }

            // Calculate untilDate
            date.$lte = Date.parse(req.body.since).addHours(
                period);
        }
    } else if ('until' in req.body) {
        // No since Date, but an untilDate ?
        date.$lte = Date.parse(req.body.until);

        // Calculate period
        let period = defaultPeriod;

        if ('period' in req.body) {
            period = parseInt(req.body.period);
        }

        date.$gte = Date.parse(req.body.until).addHours(-
            period);
    } else if ('period' in req.body) {
        date.$gte = new Date().addHours(-req.body.period);
    }

    return date;
}

function searchAndParse(res, searchRequest, GROUP_BY) {
    let pipeline = [];

    if (searchRequest) {
        pipeline.push({
            $match: searchRequest
        });
    }

    if (GROUP_BY === GROUP_BY_DATE) {
        pipeline.push({
            $group: { // Group them by date
                _id: '$date',
                p: {
                    $push: {
                        n: '$partNumber',
                        s: '$trafficState'
                    }
                }
            }
        });
    } else if (GROUP_BY === GROUP_BY_PART) {
        pipeline.push({
            $group: { // Group them by date
                _id: '$date',
                p: {
                    $push: {
                        n: '$partNumber',
                        s: '$trafficState'
                    }
                }
            }
        });
    }

    pipeline.push({
        $sort: { // Sort them by date
            _id: 1
        }
    });

    console.log('Aggregate', new Date());

    PartEntry.aggregate(pipeline, (err, entries) => {
      console.log('After ag', new Date());
        // Reduce parts entries to an array
        for (let e of entries){
          let newParts = [];

          for (let p of e.p){
            newParts[p.n] = p.s;
          }

          e.p = newParts;
        }

        console.log('before send', new Date());

        if (err) {
            res.status(CODE_ERROR).send(err);
        } else {
            res.status(CODE_SUCCESS).send(
                entries);
        }
    });
}

function computeRequest(req) {
    let searchRequest = {};

    // Part number parsing
    if ('partNumber' in req.body) {
        searchRequest.partNumber = parseInt(req.body.partNumber);
    }

    if (req.body.timeslots) {
        searchRequest.$or = [];
        for (let t of req.body.timeslots) {
            searchRequest.$or.push({
                date: {
                    $gte: new Date(t.$gte),
                    $lte: new Date(t.$lte)
                }
            });
        }
    } else {
        searchRequest.date = parseDateForRequest(req);
    }

    // Traffic state parsing
    if ('state' in req.body) {
        searchRequest.trafficState = parseInt(req.body.state);
    }

    return searchRequest;
}

// Search entries with parameters and group the result with date
// Available parameters :
//  - partNumber : the part to select
//  - state : the state of traffic
//    (0 - GREEN | 1 - ORANGE | 2 - RED | 3 - BLACK)
//  - since : since a date
//  - until : until a date
//  - period : time of period to get (in hours)
//
// Default : period is 6 hours
app.post('/searchByDate', (req, res) => {
    searchAndParse(res, computeRequest(req),
        GROUP_BY_DATE);
});

// Search entries with parameters and group the result with partNumber
// Available parameters :
//  - partNumber : the part to select
//  - state : the state of traffic
//    (0 - GREEN | 1 - ORANGE | 2 - RED | 3 - BLACK)
//  - since : since a date
//  - until : until a date
//  - period : time of period to get (in hours)
//
// Default : period is 6 hours
app.post('/searchByPart', (req, res) => {
    console.log(req.body);
    searchAndParse(res, computeRequest(req),
        GROUP_BY_PART);
});

app.listen(PORT, () => {
    console.log('> Server is ready !');
});
