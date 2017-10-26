const $ = require('NodObjC');
$.import('Foundation');
$.import('AppKit');
const pool = $.NSAutoreleasePool('alloc')('init')

const EventLoop = require('./EventLoop');

var QueryDelegate = $.NSObject.extend('MyOwnQueryDelegate')
QueryDelegate.addMethod('queryUpdated:', 'v@:@', function (self, _cmd, notif) {
  console.log('Query Update', notif)
  // console.log(notif('object')('results'))
  // console.log(notif('userInfo'))
})
QueryDelegate.register()
var delegate = QueryDelegate('alloc')('init')

const query = $.NSMetadataQuery('alloc')('init')

const ns_center = $.NSNotificationCenter('defaultCenter');
ns_center(
  'addObserver', delegate,
  'selector', 'queryUpdated:',
  'name', $('NSMetadataQueryDidStartGatheringNotification'),
  'object', query,
)
ns_center(
  'addObserver', delegate,
  'selector', 'queryUpdated:',
  'name', $('NSMetadataQueryDidUpdateNotification'),
  'object', query,
)
ns_center(
  'addObserver', delegate,
  'selector', 'queryUpdated:',
  'name', $('NSMetadataQueryDidFinishGatheringNotification'),
  'object', query,
)

query('setDelegate', delegate)
query('setPredicate', $.NSPredicate('predicateWithFormat', $("kMDItemIsScreenCapture = 1")));
query('enableUpdates');
query('startQuery');

// setTimeout(() => {
//   $.CFRunLoopStop($.NSRunLoop('mainRunLoop'));
// }, 2000)

// console.log($.NSRunLoop('mainRunLoop').methods())
// $.NSRunLoop('mainRunLoop')('run')
const evtLoop = new EventLoop()
evtLoop.start();
console.log('HEY!!!')
