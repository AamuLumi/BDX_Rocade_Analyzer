// Imports
import React, {Component} from 'react';
import Options from '~/conf/PeriodPickerOptions';
import './PeriodPicker.less';

export default class PeriodPicker extends Component {
  /**
   * Constructor of PeriodPicker
   * @param  {Array} props initial props of the component
   */
  constructor(props) {
    super(props);

    // Create default state
    let initialState = {
      configuration: 'HistoryTraffic',
      inputStates: []
    };

    // Search additional states in options
    for (let optionGroup of Object.keys(Options)) {
      for (let option of Options[optionGroup].options) {
        // For each option state, add it to initialState  and
        // inputStates
        initialState[option.state] = false;
        initialState.inputStates.push(option.state);
      }
    }

    // Set initial state
    this.state = initialState;
  }

  /**
   * Enable or disable a option by changing his state
   * @param  {String} key the state to change
   */
  switchState(key) {
    // Get states
    const {inputStates, configuration} = this.state.inputStates;

    // Variable whick contains maximum options enabled
    // simultaneously
    const maxEnabled = Options[configuration].maxEnabled;

    // Variable which contain number of options enabled
    let nbEnabled = 0;

    // Search if maximum enabled state isn't reached
    for (let s of inputStates) {
      // If s isn't state to switch && state exist
      if (s !== key && this.state[s]) {
        if (nbEnabled >= maxEnabled) {
          // If max reached, don't enable or disable the currentState
          return;
        } else {
          nbEnabled++;
        }
      }
    }

    // Setup new state
    let nextState = {};
    nextState[key] = !this.state[key];

    this.setState(nextState);
  }

  /**
   * Get the request associated to options and options' values
   * @return {Object} computed request
   */
  getRequest() {
    // Load options
    let options = Options[this.state.configuration].options;

    // Variable which contains the result
    let req = {};

    // Variables to add more lisibility
    const {state, refs} = this;

    // For each option, compute a field in request if  state is
    // enabled and there's value
    for (let o of options) {
      if (state[o.state] && refs[o.name].value) {
        req[o.name] = refs[o.name].value;
      }
    }

    return req;
  }

  /**
   * Render the component
   * @return {Object} the component
   */
  render() {
    let picker = Options[this.state.configuration];

    if (!picker) {
      return (
        <div>Picker not found</div>
      );
    }

    return (
      <div id="c-periodPicker">
        <div className="subtitle">
          {picker.name}
        </div>
        <div className="optionsContainer">
          {picker.options.map((opt, i) => {
            return (
              <div className="option" key={i}>
                <div className="optionLabel">
                  <input
                    type="checkbox"
                    name={opt.name}
                    checked={this.state[opt.state]}
                    onChange={() => this.switchState(opt.state)}/> {opt.textAfterCheckbox}
                </div>
                <div className="inputContainer">
                  <input
                    type={opt.inputType}
                    ref={opt.name}
                    min={opt.min}
                    defaultValue={opt.defaultValue}
                    disabled={!this.state[opt.state]}/> {opt.textAfterInput}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
