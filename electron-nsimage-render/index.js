var Vibrancy = require('bindings')('Vibrancy');

module.exports = {
  UpdateView: function(key, window, options) {
    // const nsimage = options.nsimage;
    // console.log(`nsimage #2:`, nsimage);
		// console.log(`nsimage.getNativeHandle():`, nsimage.getNativeHandle())
    const handle = window.getNativeWindowHandle();
    var viewOptions = {
      Position: { x: options.X, y: options.Y },
      Size: { width: options.Width, height: options.Height },
      Path: options.Path,
    };
    console.log(`handle, options:`, handle, options)
    return Vibrancy.UpdateView(key, handle, viewOptions);
  },
  RemoveView: function(key, window) {
    return Vibrancy.RemoveView(key, window.getNativeWindowHandle());
  },
};
