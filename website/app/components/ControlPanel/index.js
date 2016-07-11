// Imports
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadDataForViewer} from '~/app/actions/Data';
import PeriodPicker from './PeriodPicker';
import './ControlPanel.less';

class ControlPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      upFn: undefined,
      downFn: undefined,
      upPanel: undefined,
      downPanel : undefined
    };
  }

  sendRequest() {
    let {upFn, downFn} = this.state;

    if (upFn){
      upFn();
    }

    if (downFn){
      downFn();
    }
    //this.props.fetchParts(this.refs.periodPicker.getRequest());
  }

  componentWillMount(){
    this.setupPanel('up');
    this.setupPanel('down');
  }

  componentWillReceiveProps(nextProps){
    this.props = nextProps;

    this.setupPanel('up');
    this.setupPanel('down');
  }

  getComponentFor(e, ref) {
    if (e.componentName === 'PeriodPicker') {
      return <PeriodPicker {...e.params} key={e.name}/>;
    }
  }

  setupPanel(key) {
    let {configurations} = this.props;

    console.log(this.props);

    let component = <div className="panelNotFound">Cc</div>;
    let components = undefined
    if (configurations && configurations[key]) {
      components = configurations[key].components.map((e, i) => this.getComponentFor(e, key + i));
      component = <div className="configurationPanel">
        {components}
      </div>;
    }

    let keyFn = key + 'Fn';
    let keyPanel = key + 'Panel';
    let nextState = {};

    nextState[keyPanel] = component;
    nextState[keyFn] = () => {
      let nbComponents = components.length;

      console.log(components);

      let i = 0;
      let res = [];
      let refKey = undefined;

      for (; i < nbComponents; i++) {
        refKey = key + i;
        console.log(components[i]);
        res.push(components[i].type.prototype.getRequest());
      }

      configurations[key].onExecute(res);
    };

    this.setState(nextState);

    return component;
  }

  render() {
    let {upPanel, downPanel} = this.state;

    return (
      <div id="c-controlPanel">
        <div className="title">
          Configuration
        </div>

        {upPanel}
        {downPanel}
        <button onClick={() => this.sendRequest()}>Actualiser</button>
      </div>
    );
  }
}

// Connect to the store
const mapStateToProps = (state) => {
  return {configurations: state.configurationPanels};
};

// Connect to stores
const mapDispatchToProps = (dispatch) => {
  return {
    fetchParts: (request) => {
      dispatch(loadDataForViewer(request));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);
