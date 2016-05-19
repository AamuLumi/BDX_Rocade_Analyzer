/**
 * DateStorage structure : Immutable.Map {
 *  y : Immutable.Map {
 *  	m : Immutable.Map {
 *  		d : Immutable.Map {
 *  			h : Immutable.List [{
 *     			d : Date,
 *     			p : Immutable.Map => state (Integer)
 *  		  	}]
 *  	  	}
 *    	}
 *    }
 *  }
 */

import Immutable from 'immutable';
import DateTools from './DateTools';

// Time constants
const REFRESH_TIME = DateTools.m2ms(5);
const MAX_TIME_BETWEEN_ENTRY = 2 * REFRESH_TIME;

const LAST_PART = 137;
const DEFAULT_PERIOD = 6;

const STATE_NOT_FOUND = -1;

let EMPTY_MAP = undefined;

/**
 * Create a new parts map
 * @param  {Integer} partNumber a partNumber to add to the map
 * @param  {Integer} state      corresponding state of partNumber
 * @return {Immutable.Map}            the new map
 */
function newPartsMap(partNumber, state) {
    return Immutable.Map().set(partNumber, state);
}

/**
 * Create a new timeslot list element
 * @param  {Date} date  the date to add
 * @param  {Immutable.Map} parts a parts map (see :newPartsMap)
 * @return {Immutable.Map}       the new list element
 */
function newListElement(date, parts) {
    return Immutable.Map().set('d', date).set('p', parts);
}

/**
 * Generate the default EMPTY_MAP, or return it if already generated
 * @return {Immutable.Map} an map with all parts set to STATE_NOT_FOUND(-1)
 */
function newEmptyPartMap() {
    // If not created, create it
    if (!EMPTY_MAP) {
        let c = Immutable.Map();
        let i = 0;

        for (; i <= LAST_PART; i++) {
            c = c.set(i, STATE_NOT_FOUND);
        }

        EMPTY_MAP = c;
    }

    return EMPTY_MAP;
}

/**
 * Check if a object is a date
 * @param  {Object}  d the object to test
 * @return {Boolean}   true if object is a date
 */
function isDate(d) {
    return Object.prototype.toString.call(d) === '[object Date]';
}

/**
 * Get a Date object of another object
 * @param  {Object} d     the element to transforms to date
 * @param  {Boolean} mustBeCloned true if we must create a new date
 * @return {Date}       the date result
 */
function getDate(d, mustBeCloned) {
    return isDate(d) && !mustBeCloned ? d : new Date(d);
}

/**
 * Get the difference (in ms) between two dates
 * @param  {Date} d1 the first date
 * @param  {Date} d2 the second date
 * @return {Integer}    d1-d2
 */
function dateDifference(d1, d2) {
    return d1.getTime() - d2.getTime();
}

/**
 * Remove all datas after hour in Date (minutes, seconds, ms)
 * @param  {Date} d the date to edit
 * @return {Boolean}   false if is not a Date
 */
function removeDataAfterHour(d) {
    if (!isDate(d)) {
        return false;
    }

    // Remove any useless data to focus hours timeslots
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
}

export default class DateStorage {
    // Variable which represents the storage
    static storage = Immutable.Map();

    /**
     * INTERNAL FUNCTION
     * Get the storage for a timeslot
     * @param  {Integer} y the year
     * @param  {Integer} m the month
     * @param  {Integer} d the day
     * @param  {Integer} h the hour
     * @return {Immutable.List}   the list corresponding to this timeslot
     */
    static getStorage(y, m, d, h) {
        return this.storage.getIn([y, m, d, h]);
    }

