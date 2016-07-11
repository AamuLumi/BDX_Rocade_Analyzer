
const MS_IN_SECONDE = 1000;
const SECONDES_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const MS_IN_MINUTE = MS_IN_SECONDE * SECONDES_IN_MINUTE;
const MS_IN_HOUR = MS_IN_MINUTE * MINUTES_IN_HOUR;
const MS_IN_DAY = MS_IN_HOUR * HOURS_IN_DAY;
const MS_IN_WEEK = MS_IN_DAY * DAYS_IN_WEEK;
const HOURS_IN_WEEK = HOURS_IN_DAY * DAYS_IN_WEEK;

export default class DateTools {
  /**
   * Minutes to milliseconds
   * @param  {Integer} m number of minutes
   * @return {Integer}   corresponding milliseconds
   */
  static m2ms(m){
    return m * MS_IN_MINUTE;
  }

  /**
   * Hours to milliseconds
   * @param  {Integer} h number of hours
   * @return {Integer}   corresponding milliseconds
   */
   static h2ms(h){
    return h * MS_IN_HOUR;
  }

  /**
   * Days to milliseconds
   * @param  {Integer} d number of days
   * @return {Integer}   corresponding milliseconds
   */
  static d2ms(d){
    return d * MS_IN_DAY;
  }

  /**
   * Weeks to milliseconds
   * @param  {Integer} w number of weeks
   * @return {Integer}   corresponding milliseconds
   */
  static w2ms(w){
    return w * MS_IN_WEEK;
  }

  /**
   * Weeks to hours
   * @param  {Integer} w number of weeks
   * @return {Integer}   corresponding hours
   */
  static w2h(w){
    return w * HOURS_IN_WEEK;
  }
}
