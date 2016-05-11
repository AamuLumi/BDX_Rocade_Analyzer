/**
 * Element structure :
 *  {
 *  	d : Date,
 *  	s : Integer -> trafficState
 *  }
 */

import Immutable from 'immutable';
import DateTools from './DateTools';

// Time constants
const REFRESH_TIME = DateTools.m2ms(5);
const MAX_TIME_BETWEEN_ENTRY = 2 * REFRESH_TIME;

const LAST_PART = 137;
const LAST_MONTH = 11;
const LAST_DAY = 6;
const LAST_HOUR = 23;
const DEFAULT_PERIOD = 6;

const STATE_NOT_FOUND = -1;
const STATE_NOT_LOADED = -2;

let EMPTY_MAP = undefined;

function newPartsMap(partNumber, state) {
    return Immutable.Map().set(partNumber,
        state);
}

function newListElement(date, parts) {
    return Immutable.Map().set(
        'd', date).set('p', parts);
}

function newEmptyPartMap() {
    if (!EMPTY_MAP) {
        let c = Immutable.Map();
        let i = 0;

        for (; i <= LAST_PART; i++) {
            c = c.set(i, STATE_NOT_FOUND);
        }

        EMPTY_MAP = c;

        return c;
    } else {
        return EMPTY_MAP;
    }

}

function isDate(d) {
    return Object.prototype.toString.call(d) === '[object Date]';
}

function getDate(d, clone) {
    if (isDate(d) && !clone) {
        return d;
    } else {
        return new Date(d);
    }
}

function dateDifference(d1, d2) {
    return d1.getTime() - d2.getTime();
}

function removeDataAfterHour(d) {
    if (!isDate(d)) {
        return;
    }

    // Remove any useless data to focus hours timeslots
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
}

export default class DateStorage {
    static storage = Immutable.Map();

    static getStorage(y, m, d, h) {
        return this.storage.getIn([y, m, d, h]);
    }

    static add(date, state, partNumber) {
        if (!isDate(date)) {
            return;
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
                let newParts = elementWithGoodTime[1].get(
                    'p').set(partNumber, state);
                // Add new part to element
                this.storage = this.storage.setIn(time,
                    currentList.set(elementWithGoodTime[
                        0], elementWithGoodTime[1].set(
                        'p', newParts)));
            } else {
                // No element exist with the good time
                // So create it, and add it to the list
                let newParts = newPartsMap(partNumber, state);
                let newElement = newListElement(date,
                    newParts);
                this.storage = this.storage.setIn(time,
                    currentList.push(newElement).sort((
                            v1, v2) =>
                        v1.get('d').getTime() - v2.get(
                            'd').getTime()));
            }
        } else {
            // No list found, so create the list, and add the element
            let newParts = newPartsMap(partNumber, state);
            let newElement = newListElement(date, newParts);
            let newList = Immutable.List().push(
                newElement);

            this.storage = this.storage.setIn(time, newList);
        }
    }

    static addParts(date, partsMap) {
        if (!isDate(date)) {
            return;
        }

        // Time is the request to find the entry in storage
        let time = [date.getFullYear(), date.getMonth(),
            date.getDate(), date.getHours()
        ];

        let currentList = this.storage.getIn(time);
        let newElement = newListElement(date, partsMap);

        if (currentList) {
            this.storage = this.storage.setIn(time,
                currentList.push(newElement));
        } else {
            let newList = Immutable.List().push(
                newElement);

            this.storage = this.storage.setIn(time, newList);
        }
    }

    static computeRequest(req) {
        let current = new Date();
        let since = new Date(current.getTime() -
            DateTools.h2ms(DEFAULT_PERIOD));
        removeDataAfterHour(since);
        // Default request
        let computedReq = {
            since: since,
            until: current,
            default: true
        };

        // If invalid arguments, send default
        if (!req || (!req.since && !req.until)) {
            return computedReq;
        }

        // If since, calculates until
        if (req.since) {
            computedReq = {
                since: getDate(req.since, true)
            };
            if (req.period) {
                computedReq.until = new Date(computedReq.since
                    .getTime() + DateTools.h2ms(req.period)
                );
            } else if (req.until) {
                computedReq.until = getDate(req.until, true);
            } else {
                computedReq.until = new Date(computedReq.since
                    .getTime() + DateTools.h2ms(
                        DEFAULT_PERIOD)
                );
            }
        } else {
            // Else, calculates since
            computedReq = {
                until: getDate(req.until, true)
            };
            if (req.period) {
                computedReq.since = new Date(computedReq.until
                    .getTime() - DateTools.h2ms(req.period)
                );
            } else {
                computedReq.since = new Date(computedReq.until
                    .getTime() - DateTools.h2ms(
                        DEFAULT_PERIOD)
                );
            }
        }

        return computedReq;
    }

    static addArray(array, dateAccessor, req) {
        let date = undefined;
        let currentDate = new Date();
        let lastDate = undefined;
        let newDate = undefined;
        let currentMap = undefined;
        let i = 0;

        let computedReq = this.computeRequest(req);

        if (!array || array.length === 0) {
            while (dateDifference(computedReq.until,
                    computedReq.since) >
                MAX_TIME_BETWEEN_ENTRY && dateDifference(
                    currentDate, computedReq.since) > 0) {
                newDate = new Date(computedReq.since.getTime() +
                    REFRESH_TIME);

                this.addParts(newDate,
                    newEmptyPartMap());

                computedReq.since = newDate;
            }
            return;
        }

        let firstDate = getDate(array[0][dateAccessor]);

        if (computedReq && computedReq.since) {
            while (dateDifference(firstDate, computedReq.since) >
                MAX_TIME_BETWEEN_ENTRY) {
                newDate = new Date(computedReq.since.getTime() +
                    REFRESH_TIME);

                this.addParts(newDate,
                    newEmptyPartMap());

                computedReq.since = newDate;
            }
        }

        for (let e of array) {
            date = getDate(e[dateAccessor]);

            if (date) {
                if (lastDate && dateDifference(date,
                        lastDate) > MAX_TIME_BETWEEN_ENTRY) {

                    // While there's missing
                    while (dateDifference(date, lastDate) >
                        MAX_TIME_BETWEEN_ENTRY) {
                        newDate = new Date(lastDate.getTime() +
                            REFRESH_TIME);

                        this.addParts(newDate,
                            newEmptyPartMap());

                        lastDate = newDate;
                    }
                }

                currentMap = Immutable.Map();
                i = 0;

                for (; i <= LAST_PART; i++) {
                    if (e.p[i] !== null) {
                        currentMap = currentMap.set(i, e.p[i]);
                    } else {
                        currentMap = currentMap.set(i,
                            STATE_NOT_FOUND);
                    }
                }


                this.addParts(date, currentMap);

                lastDate = date;
            }
        }

        if (computedReq && computedReq.until) {
            while (dateDifference(computedReq.until,
                    lastDate) > MAX_TIME_BETWEEN_ENTRY &&
                dateDifference(currentDate, lastDate) > 0) {

                newDate = new Date(lastDate.getTime() +
                    REFRESH_TIME);

                this.addParts(newDate,
                    newEmptyPartMap());

                lastDate = newDate;
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

        let computedRequest = this.computeRequest(req);
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
            missing: finalMissing
        };

    }

    static storageAccess(storage, n) {
        return storage ? storage[n] : undefined;
    }
}