    /**
     * INTERNAL FUNCTION
     * Add a new data (partNumber, state) to a specific date
     * It creates all intermediate data structures which not exist
     * @param {Date} date       the date which must be add the data
     * @param {Integer} state      the state of the part
     * @param {Integer} partNumber the partNumber to add
     * @return {Boolean}    false if date is not a valid date
     */
    static add(date, state, partNumber) {
        if (!isDate(date)) {
            return false;
        }

        // Time is the request to find the entry in storage
        let time = [date.getFullYear(), date.getMonth(),
            date.getDate(), date.getHours()
        ];

        let currentList = this.storage.getIn(time);

        // If list exist
        if (currentList && Immutable.List.isList(currentList)) {
            // Search element with the good time
            let elementWithGoodTime = currentList.findEntry(
                (v) => v.get('d').getTime() === date.getTime()
            );

            // If found
            if (elementWithGoodTime) {
                let newParts = elementWithGoodTime[1].get('p')
                    .set(partNumber, state);
                // Add new part to element
                this.storage = this.storage.setIn(time,
                    currentList.set(elementWithGoodTime[0],
                        elementWithGoodTime[1].set('p', newParts)));
            } else {
                // No element exist with the good time
                // So create it, and add it to the list
                let newParts = newPartsMap(partNumber, state);
                let newElement = newListElement(date, newParts);
                this.storage = this.storage.setIn(time,
                    currentList.push(newElement).sort((v1, v2) =>
                        v1.get('d').getTime() - v2.get('d').getTime()));
            }
        } else {
            // No list found, so create the list, and add the element
            let newParts = newPartsMap(partNumber, state);
            let newElement = newListElement(date, newParts);
            let newList = Immutable.List().push(newElement);

            this.storage = this.storage.setIn(time, newList);
        }
    }

    /**
     * INTERNAL FUNCTION
     * Add a parts map to a specific Date
     * It creates all intermediates data structures if not exist.
     * This function doesn't sort entries in a timeslot,
     * 	so entries must be added in sorted order (old -> recent).
     * @param {Date} date     the date of datas
     * @param {Immutable.Map} partsMap the map of parts
     * @return {Boolean} false if the date isn't a Date
     */
    static addParts(date, partsMap) {
        if (!isDate(date)) {
            return false;
        }

        // Time is the request to find the entry in storage
        let time = [date.getFullYear(), date.getMonth(),
            date.getDate(), date.getHours()
        ];

        let currentList = this.storage.getIn(time);

        // Create a new element to contains the parts map
        let newElement = newListElement(date, partsMap);

        // If there's already elements in the timeslot
        if (currentList) {
            // Add the new element to timeslot
            this.storage = this.storage.setIn(time,
                currentList.push(newElement));
        } else {
            // Add a new list and a new element
            this.storage = this.storage.setIn(time, Immutable.List().push(
                newElement));
        }
    }

    /**
     * Extract a timeslot request
     * It transforms request to a since/until object
     * @param  {Object} req          the request to transforms
     * @param  {String} sinceKeyword the since key property of request
     * @param  {String} untilKeyword the until key property of request
     * @return {Object}              parsed request
     */
    static extractTimeslot(req, sinceKeyword, untilKeyword) {
        let computedReq = {};

        // If since, calculates until
        if (req[sinceKeyword]) {
            computedReq = {
                since: getDate(req[sinceKeyword], true)
            };

            if (req.period) {
                // Calculates until from the since date and the period
                computedReq.until = new Date(computedReq.since.getTime() +
                    DateTools.h2ms(req.period));
            } else if (req[untilKeyword]) {
                // Get the until value
                computedReq.until = getDate(req[untilKeyword], true);
            } else {
                // Calculates until from the default period
                computedReq.until = new Date(computedReq.since.getTime() +
                    DateTools.h2ms(DEFAULT_PERIOD));
            }
        } else {
            // Else, calculates since
            computedReq = {
                until: getDate(req[untilKeyword], true)
            };

            if (req.period) {
                // Calculates since from until and period
                computedReq.since = new Date(computedReq.until.getTime() -
                    DateTools.h2ms(req.period));
            } else {
                // Calculates since from until and default
                computedReq.since = new Date(computedReq.until.getTime() -
                    DateTools.h2ms(DEFAULT_PERIOD));
            }
        }

        return computedReq;
    }

