import React, {Component} from 'react';
import './ChartSelector.less';

export default class ChartSelector extends Component {
  static options = [
    {
      name: 'Journalier',
      chartName: 'HistoryTraffic'
    }, {
      name: 'Hebdomadaire',
      chartName: 'WeekTraffic'
    }
  ]

  static propTypes = {
    setUpChart: React.PropTypes.func.isRequired,
    setDownChart: React.PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      upSelector: undefined,
      downSelector: undefined,
      selectorKey: undefined
    };
  }

  getSelector(position, isUpper, text, className, chartName) {
    let style = {
      top: position.top,
      left: position.left,
      width: position.width,
      height: position.height,
      bottom: position.bottom,
      right: position.right
    };

    let clickFunction = undefined;

    if (isUpper) {
      style.top -= style.height;
      style.bottom -= style.height;
      clickFunction = this.props.setUpChart;
    } else {
      style.top += style.height;
      style.bottom += style.height;
      clickFunction = this.props.setDownChart;
    }

    let realClass = 'selector ' + className;

    return (
      <div className={realClass} style={style} onClick={() => clickFunction(chartName)}>
        <div className="description">
          {text}
        </div>
      </div>
    );
  }

  drawPositionSelectors(e, element, i) {
    if (!e.target.className || e.target.className !== 'option') {
      return;
    }

    const position = e.target.getBoundingClientRect();

    const upSelector = this.getSelector(position, true, 'Haut', 'up', element.chartName);
    const downSelector = this.getSelector(position, false, 'Bas', 'down', element.chartName);

    this.setState({upSelector: upSelector, downSelector: downSelector, selectorKey: i});
  }

  removeSelectors() {
    this.setState({upSelector: undefined, downSelector: undefined, selectorKey: undefined});
  }

  render() {
    const {upSelector, downSelector, selectorKey} = this.state;

    return (
      <div className="c-chartSelector">

        {ChartSelector.options.map((el, i) => {
          return (
            <div
              className="option"
              key={i}
              onMouseEnter={(e) => this.drawPositionSelectors(e, el, i)}
              onMouseLeave={() => this.removeSelectors()}>
              {el.name}
              {(selectorKey === i) && upSelector}
              {(selectorKey === i) && downSelector}
            </div>
          );
        })}

      </div>
    );
  }
}
