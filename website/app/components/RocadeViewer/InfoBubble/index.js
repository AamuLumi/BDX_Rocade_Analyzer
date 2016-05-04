// Imports
import React, {Component} from 'react';
import {Link} from 'react-router';
import Rocade from '~/conf/Rocade';
import './InfoBubble.less';

// Time constants
const MS_IN_SECONDES = 1000;
const SECONDES_IN_MINUTES = 60;
const MS_IN_MINUTES = MS_IN_SECONDES * SECONDES_IN_MINUTES;

/**
 * Calculate a difference between two dates
 * @param  {String} d1 the date to substract
 * @param  {string} d2 the date to be substracted
 * @return {Date}    the difference
 */
function dateDifference(d1, d2) {
  return new Date(d2).getTime() - new Date(d1).getTime();
}

export default class InfoBubble extends Component {
  static propTypes = {
    // Informations on selected points
    selectionInfos: React.PropTypes.object.isRequired,
    // Function to execute when component is closed
    onClose: React.PropTypes.func.isRequired,
    // Current loaded date
    currentDate: React.PropTypes.string.isRequired,
    // Position of the bubble
    position: React.PropTypes.object.isRequired
  };

  /**
   * Compute the string with since details
   * @return {String} since details
   */
  computeStringSince(){
    const {selectionInfos, currentDate} = this.props;

    // If there's a beginning
    // IMPORTANT : Comparison with undefined is needed, because beginning can
    //  be equal to 0, which is a existing value.
    if (selectionInfos.beginning !== undefined) {
      if (selectionInfos.beginning !== 0) {
        // Calculate time difference with currentDate in minutes
        let d = dateDifference(selectionInfos.beginning, currentDate) / (MS_IN_MINUTES);

        return ' depuis ' + Math.round(d) + ' minutes';
      } else {
        // Else it's the beginning
        return ' (début)';
      }
    }
  }

  /**
   * Render the component
   * @return {Object} the component
   */
  render() {
    const {selectionInfos, position, onClose} = this.props;

    // Style is the position of infoBubble
    let style = position;

    // Traffic informations are loaded from conf/Rocade
    let traffic = Rocade.trafficState[selectionInfos.trafficState+1];

    // Setup id of component, and beginning string
    traffic.id = traffic.name + ' stateText';
    traffic.beginning = this.computeStringSince();

    // Setup link to see details on component
    let link = 'part/' + selectionInfos.partNumber;

    return (
      <div style={style} id="c-infoBubble">
        Portion n°{selectionInfos.partNumber}
        <div className="description">
          Traffic :&nbsp;
          <span className={traffic.id}>
            {traffic.description}
          </span>

          {traffic.beginning}<br/>

          <Link to={link}>Voir l'historique</Link>
          <div className="close" onClick={onClose}>Fermer</div>
        </div>
      </div>
    );
  }
}
