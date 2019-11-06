const addon = require('bindings')('ApplescriptNative.node');


exports.exec_applescript = (script) => {
  const real_script = `
    const main = () => {
      ${script}
    }
    JSON.stringify(main() || []);
  `;
  let result = addon.execute_applescript(real_script);
  return JSON.parse(result);
};
