const addon = require('bindings')('IconImage.node');


exports.get_icon_for_path = function(path) {
  return addon.get_icon_for_path(path);
};
