import React, {Component} from 'react';
import './DateSlider.less';

export default class DateSlider extends Component {
  static propTypes = {
    onChange: React.PropTypes.func.isRequired,
    max: React.PropTypes.number.isRequired,
    initial: React.PropTypes.number,
    date: React.PropTypes.string
  };

  translateDate(date) {
    if (!date) {
      return 'Pas d\'entrées trouvées';
    }
    
    let oDate = new Date(date);

    return oDate.toLocaleString();
  }

  setValue(i){
    this.refs.slider.value = i;
  }

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
          onInput={() => {
          onChange(document.getElementById('slider').value);
        }}/>
      </div>
    );
  }
}