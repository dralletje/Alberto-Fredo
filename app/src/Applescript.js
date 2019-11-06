// @flow

import osascript from 'osascript';

const native_require = global['req' + 'uire'];
const stuff = native_require('../applescript-native');

export const exec_applescript = async (script: string): Promise<mixed> => {
  return stuff.exec_applescript(script);

  return new Promise((yell, cry) => {
    const real_script = `
      const main = () => {
        ${script}
      }
      JSON.stringify(main() || []);
    `;
    osascript.eval(real_script, (err, result) => {
      if (err) {
        cry(err);
      } else {
        yell(JSON.parse(result));
      }
    });
  });
};
