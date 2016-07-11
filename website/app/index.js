import React, {Component} from 'react';

import ControlPanel from './components/ControlPanel';
import './App.less';

export default class App extends Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  constructor(props){
    super(props);

    this.state = {
      hasBack : false,
      initialRoute : undefined
    };
  }

  componentWillReceiveProps(nextProps){
    this.props = nextProps;

    this.checkRoute();
  }

  checkRoute(){
    const {hasBack, initialRoute} = this.state;

    if (!hasBack && !initialRoute){
      this.setState({initialRoute : this.props.route});
    } else if (!hasBack && initialRoute !== this.props.route){
      this.setState({hasBack : true});
    }
  }

  render() {
    return (
      <div id="v-app">
        {React.cloneElement(this.props.children, this.state)}
        <ControlPanel/>
      </div>
    );
  }
}
