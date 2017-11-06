var Vibrancy = require('bindings')('Vibrancy');

module.exports = {
  UpdateView: function(key, window, options) {
    const handle = window.getNativeWindowHandle();
    var viewOptions = {
      Position: { x: options.X, y: options.Y },
      Size: { width: options.Width, height: options.Height },
      Path: options.Path,
    };
    console.log(`options:`, options);
    return Vibrancy.UpdateView(key, handle, viewOptions);
  },
  RemoveView: function(key, window) {
    const handle = window.getNativeWindowHandle();
    console.log('KEY:', handle)
    return Vibrancy.RemoveView(key, handle);
  },
};
