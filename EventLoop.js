const $ = require('NodObjC');
$.import('Cocoa');

let default_runLoopMode = $.NSDefaultRunLoopMode
if (default_runLoopMode == null) {
  default_runLoopMode = $('kCFRunLoopDefaultMode')
  console.warn('WARNING: Falling back to hard-coded string for NSDefaultRunLoopMode constant. See https://github.com/TooTallNate/NodObjC/pull/56 for details.')
}

// export EventLoop at module and as 'EventLoop'
class EventLoop {
  constructor(start, options) {
    this._runLoopMode = default_runLoopMode;
    if (options) {
      if (options.runLoopMode) {
        this._runLoopMode = options.runLoopMode
      }
    }

    this.runInfo = {recurring:null, schedule_id:null, loop:{}}

    if (start) {
      this.start()
    }
  }

  start() {
    // this.emit('start')
    return this.schedule(true)
  }

  stop() {
    this.runInfo.recurring = false
    // this.emit('stop')
    return this
  }

  schedule(runRecurring) {
    var runInfo = this.runInfo
    if (runRecurring !== undefined)
      runInfo.recurring = !!runRecurring

    if (runInfo.schedule_id != null)
      return this; // exit if already scheduled

    var id = setTimeout(this.eventLoop.bind(this))
    runInfo.schedule_id = (id !== undefined) ? id : true
    // this.emit('scheduled', runInfo)
    return this
  }

  clearSchedule() {
    var runInfo = this.runInfo
    var id = runInfo.schedule_id
    runInfo.recurring = false

    if (id != null) {
      runInfo.schedule_id = null
      this.clearTimeout(id)
      // this.emit('unscheduled', runInfo)
    }
    return this
  }

  isScheduled(runInfo) {
    if (!runInfo) runInfo = this.runInfo
    return runInfo.schedule_id!=null }

  isActive(runInfo) {
    if (!runInfo) runInfo = this.runInfo
    return this.isScheduled(runInfo) || runInfo.recurring }

  eventLoop(runRecurring) {
    var runInfo = this.runInfo
    runInfo.schedule_id = null
    this.eventLoopCore()
    if (runInfo.recurring || runRecurring)
      this.schedule(runRecurring)
    else if (runInfo.schedule_id==null)
      // this.emit('deactivate', this.runInfo)
    return this
  }

  eventLoopCore(block) {
    let runInfo = this.runInfo;
    let loopInfo = {running:true, count:0, t0:Date.now()};
    let app = $.NSApplication('sharedApplication');
    let untilDate = block ? $.NSDate('distantFuture') : null; // or $.NSDate('distantPast') to not block
    let inMode = this._runLoopMode

    // let runLoopPool = $.NSAutoreleasePool('alloc')('init')
    try {
      runInfo.loop = loopInfo
      // this.emit('eventLoop-enter', runInfo)
      // console.log('#1');
      let event;
      do {
        // this.emit('event-next', event, app, runInfo)
        event = app('nextEventMatchingMask',
                $.NSAnyEventMask.toString(), // …grumble… uint64 as string …grumble…
                'untilDate', untilDate,
                'inMode', inMode,
                'dequeue', 1)
        // console.log('Event:', event)
        // this.emit('event-match', event, app, runInfo)
        if (event) {
          app('sendEvent', event)
          // this.emit('event-sent', event, app, runInfo)
        }
        ++loopInfo.count
      } while (event)
      // console.log('#2');

      loopInfo.t1 = Date.now()
      loopInfo.running = false
      // this.emit('eventLoop-exit', runInfo)
    } catch (err) {
      loopInfo.t1 = Date.now()
      loopInfo.running = false
      loopInfo.error = err
      // this.emit('error', err, runInfo)
      throw err
    } finally {
      // runLoopPool('drain')
    }
    delete loopInfo.running
    // this.emit('eventLoop', runInfo)
    return this
  }
}
module.exports = EventLoop;
