// Basic init
const electron = require('electron')
const Promise = require('bluebird');
const { app, BrowserWindow, globalShortcut, ipcMain, nativeImage } = electron

const child_process = Promise.promisifyAll(require('child_process'))
const vibrancy = require('./electron-nsimage-render');
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

app.dock.hide();


app.on('ready', async () => {
  let mainWindow = new BrowserWindow({
    // alwaysOnTop: true,
    width: 620,
    height: 80,
    show: false,
    frame: false,
    // transparent: true,
    vibrancy: 'light',
    webPreferences: { experimentalFeatures: true },
  });
  mainWindow.setVisibleOnAllWorkspaces(true);

  mainWindow.loadURL(`file://${__dirname}/app/index.html`)

  mainWindow.openDevTools();

  // This parts makes <a> tags go to default browser
  const handleRedirect = (e, url) => {
    if(url != mainWindow.webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }
  mainWindow.webContents.on('will-navigate', handleRedirect);
  mainWindow.webContents.on('new-window', handleRedirect);


  ipcMain.on('resize_me', (event, bounds) => {
    mainWindow.setBounds(bounds);
  })
  ipcMain.on('visibility_me', (event, { open }) => {
    if (open === true) {
      mainWindow.show()
    } else {
      // TODO More advanced hiding ;)
      mainWindow.hide();
    }
  })

  ipcMain.on('render_images', (event, { images }) => {
    const nsimage_render = require('./electron-nsimage-render');

    console.log(`images:`, images);

    images.forEach(([key, change]) => {
      console.log(`[id, change]:`, [key, change]);
      if (change.type === 'set') {
        const value = change.value;
        const options = {
          Path: value.file,
          X: value.top,
          Y: value.left,
          Width: value.width,
          Height: value.height,
        };
        const view_id = nsimage_render.UpdateView(key, mainWindow, options);
      }
      if (change.type === 'delete') {
        const view_id = nsimage_render.RemoveView(key, mainWindow, options);
      }
    })


    // const options = {
    //   Path: props.Path,
    //   X: props.X,
    //   Y: props.Y,
    //   Width: props.Width,
    //   Height: props.Height,
    // };
    // const id = nsimage_render.AddView(mainWindow, options);
    // console.log(`id:`, id);
    // ipcMain.send('render_image')
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
  });
  mainWindow.on('focus', () => {
    mainWindow.send('focus');
  });

  // Register a 'CommandOrControl+X' shortcut listener.
  const ret = globalShortcut.register('CommandOrControl+Shift+Space', async () => {
    mainWindow.send('toggle_search_shortcut');
  });

  if (!ret) {
    console.log('registration failed')
  }
});
