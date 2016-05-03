// Imports
import React, {Component} from 'react';
import './DateSlider.less';

export default class DateSlider extends Component {
  static propTypes = {
    // Function to call when a change is done on the slider
    onChange: React.PropTypes.func.isRequired,
    // Maximum value of the slider
    max: React.PropTypes.number.isRequired,
    // Initial value of the slider
    initial: React.PropTypes.number,
    // Current loaded date
    date: React.PropTypes.string
  };

  /**
   * Compute a human readable date from a string
   * @param  {String} date the date to compute
   * @return {String}      human readable date
   */
  translateDate(date) {
    // If invalid parameter, return an error message
    if (!date) {
      return 'Pas d\'entrées trouvées';
    }

    // Create a the date
    let oDate = new Date(date);

    // Return the local date in String format
    return oDate.toLocaleString();
  }

  /**
   * Set the current slider value
   * @param {Integer} i the new value of slider
   */
  setValue(i) {
    this.refs.slider.value = i;
  }

  /**
   * Render the component
   * @return {Object} the component
   */
  render() {
    const {onChange, max, initial, date} = this.props;

    return (
      <div id="c-dateSlider">
        <div className="date">
          Date actuelle : {this.translateDate(date)}
        </div>
        <input
          type="range"
          max={max}
          defaultValue={initial}
          id="slider"
          ref="slider"
          onInput={(e) => {
          onChange(e.target.value);
        }}/>
      </div>
    );
  }
}
