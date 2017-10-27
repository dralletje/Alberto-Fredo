// @flow

import osascript from 'osascript';

export const exec_applescript = (script: string): Promise<mixed> => {
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