    /**
     * Translate an array of requests in timeslots form or since/until/period
     * 	form to an array of requests in since/until form
     * @param  {Array} req the array to translate
     * @return {Array}     translated array
     */
    static computeRequest(req) {
        let currentDate = new Date();
        let sinceDate = new Date(currentDate.getTime() - DateTools.h2ms(
            DEFAULT_PERIOD));

        // Remove all datas of since to get the full timeslot
        removeDataAfterHour(sinceDate);

        // If invalid arguments, send default
        if (!req || !(req.since || req.until || req.timeslots)) {
            return [{
                since: sinceDate,
                until: currentDate,
                default: true
            }];
        }

        let sinceKeyword = 'since';
        let untilKeyword = 'until';
        let computedReq = [];

        // Timeslots form
        if (req.timeslots) {
            sinceKeyword = '$gte';
            untilKeyword = '$lte';

            // Parse each request
            for (let r of req.timeslots) {
                computedReq.push(this.extractTimeslot(r,
                    sinceKeyword, untilKeyword));
            }

            return computedReq;
        }

        // Since/Until/Period form
        if (req.constructor === Array) {
            // Parse each request
            for (let r of req) {
                computedReq.push(this.extractTimeslot(r,
                    sinceKeyword, untilKeyword));
            }
        } else {
            // Parse the req object (lonely entry)
            computedReq.push(this.extractTimeslot(req,
                sinceKeyword, untilKeyword));
        }

        return computedReq;
    }

    /**
     * Add an array of entries
     * @param {Array} array        array of elements to add
     * @param {String} dateAccessor the date key property
     * @param {Array/Object} req          the corresponding request of datas
     */
    static addArray(array, dateAccessor, req) {
        let currentDate = new Date();
        let sinceDate = undefined;

        // Compute the request
        let computedReq = this.computeRequest(req);

        // No entries for requests found
        if (!array || array.length === 0) {
            // So for each requests
            for (let timeslotRequest of computedReq) {
                sinceDate = timeslotRequest.since;

                // Add to each corresponding date an empty map
                // (While the date is in request AND it's not bigger than
                //  current date)
                while (dateDifference(timeslotRequest.until, sinceDate) >
                    MAX_TIME_BETWEEN_ENTRY && dateDifference(
                        currentDate, sinceDate) > 0) {
                    // Calculate the new Date with the common REFRESh_TIME
                    sinceDate = new Date(sinceDate.getTime() + REFRESH_TIME);

                    // Add empty parts map
                    this.addParts(sinceDate, newEmptyPartMap());
                }
            }

            // Break. Nothing to do after that.
            return;
        }

        // Current working date
        let date = undefined;
        // Map of elements to add to the date
        let currentMap = undefined;
        // Last date added in the array
        let lastDate = undefined;
        // First date of the current request
        let firstDate = undefined;
        // Current entry
        let entry = undefined;
        // Cursor on the array of entries
        let arrayCursor = 0;
        // Cursor on the map
        let mapCursor = 0;

        // For each requests
        for (let timeslotRequest of computedReq) {
            // Get the first date of the currentRequest
            firstDate = getDate(array[arrayCursor][dateAccessor]);

            if (timeslotRequest.since) {
                sinceDate = timeslotRequest.since;
                // Add to each corresponding missing date an empty map
                // (While the date is lesser than the firstDate)
                while (dateDifference(firstDate, sinceDate) >
                    REFRESH_TIME) {
                    // Add the empty map
                    this.addParts(sinceDate, newEmptyPartMap());

                    // Compute the new date
                    sinceDate = new Date(sinceDate.getTime() + REFRESH_TIME);
                }
            }

            // FIRST STOP CONDITION : array length
            while (arrayCursor < array.length) {
                // Get the entry and the date
                entry = array[arrayCursor];
                date = getDate(entry[dateAccessor]);

                if (date && timeslotRequest.until) {
                    // SECOND STOP CONDITION : date isn't bigger than
                    //  untilDate in request or currentDate
                    if (dateDifference(timeslotRequest.until, date) < 0 ||
                        dateDifference(currentDate, date) < 0) {
                        break;
                    }

                    // If there's missing datas between this date and the
                    //  last date
                    if (lastDate && dateDifference(date, lastDate) >
                        MAX_TIME_BETWEEN_ENTRY) {
                        // Go to the next Date, because last date has already
                        //  been added
                        lastDate = new Date(lastDate.getTime() +
                            REFRESH_TIME);

                        // While there's missing dates
                        while (dateDifference(date, lastDate) >
                            REFRESH_TIME) {
                            // Add empty map to each missing date
                            this.addParts(lastDate, newEmptyPartMap());
                            lastDate = new Date(lastDate.getTime() +
                                REFRESH_TIME);
                        }
                    }

                    // Create a new map, and initializes mapCursor
                    currentMap = Immutable.Map();
                    mapCursor = 0;

                    // For each parts
                    for (; mapCursor <= LAST_PART; mapCursor++) {
                        // If part exists, add it
                        if (entry.p[mapCursor] !== null) {
                            currentMap = currentMap.set(mapCursor, entry.p[
                                mapCursor]);
                        } else {
                            // Else, add a not found value in the map
                            currentMap = currentMap.set(mapCursor,
                                STATE_NOT_FOUND);
                        }
                    }

                    // Add the map
                    this.addParts(date, currentMap);

                    // Save this date as lastDate
                    lastDate = date;
                }

                arrayCursor++;
            }

            if (timeslotRequest.until && lastDate) {
                // Go to the next Date, because last date has already been added
                lastDate = new Date(lastDate.getTime() + REFRESH_TIME);
                // If there's missing dates after
                while (dateDifference(timeslotRequest.until,
                        lastDate) > REFRESH_TIME &&
                    dateDifference(currentDate, lastDate) > 0) {
                    this.addParts(lastDate, newEmptyPartMap());

                    // Compute new date
                    lastDate = new Date(lastDate.getTime() + REFRESH_TIME);
                }
            }
        }
    }


