var Vibrancy = require('bindings')('Vibrancy');

module.exports = require('bindings')('Vibrancy');

function AddView(buffer, options) {
  var viewOptions = {
    Position: { x: options.X, y: options.Y },
    Size: { width: options.Width, height: options.Height },
    Path: options.Path,
  };
  console.log(`buffer, options:`, buffer, options)
  return Vibrancy.AddView(buffer, viewOptions);
}

function RemoveView(buffer, viewId) {
  var viewOptions = { ViewId: viewId };
  return Vibrancy.RemoveView(buffer, viewOptions);
}

function UpdateView(buffer, options) {
  var viewOptions = {
    Position: { x: options.X, y: options.Y },
    Size: { width: options.Width, height: options.Height },
    ViewId: options.ViewId,
  };
  return Vibrancy.UpdateView(buffer, viewOptions);
}

module.exports = {
  AddView: function(window, options) {
    // const nsimage = options.nsimage;
    // console.log(`nsimage #2:`, nsimage);
		// console.log(`nsimage.getNativeHandle():`, nsimage.getNativeHandle())
    const handle = window.getNativeWindowHandle();
    return AddView(handle, options);
  },
  UpdateView: function(window, options) {
    return UpdateView(window.getNativeWindowHandle(), options);
  },
  RemoveView: function(window, viewId) {
    return RemoveView(window.getNativeWindowHandle(), viewId);
  },
};
