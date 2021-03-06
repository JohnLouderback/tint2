module.exports = (function() {
  if(global.__TINT.ColorWell) {
    return global.__TINT.ColorWell;
  }
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.objc;

  /**
   * @class ColorWell
   * @description Creates a simple color selector "well" or "view" to show the
   *              current color. This control is useful when an application needs
   *              to represent a current selected color.
   * @extends Container
   */
   /**
    * @new
    * @memberof ColorWell
    * @description Creates a new ColorWell control.
    */
  function ColorWell(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSColorWell;
    this.nativeViewClass = this.nativeViewClass || $.NSColorWell;
    Container.call(this, options);
  }

  ColorWell.prototype = Object.create(Container.prototype);
  ColorWell.prototype.constructor = ColorWell;

  /**
   * @member color
   * @type {Color}
   * @memberof ColorWell
   * @description Gets or sets the color represented by the ColorWell.
   * @see Color
   */
  Object.defineProperty(ColorWell.prototype, 'color', {
    get:function() { return new Color(this.nativeView('color')); },
    set:function(e) { this.nativeView('setColor',(new Color(e)).native); }
  });

  global.__TINT.ColorWell = ColorWell;
  return ColorWell;
})();