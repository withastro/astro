const has = Object.prototype.hasOwnProperty

/**
 * Since CustomEvent is only supported in nodejs since version 19,
 * you have to create your own class instead of using CustomEvent
 * @see https://github.com/nodejs/node/issues/40678
 * */
export class QueueEvent extends Event {
  constructor (name, detail) {
    super(name)
    this.detail = detail
  }
}


export default class Queue extends EventTarget {
  constructor (options = {}) {
    super()
    const { concurrency = Infinity, timeout = 0, autostart = false, results = null } = options

    this.concurrency = concurrency
    this.timeout = timeout
    this.autostart = autostart
    this.results = results
    this.pending = 0
    this.session = 0
    this.running = false
    this.jobs = []
    this.timers = []

    this.addEventListener('error', this._errorHandler)
  }

  _errorHandler(evt) {
    this.end(evt.detail.error);
  }

  pop () {
    return this.jobs.pop()
  }

  shift () {
    return this.jobs.shift()
  }

  indexOf (searchElement, fromIndex) {
    return this.jobs.indexOf(searchElement, fromIndex)
  }

  lastIndexOf (searchElement, fromIndex) {
    if (fromIndex !== undefined) { return this.jobs.lastIndexOf(searchElement, fromIndex) }
    return this.jobs.lastIndexOf(searchElement)
  }

  slice (start, end) {
    this.jobs = this.jobs.slice(start, end)
    return this
  }

  reverse () {
    this.jobs.reverse()
    return this
  }

  push (...workers) {
    const methodResult = this.jobs.push(...workers)
    if (this.autostart) {
      this.start()
    }
    return methodResult
  }

  unshift (...workers) {
    const methodResult = this.jobs.unshift(...workers)
    if (this.autostart) {
      this.start()
    }
    return methodResult
  }

  splice (start, deleteCount, ...workers) {
    this.jobs.splice(start, deleteCount, ...workers)
    if (this.autostart) {
      this.start()
    }
    return this
  }

  get length () {
    return this.pending + this.jobs.length
  }

  start (callback) {
    let awaiter;

    if (callback) {
      this._addCallbackToEndEvent(callback)
    } else {
      awaiter = this._createPromiseToEndEvent();
    }

    this.running = true

    if (this.pending >= this.concurrency) {
      return
    }

    if (this.jobs.length === 0) {
      if (this.pending === 0) {
        this.done()
      }
      return
    }

    const job = this.jobs.shift()
    const session = this.session
    const timeout = (job !== undefined) && has.call(job, 'timeout') ? job.timeout : this.timeout
    let once = true
    let timeoutId = null
    let didTimeout = false
    let resultIndex = null

    const next = (error, ...result) => {
      if (once && this.session === session) {
        once = false
        this.pending--
        if (timeoutId !== null) {
          this.timers = this.timers.filter((tID) => tID !== timeoutId)
          clearTimeout(timeoutId)
        }

        if (error) {
          this.dispatchEvent(new QueueEvent('error', { error, job }))
        } else if (!didTimeout) {
          if (resultIndex !== null && this.results !== null) {
            this.results[resultIndex] = [...result]
          }
          this.dispatchEvent(new QueueEvent('success', { result: [...result], job }))
        }

        if (this.session === session) {
          if (this.pending === 0 && this.jobs.length === 0) {
            this.done()
          } else if (this.running) {
            this.start()
          }
        }
      }
    }

    if (timeout) {
      timeoutId = setTimeout(() => {
        didTimeout = true
        this.dispatchEvent(new QueueEvent('timeout', { next, job }))
        next()
      }, timeout)
      this.timers.push(timeoutId)
    }

    if (this.results != null) {
      resultIndex = this.results.length
      this.results[resultIndex] = null
    }

    this.pending++
    this.dispatchEvent(new QueueEvent('start', { job }))

    const promise = job(next)

    if (promise !== undefined && typeof promise.then === 'function') {
      promise.then(function (result) {
        return next(undefined, result)
      }).catch(function (err) {
        return next(err || true)
      })
    }

    if (this.running && this.jobs.length > 0) {
      return this.start()
    }

    return awaiter;
  }

  stop () {
    this.running = false
  }

  end (error) {
    this.clearTimers()
    this.jobs.length = 0
    this.pending = 0
    this.done(error)
  }

  clearTimers () {
    this.timers.forEach((timer) => {
      clearTimeout(timer)
    })

    this.timers = []
  }

  _addCallbackToEndEvent (cb) {
    const onend = (evt) => {
      this.removeEventListener('end', onend)
      cb(evt.detail.error, this.results)
    }
    this.addEventListener('end', onend)
  }

  _createPromiseToEndEvent() {
    return new Promise((resolve) => {
      this._addCallbackToEndEvent((error, results) => {
        resolve({ error, results });
      });
    });
  }

  done (error) {
    this.session++
    this.running = false
    this.dispatchEvent(new QueueEvent('end', { error }))
  }
}
