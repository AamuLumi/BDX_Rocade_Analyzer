import React, {Component} from 'react';
import './PeriodPicker.less';

export default class PeriodPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sinceEnabled: false,
      untilEnabled: false,
      periodEnabled: false,
      period : 6
    };
  }

  switchState(key) {
    let enabledStates = ['sinceEnabled', 'untilEnabled', 'periodEnabled'];

    let oneEnabled = false;

    for (let s of enabledStates){
      if (s !== key && this.state[s]){
        if (oneEnabled){
          // Case where two others checkboxes are checked
          return;
        } else {
          oneEnabled = true;
        }
      }
    }

    let nextState = {};
    nextState[key] = !this.state[key];

    this.setState(nextState);
  }

  getRequest(){
    let req = {};

    if (this.state.sinceEnabled && this.refs.since.value){
      req.since = this.refs.since.value;
    }

    if (this.state.untilEnabled && this.refs.until.value){
      req.until = this.refs.until.value;
    }

    if (this.state.periodEnabled && this.refs.period.value){
      req.period = this.refs.period.value;
    }

    return req;
  }

  render() {
    return (
      <div id="c-periodPicker">
        <div className="subtitle">
          Date
        </div>
        <div className="optionsContainer">
          <div className="option">
            <div className="optionLabel">
              <input
                type="checkbox"
                name="since"
                checked={this.state.sinceEnabled}
                onChange={() => this.switchState('sinceEnabled')}/>
              Depuis ...
            </div>

            <input
              type="datetime-local"
              ref="since"
              min="2016-04-19T12:00"
              defaultValue = "2016-04-19T12:00"
              disabled={!this.state.sinceEnabled}/>

          </div>
          <div className="option">
            <div className="optionLabel">
              <input
                type="checkbox"
                name="until"
                checked={this.state.untilEnabled}
                onChange={() => this.switchState('untilEnabled')}/>
              Jusqu'à ...
            </div>
            <input
              type="datetime-local"
              ref="until"
              min="2016-04-19T12:00"
              defaultValue="2016-04-19T12:00"
              disabled={!this.state.untilEnabled}/>
          </div>
          <div className="option">
            <div className="optionLabel">
              <input
                type="checkbox"
                name="period"
                checked={this.state.periodEnabled}
                onChange={() => this.switchState('periodEnabled')}/>
              Sur une période de ...
            </div>

            <input
              type="number"
              ref="period"
              defaultValue={this.state.period}
              disabled={!this.state.periodEnabled}/>
            h
          </div>
        </div>
      </div>
    );
  }
}
