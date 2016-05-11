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

function getDate(d) {
    if (isDate(d)) {
        return d;
    } else {
        return new Date(d);
    }
}

function dateDifference(d1, d2) {
    return d1.getTime() - d2.getTime();
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

    static addArray(array, dateAccessor, req) {
        let date = undefined;
        let lastDate = undefined;
        let newDate = undefined;
        let currentMap = undefined;
        let i = 0;

        if (!array || array.length === 0) {
            return;
        }

        for (let e of array) {
            date = getDate(e[dateAccessor]);

            if (date) {
                // Check if there's missing records
                // TO UPGRADE : Add use of request to found
                //  beginning and ending missing elements
                //  and add exception to current hour, to avoid
                //  to setup future datas as not_found
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

                // Algorithm to add point per point
                // // Add each point to the storage
                // i = 0;
                //
                // for (; i < e.p.length; i++) {
                //     if (e.p[i] !== null) {
                //         this.add(date, e.p[i], i);
                //     } else {
                //         this.add(date, STATE_NOT_FOUND, i);
                //     }
                //     addedArray[i] = true;
                // }
                //
                // // Complete not found results with STATE_NOT_FOUND value
                // i = 0;
                //
                // for (; i <= LAST_PART; i++) {
                //     if (!addedArray[i]) {
                //         this.add(date, STATE_NOT_FOUND, i);
                //     }
                // }

                lastDate = date;
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

        let currentDate = new Date();
        let pastDate = new Date(currentDate.getTime() -
            DateTools.h2ms(DEFAULT_PERIOD - 1));

        let begin = {
            year: 2016,
            month: only.beginMonth || pastDate.getMonth(),
            day: only.beginDay || pastDate.getDate(),
            hour: only.beginHour || pastDate.getHours()
        };

        if (req && req.since) {
            let sinceDate = req.since;

            if (!isDate(sinceDate)) {
                sinceDate = new Date(sinceDate);
            }

            begin = {
                year: sinceDate.getFullYear(),
                month: sinceDate.getMonth(),
                day: sinceDate.getDate(),
                hour: sinceDate.getHours()
            };
        }

        let period = (req && req.period) || DEFAULT_PERIOD;

        let beginDate = new Date(begin.year,
            begin.month, begin.day,
            begin.hour);

        // 1+period and -1 is to get the end of the current hour
        let tmpBegin = new Date(beginDate.getTime() +
            DateTools.h2ms(1 + period) - 1);

        let end = {
            year: 2016,
            month: only.endMonth || tmpBegin.getMonth(),
            day: only.endDay || tmpBegin.getDate(),
            hour: only.endHour || tmpBegin.getHours()
        };

        if (req && req.until) {
            let untilDate = req.until;

            if (!isDate(untilDate)) {
                untilDate = new Date(untilDate);
            }

            end = {
                year: untilDate.getFullYear(),
                month: only.endMonth || untilDate.getMonth(),
                day: only.endDay || untilDate.getDate(),
                hour: only.endHour || untilDate.getHours()
            };
        }

        let res = Immutable.List();
        let missing = [];
        let time = {};

        let endDate = new Date(end.year, end.month, end.day,
            end.hour);

        while (beginDate.getTime() < endDate) {
            time = {
                year: beginDate.getFullYear(),
                month: beginDate.getMonth(),
                day: beginDate.getDate(),
                hour: beginDate.getHours()
            };

            res = this.requestEntry(time, res,
                missing, only);

            beginDate.setTime(beginDate.getTime() +
                DateTools.h2ms(1));
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

            if (isNotFuture && !tmp.$gte) {
                tmp = Object.assign({}, reqItem, {
                    $gte: m
                });
            } else if (isNotFuture && m.getTime() !==
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