    static requestEntry(time, res, missing, only) {
        let current = this.getStorage(time.year,
            time.month, time.day,
            time.hour);

        if (current) {
            // If one part is asked, but it not exists
            if (only.part && current.getIn([0, 'p', only.part]) ===
                undefined) {
                missing.push(new Date(time.year,
                    time.month, time.day,
                    time.hour));
            } else if (!only.part) {
                // All parts asked, so result is concatenation of res
                //  and the entries
                return res.concat(current);
            } else {
                // Only on part asked, so concatenate res with the only part
                return res.concat(current.map((e) => {
                    let onlyPart = e.get('p').filter(
                        (v, k) => k === only
                        .part
                    );

                    return e.set('p', onlyPart);
                }));
            }
        } else {
            // No list found, so it's missing
            missing.push(new Date(time.year,
                time.month, time.day,
                time.hour));
        }


        return res;
    }

    static get(req) {
        let only = (req && req.only) || {};

        let computedRequest = this.computeRequest(req)[0];
        removeDataAfterHour(computedRequest.since);

        let currentDate = new Date();

        let res = Immutable.List();
        let missing = [];
        let time = {};

        while (computedRequest.since.getTime() <=
            computedRequest.until.getTime()) {
            time = {
                year: computedRequest.since.getFullYear(),
                month: computedRequest.since.getMonth(),
                day: computedRequest.since.getDate(),
                hour: computedRequest.since.getHours()
            };

            res = this.requestEntry(time, res,
                missing, only);

            computedRequest.since.setTime(computedRequest.since
                .getTime() + DateTools.h2ms(1));
        }

        // Compute req with timeslots
        let finalMissing = [];
        let reqItem = {
            $gte: undefined,
            $lte: undefined
        };
        let tmp = {};
        let isNotFuture = undefined;
        let lastDate = undefined;

        // For each missing entry, calculate the real timeslot
        for (let m of missing) {
            isNotFuture = m.getTime() < currentDate.getTime();

            if (isNotFuture) {
                if (!tmp.$gte) {
                    tmp = Object.assign({}, reqItem, {
                        $gte: m
                    });
                } else if (m.getTime() !==
                    lastDate.getTime() + DateTools.h2ms(1)) {

                    tmp.$lte = new Date(lastDate.getTime() +
                        DateTools.h2ms(1) - 1);
                    finalMissing.push(tmp);

                    tmp = Object.assign({}, reqItem, {
                        $gte: m
                    });
                }

                lastDate = m;
            }
        }

        if (tmp.$gte) {
            tmp.$lte = new Date(lastDate.getTime() +
                DateTools.h2ms(1) - 1);
            finalMissing.push(tmp);
        }

        return {
            res: res.toJS(),
            missing: finalMissing,
            computedReq: computedRequest
        };

    }
}
