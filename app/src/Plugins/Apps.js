const Promise = require('bluebird');
const child_process = Promise.promisifyAll(require('child_process'));
const readplist = Promise.promisify(require('readplist'));
const os = require('os');

const info_from_bundle = async (bundle_path) => {
  const plist = await readplist(`${bundle_path}/Contents/Info.plist`);

  return {
    uid: bundle_path,
    title: plist.CrAppModeShortcutName || plist.CFBundleDisplayName || plist.CFBundleName || '',
    subtitle: bundle_path,
    extra_data: { plist },
    action: { type: 'open', path: bundle_path },
    icon: {
      type: 'file',
      path: bundle_path,
    },
  };
}

const get_lines = async (command) => {
  const result = await child_process.execAsync(command);
  return result.trim().split('\n');
}

const generate_app_entries = async () => {
  const mdfind_apps_command = `mdfind 'kMDItemContentTypeTree == "com.apple.application"c' -onlyin "${os.homedir()}" -onlyin /Applications`;
  const apps = await get_lines(mdfind_apps_command);

  return await Promise.all(apps.map(async app_path => {
    try {
      let bundle = await info_from_bundle(app_path);
      if (bundle.subtitle.includes('node_modules')) {
        return null;
      }
      return bundle;
    } catch (e) {
      return null;
    }
  }))
  .filter(Boolean);
}

const generate_preference_entries = async () => {
  const mdfind_apps_command = `mdfind 'kMDItemContentTypeTree == "com.apple.systempreference.prefpane"c'`;
  const apps = await get_lines(mdfind_apps_command);

  return await Promise.all(apps.map(async app_path => {
    try {
      return await info_from_bundle(app_path);
    } catch (e) {
      return null;
    }
  }))
  .filter(Boolean);
}

export default {
  retrieve_items: {
    on_start: async () => {
      const entries$ = generate_app_entries();
      const pref_entries$ = generate_preference_entries();

      return Promise.all([entries$, pref_entries$])
      .then(([apps, prefs]) => {
        return [...apps, ...prefs];
      });
    },

    on_open: async () => {

    },

    on_search: async ({ query }) => {

    },
  }
}
