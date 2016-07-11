export default {
    HistoryTraffic: {
        name: 'Date',
        maxEnabled: 2,
        options: [{
            name: 'since',
            state: 'sinceEnabled',
            inputType: 'datetime-local',
            min: '2016-04-19T12:00',
            defaultValue: '2016-04-19T12:00',
            textAfterCheckbox: 'Depuis ...'
        }, {
            name: 'until',
            state: 'untilEnabled',
            inputType: 'datetime-local',
            min: '2016-04-19T12:00',
            defaultValue: '2016-04-19T12:00',
            textAfterCheckbox: 'Jusqu\'à ...'
        }, {
            name: 'period',
            state: 'periodEnabled',
            inputType: 'number',
            min: '0',
            defaultValue: '6',
            textAfterCheckbox: 'Sur une période de ...',
            textAfterInput: 'h'
        }]
    }
};
