// Basic init
const electron = require('electron')
const Promise = require('bluebird');
const { app, BrowserWindow, globalShortcut, ipcMain, nativeImage } = electron

const child_process = Promise.promisifyAll(require('child_process'))
const os = require('os');
const readplist_nonpromise = require('readplist');
const readplist = Promise.promisify(readplist_nonpromise);

// const fs = Promise.promisifyAll(require('fs'));
// const $ = require('NodObjC');
// $.import('Foundation');
// $.import('AppKit');
const iconImage = require('./electron-icon-image/index.js');

const get_image_url_for_path = (path) => {
  return nativeImage.createFromBuffer(iconImage.get_icon_for_path(path));
}

// var AppDelegate = $.NSObject.extend('AppDelegate')
// AppDelegate.addMethod('queryUpdated:', 'v@:@', function (self, _cmd, notif) {
//   console.log('got applicationDidFinishLauching')
//   console.log(notif)
// })
// AppDelegate.register()
// var delegate = AppDelegate('alloc')('init')
//
// const pool = $.NSAutoreleasePool('alloc')('init')
// const query = $.NSMetadataQuery('alloc')('init')
//
// const ns_center = $.NSNotificationCenter('defaultCenter');
// ns_center(
//   'addObserver', delegate,
//   'selector', 'queryUpdated:'
//   'name', $('NSMetadataQueryDidStartGatheringNotification'),
//   'object', query,
// )
// ns_center(
//   'addObserver', delegate,
//   'selector', 'queryUpdated:'
//   'name', $('NSMetadataQueryDidUpdateNotification'),
//   'object', query,
// )
// ns_center(
//   'addObserver', delegate,
//   'selector', 'queryUpdated:'
//   'name', $('NSMetadataQueryDidFinishGatheringNotification'),
//   'object', query,
// )
//
// query('setDelegate', delegate)
// query('setPredicate', $.NSPredicate('predicateWithFormat', $("kMDItemIsScreenCapture = 1"));
// query('startQuery');
// query('setPredicate', pred);
// query('startQuery');

// Let electron reloads by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

const info_from_bundle = async (bundle_path) => {
  const plist = await readplist(`${bundle_path}/Contents/Info.plist`);

  // NOTE For nostalgic reasons
  // const icon_name = plist.CFBundleIconFile.match(/\.icns$/) ? plist.CFBundleIconFile : `${plist.CFBundleIconFile}.icns`
  // const icon_file = `${bundle_path}/Contents/resources/${icon_name}`;

  // NOTE I never actually used this part of the code, it never worked
  // const file = workspace('iconForFile', $(bundle_path))
  // const rep = file('representations')('firstObject');
  // const data = rep('representationUsingType', 4, 'properties', $.NSDictionary('alloc')('init'))

  // const temp_dir = os.tmpdir();
  // const icon_png = `${temp_dir}/${bundle_path.replace(/[ /.]/g, '_')}.png`;
  // const command = `sips -s format png "${icon_file}" --out ${icon_png}`;

  // const result = await child_process.execAsync(command).catch(err => {
  //   console.log('LOL');
  // });

  return {
    uid: bundle_path,
    title: plist.CrAppModeShortcutName || plist.CFBundleDisplayName || plist.CFBundleName || '',
    subtitle: bundle_path,
    plist: plist,
    open_path: bundle_path,
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
    return await info_from_bundle(app_path);
  }));
}

const generate_preference_entries = async () => {
  const mdfind_apps_command = `mdfind 'kMDItemContentTypeTree == "com.apple.systempreference.prefpane"c'`;
  const apps = await get_lines(mdfind_apps_command);

  return await Promise.all(apps.map(async app_path => {
    return await info_from_bundle(app_path);
  }));
}

app.dock.hide();

app.on('ready', async () => {
  let mainWindow = new BrowserWindow({
    // alwaysOnTop: true,
    width: 620,
    height: 80,
    show: false,
    frame: false,
    vibrancy: 'light',
  });
  mainWindow.setVisibleOnAllWorkspaces(true);

  mainWindow.loadURL(`file://${__dirname}/app/index.html`)

  mainWindow.openDevTools();

  const entries$ = generate_app_entries();
  const pref_entries$ = generate_preference_entries();

  mainWindow.webContents.on('did-finish-load', () => {
    Promise.all([entries$, pref_entries$])
    .then(([apps, prefs]) => {
      mainWindow.send('entries', [...apps, ...prefs]);
    });
  });


  ipcMain.on('resize_me', (event, bounds) => {
    mainWindow.setBounds(bounds);
  })

  ipcMain.on('ondragstart', (event, filePath) => {
    const icon_path =
      filePath.match(/(\.png|\.jpg)$/)
      ? filePath
      : get_image_url_for_path(filePath);

    event.sender.startDrag({
      files: [filePath],
      icon: icon_path,
    });
  })

  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsFocused()) {
      mainWindow.send('blur');
    }
  })
  mainWindow.on('focus', () => {
    mainWindow.send('focus');
  })

  // Register a 'CommandOrControl+X' shortcut listener.
  const ret = globalShortcut.register('CommandOrControl+Space', async () => {
    mainWindow.send('toggle_search_shortcut');
  });

  if (!ret) {
    console.log('registration failed')
  }
});
