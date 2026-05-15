'use strict';
var wC = Object.create;
var bs = Object.defineProperty;
var DC = Object.getOwnPropertyDescriptor;
var RC = Object.getOwnPropertyNames;
var SC = Object.getPrototypeOf,
	TC = Object.prototype.hasOwnProperty;
var E = (n, e) => () => (e || n((e = { exports: {} }).exports, e), e.exports),
	PC = (n, e) => {
		for (var t in e) bs(n, t, { get: e[t], enumerable: !0 });
	},
	df = (n, e, t, r) => {
		if ((e && typeof e == 'object') || typeof e == 'function')
			for (let i of RC(e))
				!TC.call(n, i) &&
					i !== t &&
					bs(n, i, { get: () => e[i], enumerable: !(r = DC(e, i)) || r.enumerable });
		return n;
	};
var Oi = (n, e, t) => (
		(t = n != null ? wC(SC(n)) : {}),
		df(e || !n || !n.__esModule ? bs(t, 'default', { value: n, enumerable: !0 }) : t, n)
	),
	qC = (n) => df(bs({}, '__esModule', { value: !0 }), n);
var Jr = E((_t) => {
	'use strict';
	Object.defineProperty(_t, '__esModule', { value: !0 });
	_t.stringArray = _t.array = _t.func = _t.error = _t.number = _t.string = _t.boolean = void 0;
	function EC(n) {
		return n === !0 || n === !1;
	}
	_t.boolean = EC;
	function ff(n) {
		return typeof n == 'string' || n instanceof String;
	}
	_t.string = ff;
	function kC(n) {
		return typeof n == 'number' || n instanceof Number;
	}
	_t.number = kC;
	function xC(n) {
		return n instanceof Error;
	}
	_t.error = xC;
	function IC(n) {
		return typeof n == 'function';
	}
	_t.func = IC;
	function hf(n) {
		return Array.isArray(n);
	}
	_t.array = hf;
	function OC(n) {
		return hf(n) && n.every((e) => ff(e));
	}
	_t.stringArray = OC;
});
var La = E((J) => {
	'use strict';
	Object.defineProperty(J, '__esModule', { value: !0 });
	J.Message =
		J.NotificationType9 =
		J.NotificationType8 =
		J.NotificationType7 =
		J.NotificationType6 =
		J.NotificationType5 =
		J.NotificationType4 =
		J.NotificationType3 =
		J.NotificationType2 =
		J.NotificationType1 =
		J.NotificationType0 =
		J.NotificationType =
		J.RequestType9 =
		J.RequestType8 =
		J.RequestType7 =
		J.RequestType6 =
		J.RequestType5 =
		J.RequestType4 =
		J.RequestType3 =
		J.RequestType2 =
		J.RequestType1 =
		J.RequestType =
		J.RequestType0 =
		J.AbstractMessageSignature =
		J.ParameterStructures =
		J.ResponseError =
		J.ErrorCodes =
			void 0;
	var xr = Jr(),
		pa;
	(function (n) {
		((n.ParseError = -32700),
			(n.InvalidRequest = -32600),
			(n.MethodNotFound = -32601),
			(n.InvalidParams = -32602),
			(n.InternalError = -32603),
			(n.jsonrpcReservedErrorRangeStart = -32099),
			(n.serverErrorStart = -32099),
			(n.MessageWriteError = -32099),
			(n.MessageReadError = -32098),
			(n.PendingResponseRejected = -32097),
			(n.ConnectionInactive = -32096),
			(n.ServerNotInitialized = -32002),
			(n.UnknownErrorCode = -32001),
			(n.jsonrpcReservedErrorRangeEnd = -32e3),
			(n.serverErrorEnd = -32e3));
	})(pa || (J.ErrorCodes = pa = {}));
	var Fi = class extends Error {
		constructor(e, t, r) {
			(super(t),
				(this.code = xr.number(e) ? e : pa.UnknownErrorCode),
				(this.data = r),
				Object.setPrototypeOf(this, Fi.prototype));
		}
		toJson() {
			let e = { code: this.code, message: this.message };
			return (this.data !== void 0 && (e.data = this.data), e);
		}
	};
	J.ResponseError = Fi;
	var lt = class {
		constructor(e) {
			this.kind = e;
		}
		static is(e) {
			return e === lt.auto || e === lt.byName || e === lt.byPosition;
		}
		toString() {
			return this.kind;
		}
	};
	J.ParameterStructures = lt;
	lt.auto = new lt('auto');
	lt.byPosition = new lt('byPosition');
	lt.byName = new lt('byName');
	var Ae = class {
		constructor(e, t) {
			((this.method = e), (this.numberOfParams = t));
		}
		get parameterStructures() {
			return lt.auto;
		}
	};
	J.AbstractMessageSignature = Ae;
	var ga = class extends Ae {
		constructor(e) {
			super(e, 0);
		}
	};
	J.RequestType0 = ga;
	var ma = class extends Ae {
		constructor(e, t = lt.auto) {
			(super(e, 1), (this._parameterStructures = t));
		}
		get parameterStructures() {
			return this._parameterStructures;
		}
	};
	J.RequestType = ma;
	var va = class extends Ae {
		constructor(e, t = lt.auto) {
			(super(e, 1), (this._parameterStructures = t));
		}
		get parameterStructures() {
			return this._parameterStructures;
		}
	};
	J.RequestType1 = va;
	var ya = class extends Ae {
		constructor(e) {
			super(e, 2);
		}
	};
	J.RequestType2 = ya;
	var Ca = class extends Ae {
		constructor(e) {
			super(e, 3);
		}
	};
	J.RequestType3 = Ca;
	var ba = class extends Ae {
		constructor(e) {
			super(e, 4);
		}
	};
	J.RequestType4 = ba;
	var _a = class extends Ae {
		constructor(e) {
			super(e, 5);
		}
	};
	J.RequestType5 = _a;
	var wa = class extends Ae {
		constructor(e) {
			super(e, 6);
		}
	};
	J.RequestType6 = wa;
	var Da = class extends Ae {
		constructor(e) {
			super(e, 7);
		}
	};
	J.RequestType7 = Da;
	var Ra = class extends Ae {
		constructor(e) {
			super(e, 8);
		}
	};
	J.RequestType8 = Ra;
	var Sa = class extends Ae {
		constructor(e) {
			super(e, 9);
		}
	};
	J.RequestType9 = Sa;
	var Ta = class extends Ae {
		constructor(e, t = lt.auto) {
			(super(e, 1), (this._parameterStructures = t));
		}
		get parameterStructures() {
			return this._parameterStructures;
		}
	};
	J.NotificationType = Ta;
	var Pa = class extends Ae {
		constructor(e) {
			super(e, 0);
		}
	};
	J.NotificationType0 = Pa;
	var qa = class extends Ae {
		constructor(e, t = lt.auto) {
			(super(e, 1), (this._parameterStructures = t));
		}
		get parameterStructures() {
			return this._parameterStructures;
		}
	};
	J.NotificationType1 = qa;
	var Ea = class extends Ae {
		constructor(e) {
			super(e, 2);
		}
	};
	J.NotificationType2 = Ea;
	var ka = class extends Ae {
		constructor(e) {
			super(e, 3);
		}
	};
	J.NotificationType3 = ka;
	var xa = class extends Ae {
		constructor(e) {
			super(e, 4);
		}
	};
	J.NotificationType4 = xa;
	var Ia = class extends Ae {
		constructor(e) {
			super(e, 5);
		}
	};
	J.NotificationType5 = Ia;
	var Oa = class extends Ae {
		constructor(e) {
			super(e, 6);
		}
	};
	J.NotificationType6 = Oa;
	var Fa = class extends Ae {
		constructor(e) {
			super(e, 7);
		}
	};
	J.NotificationType7 = Fa;
	var Na = class extends Ae {
		constructor(e) {
			super(e, 8);
		}
	};
	J.NotificationType8 = Na;
	var Ma = class extends Ae {
		constructor(e) {
			super(e, 9);
		}
	};
	J.NotificationType9 = Ma;
	var pf;
	(function (n) {
		function e(i) {
			let s = i;
			return s && xr.string(s.method) && (xr.string(s.id) || xr.number(s.id));
		}
		n.isRequest = e;
		function t(i) {
			let s = i;
			return s && xr.string(s.method) && i.id === void 0;
		}
		n.isNotification = t;
		function r(i) {
			let s = i;
			return (
				s &&
				(s.result !== void 0 || !!s.error) &&
				(xr.string(s.id) || xr.number(s.id) || s.id === null)
			);
		}
		n.isResponse = r;
	})(pf || (J.Message = pf = {}));
});
var ja = E((hr) => {
	'use strict';
	var gf;
	Object.defineProperty(hr, '__esModule', { value: !0 });
	hr.LRUCache = hr.LinkedMap = hr.Touch = void 0;
	var wt;
	(function (n) {
		((n.None = 0), (n.First = 1), (n.AsOld = n.First), (n.Last = 2), (n.AsNew = n.Last));
	})(wt || (hr.Touch = wt = {}));
	var _s = class {
		constructor() {
			((this[gf] = 'LinkedMap'),
				(this._map = new Map()),
				(this._head = void 0),
				(this._tail = void 0),
				(this._size = 0),
				(this._state = 0));
		}
		clear() {
			(this._map.clear(),
				(this._head = void 0),
				(this._tail = void 0),
				(this._size = 0),
				this._state++);
		}
		isEmpty() {
			return !this._head && !this._tail;
		}
		get size() {
			return this._size;
		}
		get first() {
			return this._head?.value;
		}
		get last() {
			return this._tail?.value;
		}
		has(e) {
			return this._map.has(e);
		}
		get(e, t = wt.None) {
			let r = this._map.get(e);
			if (r) return (t !== wt.None && this.touch(r, t), r.value);
		}
		set(e, t, r = wt.None) {
			let i = this._map.get(e);
			if (i) ((i.value = t), r !== wt.None && this.touch(i, r));
			else {
				switch (((i = { key: e, value: t, next: void 0, previous: void 0 }), r)) {
					case wt.None:
						this.addItemLast(i);
						break;
					case wt.First:
						this.addItemFirst(i);
						break;
					case wt.Last:
						this.addItemLast(i);
						break;
					default:
						this.addItemLast(i);
						break;
				}
				(this._map.set(e, i), this._size++);
			}
			return this;
		}
		delete(e) {
			return !!this.remove(e);
		}
		remove(e) {
			let t = this._map.get(e);
			if (t) return (this._map.delete(e), this.removeItem(t), this._size--, t.value);
		}
		shift() {
			if (!this._head && !this._tail) return;
			if (!this._head || !this._tail) throw new Error('Invalid list');
			let e = this._head;
			return (this._map.delete(e.key), this.removeItem(e), this._size--, e.value);
		}
		forEach(e, t) {
			let r = this._state,
				i = this._head;
			for (; i; ) {
				if ((t ? e.bind(t)(i.value, i.key, this) : e(i.value, i.key, this), this._state !== r))
					throw new Error('LinkedMap got modified during iteration.');
				i = i.next;
			}
		}
		keys() {
			let e = this._state,
				t = this._head,
				r = {
					[Symbol.iterator]: () => r,
					next: () => {
						if (this._state !== e) throw new Error('LinkedMap got modified during iteration.');
						if (t) {
							let i = { value: t.key, done: !1 };
							return ((t = t.next), i);
						} else return { value: void 0, done: !0 };
					},
				};
			return r;
		}
		values() {
			let e = this._state,
				t = this._head,
				r = {
					[Symbol.iterator]: () => r,
					next: () => {
						if (this._state !== e) throw new Error('LinkedMap got modified during iteration.');
						if (t) {
							let i = { value: t.value, done: !1 };
							return ((t = t.next), i);
						} else return { value: void 0, done: !0 };
					},
				};
			return r;
		}
		entries() {
			let e = this._state,
				t = this._head,
				r = {
					[Symbol.iterator]: () => r,
					next: () => {
						if (this._state !== e) throw new Error('LinkedMap got modified during iteration.');
						if (t) {
							let i = { value: [t.key, t.value], done: !1 };
							return ((t = t.next), i);
						} else return { value: void 0, done: !0 };
					},
				};
			return r;
		}
		[((gf = Symbol.toStringTag), Symbol.iterator)]() {
			return this.entries();
		}
		trimOld(e) {
			if (e >= this.size) return;
			if (e === 0) {
				this.clear();
				return;
			}
			let t = this._head,
				r = this.size;
			for (; t && r > e; ) (this._map.delete(t.key), (t = t.next), r--);
			((this._head = t), (this._size = r), t && (t.previous = void 0), this._state++);
		}
		addItemFirst(e) {
			if (!this._head && !this._tail) this._tail = e;
			else if (this._head) ((e.next = this._head), (this._head.previous = e));
			else throw new Error('Invalid list');
			((this._head = e), this._state++);
		}
		addItemLast(e) {
			if (!this._head && !this._tail) this._head = e;
			else if (this._tail) ((e.previous = this._tail), (this._tail.next = e));
			else throw new Error('Invalid list');
			((this._tail = e), this._state++);
		}
		removeItem(e) {
			if (e === this._head && e === this._tail) ((this._head = void 0), (this._tail = void 0));
			else if (e === this._head) {
				if (!e.next) throw new Error('Invalid list');
				((e.next.previous = void 0), (this._head = e.next));
			} else if (e === this._tail) {
				if (!e.previous) throw new Error('Invalid list');
				((e.previous.next = void 0), (this._tail = e.previous));
			} else {
				let t = e.next,
					r = e.previous;
				if (!t || !r) throw new Error('Invalid list');
				((t.previous = r), (r.next = t));
			}
			((e.next = void 0), (e.previous = void 0), this._state++);
		}
		touch(e, t) {
			if (!this._head || !this._tail) throw new Error('Invalid list');
			if (!(t !== wt.First && t !== wt.Last)) {
				if (t === wt.First) {
					if (e === this._head) return;
					let r = e.next,
						i = e.previous;
					(e === this._tail
						? ((i.next = void 0), (this._tail = i))
						: ((r.previous = i), (i.next = r)),
						(e.previous = void 0),
						(e.next = this._head),
						(this._head.previous = e),
						(this._head = e),
						this._state++);
				} else if (t === wt.Last) {
					if (e === this._tail) return;
					let r = e.next,
						i = e.previous;
					(e === this._head
						? ((r.previous = void 0), (this._head = r))
						: ((r.previous = i), (i.next = r)),
						(e.next = void 0),
						(e.previous = this._tail),
						(this._tail.next = e),
						(this._tail = e),
						this._state++);
				}
			}
		}
		toJSON() {
			let e = [];
			return (
				this.forEach((t, r) => {
					e.push([r, t]);
				}),
				e
			);
		}
		fromJSON(e) {
			this.clear();
			for (let [t, r] of e) this.set(t, r);
		}
	};
	hr.LinkedMap = _s;
	var Aa = class extends _s {
		constructor(e, t = 1) {
			(super(), (this._limit = e), (this._ratio = Math.min(Math.max(0, t), 1)));
		}
		get limit() {
			return this._limit;
		}
		set limit(e) {
			((this._limit = e), this.checkTrim());
		}
		get ratio() {
			return this._ratio;
		}
		set ratio(e) {
			((this._ratio = Math.min(Math.max(0, e), 1)), this.checkTrim());
		}
		get(e, t = wt.AsNew) {
			return super.get(e, t);
		}
		peek(e) {
			return super.get(e, wt.None);
		}
		set(e, t) {
			return (super.set(e, t, wt.Last), this.checkTrim(), this);
		}
		checkTrim() {
			this.size > this._limit && this.trimOld(Math.round(this._limit * this._ratio));
		}
	};
	hr.LRUCache = Aa;
});
var vf = E((ws) => {
	'use strict';
	Object.defineProperty(ws, '__esModule', { value: !0 });
	ws.Disposable = void 0;
	var mf;
	(function (n) {
		function e(t) {
			return { dispose: t };
		}
		n.create = e;
	})(mf || (ws.Disposable = mf = {}));
});
var pr = E((Wa) => {
	'use strict';
	Object.defineProperty(Wa, '__esModule', { value: !0 });
	var $a;
	function Ha() {
		if ($a === void 0) throw new Error('No runtime abstraction layer installed');
		return $a;
	}
	(function (n) {
		function e(t) {
			if (t === void 0) throw new Error('No runtime abstraction layer provided');
			$a = t;
		}
		n.install = e;
	})(Ha || (Ha = {}));
	Wa.default = Ha;
});
var Zr = E((Yr) => {
	'use strict';
	Object.defineProperty(Yr, '__esModule', { value: !0 });
	Yr.Emitter = Yr.Event = void 0;
	var FC = pr(),
		yf;
	(function (n) {
		let e = { dispose() {} };
		n.None = function () {
			return e;
		};
	})(yf || (Yr.Event = yf = {}));
	var Ua = class {
			add(e, t = null, r) {
				(this._callbacks || ((this._callbacks = []), (this._contexts = [])),
					this._callbacks.push(e),
					this._contexts.push(t),
					Array.isArray(r) && r.push({ dispose: () => this.remove(e, t) }));
			}
			remove(e, t = null) {
				if (!this._callbacks) return;
				let r = !1;
				for (let i = 0, s = this._callbacks.length; i < s; i++)
					if (this._callbacks[i] === e)
						if (this._contexts[i] === t) {
							(this._callbacks.splice(i, 1), this._contexts.splice(i, 1));
							return;
						} else r = !0;
				if (r)
					throw new Error(
						'When adding a listener with a context, you should remove it with the same context',
					);
			}
			invoke(...e) {
				if (!this._callbacks) return [];
				let t = [],
					r = this._callbacks.slice(0),
					i = this._contexts.slice(0);
				for (let s = 0, o = r.length; s < o; s++)
					try {
						t.push(r[s].apply(i[s], e));
					} catch (a) {
						(0, FC.default)().console.error(a);
					}
				return t;
			}
			isEmpty() {
				return !this._callbacks || this._callbacks.length === 0;
			}
			dispose() {
				((this._callbacks = void 0), (this._contexts = void 0));
			}
		},
		Qr = class {
			constructor(e) {
				this._options = e;
			}
			get event() {
				return (
					this._event ||
						(this._event = (e, t, r) => {
							(this._callbacks || (this._callbacks = new Ua()),
								this._options &&
									this._options.onFirstListenerAdd &&
									this._callbacks.isEmpty() &&
									this._options.onFirstListenerAdd(this),
								this._callbacks.add(e, t));
							let i = {
								dispose: () => {
									this._callbacks &&
										(this._callbacks.remove(e, t),
										(i.dispose = Qr._noop),
										this._options &&
											this._options.onLastListenerRemove &&
											this._callbacks.isEmpty() &&
											this._options.onLastListenerRemove(this));
								},
							};
							return (Array.isArray(r) && r.push(i), i);
						}),
					this._event
				);
			}
			fire(e) {
				this._callbacks && this._callbacks.invoke.call(this._callbacks, e);
			}
			dispose() {
				this._callbacks && (this._callbacks.dispose(), (this._callbacks = void 0));
			}
		};
	Yr.Emitter = Qr;
	Qr._noop = function () {};
});
var Ss = E((ei) => {
	'use strict';
	Object.defineProperty(ei, '__esModule', { value: !0 });
	ei.CancellationTokenSource = ei.CancellationToken = void 0;
	var NC = pr(),
		MC = Jr(),
		Ka = Zr(),
		Ds;
	(function (n) {
		((n.None = Object.freeze({
			isCancellationRequested: !1,
			onCancellationRequested: Ka.Event.None,
		})),
			(n.Cancelled = Object.freeze({
				isCancellationRequested: !0,
				onCancellationRequested: Ka.Event.None,
			})));
		function e(t) {
			let r = t;
			return (
				r &&
				(r === n.None ||
					r === n.Cancelled ||
					(MC.boolean(r.isCancellationRequested) && !!r.onCancellationRequested))
			);
		}
		n.is = e;
	})(Ds || (ei.CancellationToken = Ds = {}));
	var LC = Object.freeze(function (n, e) {
			let t = (0, NC.default)().timer.setTimeout(n.bind(e), 0);
			return {
				dispose() {
					t.dispose();
				},
			};
		}),
		Rs = class {
			constructor() {
				this._isCancelled = !1;
			}
			cancel() {
				this._isCancelled ||
					((this._isCancelled = !0), this._emitter && (this._emitter.fire(void 0), this.dispose()));
			}
			get isCancellationRequested() {
				return this._isCancelled;
			}
			get onCancellationRequested() {
				return this._isCancelled
					? LC
					: (this._emitter || (this._emitter = new Ka.Emitter()), this._emitter.event);
			}
			dispose() {
				this._emitter && (this._emitter.dispose(), (this._emitter = void 0));
			}
		},
		za = class {
			get token() {
				return (this._token || (this._token = new Rs()), this._token);
			}
			cancel() {
				this._token ? this._token.cancel() : (this._token = Ds.Cancelled);
			}
			dispose() {
				this._token ? this._token instanceof Rs && this._token.dispose() : (this._token = Ds.None);
			}
		};
	ei.CancellationTokenSource = za;
});
var Cf = E((ti) => {
	'use strict';
	Object.defineProperty(ti, '__esModule', { value: !0 });
	ti.SharedArrayReceiverStrategy = ti.SharedArraySenderStrategy = void 0;
	var AC = Ss(),
		Ni;
	(function (n) {
		((n.Continue = 0), (n.Cancelled = 1));
	})(Ni || (Ni = {}));
	var Va = class {
		constructor() {
			this.buffers = new Map();
		}
		enableCancellation(e) {
			if (e.id === null) return;
			let t = new SharedArrayBuffer(4),
				r = new Int32Array(t, 0, 1);
			((r[0] = Ni.Continue), this.buffers.set(e.id, t), (e.$cancellationData = t));
		}
		async sendCancellation(e, t) {
			let r = this.buffers.get(t);
			if (r === void 0) return;
			let i = new Int32Array(r, 0, 1);
			Atomics.store(i, 0, Ni.Cancelled);
		}
		cleanup(e) {
			this.buffers.delete(e);
		}
		dispose() {
			this.buffers.clear();
		}
	};
	ti.SharedArraySenderStrategy = Va;
	var Ba = class {
			constructor(e) {
				this.data = new Int32Array(e, 0, 1);
			}
			get isCancellationRequested() {
				return Atomics.load(this.data, 0) === Ni.Cancelled;
			}
			get onCancellationRequested() {
				throw new Error("Cancellation over SharedArrayBuffer doesn't support cancellation events");
			}
		},
		Ga = class {
			constructor(e) {
				this.token = new Ba(e);
			}
			cancel() {}
			dispose() {}
		},
		Xa = class {
			constructor() {
				this.kind = 'request';
			}
			createCancellationTokenSource(e) {
				let t = e.$cancellationData;
				return t === void 0 ? new AC.CancellationTokenSource() : new Ga(t);
			}
		};
	ti.SharedArrayReceiverStrategy = Xa;
});
var Qa = E((Ts) => {
	'use strict';
	Object.defineProperty(Ts, '__esModule', { value: !0 });
	Ts.Semaphore = void 0;
	var jC = pr(),
		Ja = class {
			constructor(e = 1) {
				if (e <= 0) throw new Error('Capacity must be greater than 0');
				((this._capacity = e), (this._active = 0), (this._waiting = []));
			}
			lock(e) {
				return new Promise((t, r) => {
					(this._waiting.push({ thunk: e, resolve: t, reject: r }), this.runNext());
				});
			}
			get active() {
				return this._active;
			}
			runNext() {
				this._waiting.length === 0 ||
					this._active === this._capacity ||
					(0, jC.default)().timer.setImmediate(() => this.doRunNext());
			}
			doRunNext() {
				if (this._waiting.length === 0 || this._active === this._capacity) return;
				let e = this._waiting.shift();
				if ((this._active++, this._active > this._capacity))
					throw new Error('To many thunks active');
				try {
					let t = e.thunk();
					t instanceof Promise
						? t.then(
								(r) => {
									(this._active--, e.resolve(r), this.runNext());
								},
								(r) => {
									(this._active--, e.reject(r), this.runNext());
								},
							)
						: (this._active--, e.resolve(t), this.runNext());
				} catch (t) {
					(this._active--, e.reject(t), this.runNext());
				}
			}
		};
	Ts.Semaphore = Ja;
});
var _f = E((gr) => {
	'use strict';
	Object.defineProperty(gr, '__esModule', { value: !0 });
	gr.ReadableStreamMessageReader = gr.AbstractMessageReader = gr.MessageReader = void 0;
	var Za = pr(),
		ni = Jr(),
		Ya = Zr(),
		$C = Qa(),
		bf;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r &&
				ni.func(r.listen) &&
				ni.func(r.dispose) &&
				ni.func(r.onError) &&
				ni.func(r.onClose) &&
				ni.func(r.onPartialMessage)
			);
		}
		n.is = e;
	})(bf || (gr.MessageReader = bf = {}));
	var Ps = class {
		constructor() {
			((this.errorEmitter = new Ya.Emitter()),
				(this.closeEmitter = new Ya.Emitter()),
				(this.partialMessageEmitter = new Ya.Emitter()));
		}
		dispose() {
			(this.errorEmitter.dispose(), this.closeEmitter.dispose());
		}
		get onError() {
			return this.errorEmitter.event;
		}
		fireError(e) {
			this.errorEmitter.fire(this.asError(e));
		}
		get onClose() {
			return this.closeEmitter.event;
		}
		fireClose() {
			this.closeEmitter.fire(void 0);
		}
		get onPartialMessage() {
			return this.partialMessageEmitter.event;
		}
		firePartialMessage(e) {
			this.partialMessageEmitter.fire(e);
		}
		asError(e) {
			return e instanceof Error
				? e
				: new Error(
						`Reader received error. Reason: ${ni.string(e.message) ? e.message : 'unknown'}`,
					);
		}
	};
	gr.AbstractMessageReader = Ps;
	var ec;
	(function (n) {
		function e(t) {
			let r,
				i,
				s,
				o = new Map(),
				a,
				u = new Map();
			if (t === void 0 || typeof t == 'string') r = t ?? 'utf-8';
			else {
				if (
					((r = t.charset ?? 'utf-8'),
					t.contentDecoder !== void 0 && ((s = t.contentDecoder), o.set(s.name, s)),
					t.contentDecoders !== void 0)
				)
					for (let l of t.contentDecoders) o.set(l.name, l);
				if (
					(t.contentTypeDecoder !== void 0 && ((a = t.contentTypeDecoder), u.set(a.name, a)),
					t.contentTypeDecoders !== void 0)
				)
					for (let l of t.contentTypeDecoders) u.set(l.name, l);
			}
			return (
				a === void 0 && ((a = (0, Za.default)().applicationJson.decoder), u.set(a.name, a)),
				{
					charset: r,
					contentDecoder: s,
					contentDecoders: o,
					contentTypeDecoder: a,
					contentTypeDecoders: u,
				}
			);
		}
		n.fromOptions = e;
	})(ec || (ec = {}));
	var tc = class extends Ps {
		constructor(e, t) {
			(super(),
				(this.readable = e),
				(this.options = ec.fromOptions(t)),
				(this.buffer = (0, Za.default)().messageBuffer.create(this.options.charset)),
				(this._partialMessageTimeout = 1e4),
				(this.nextMessageLength = -1),
				(this.messageToken = 0),
				(this.readSemaphore = new $C.Semaphore(1)));
		}
		set partialMessageTimeout(e) {
			this._partialMessageTimeout = e;
		}
		get partialMessageTimeout() {
			return this._partialMessageTimeout;
		}
		listen(e) {
			((this.nextMessageLength = -1),
				(this.messageToken = 0),
				(this.partialMessageTimer = void 0),
				(this.callback = e));
			let t = this.readable.onData((r) => {
				this.onData(r);
			});
			return (
				this.readable.onError((r) => this.fireError(r)),
				this.readable.onClose(() => this.fireClose()),
				t
			);
		}
		onData(e) {
			try {
				for (this.buffer.append(e); ; ) {
					if (this.nextMessageLength === -1) {
						let r = this.buffer.tryReadHeaders(!0);
						if (!r) return;
						let i = r.get('content-length');
						if (!i) {
							this.fireError(
								new Error(`Header must provide a Content-Length property.
${JSON.stringify(Object.fromEntries(r))}`),
							);
							return;
						}
						let s = parseInt(i);
						if (isNaN(s)) {
							this.fireError(new Error(`Content-Length value must be a number. Got ${i}`));
							return;
						}
						this.nextMessageLength = s;
					}
					let t = this.buffer.tryReadBody(this.nextMessageLength);
					if (t === void 0) {
						this.setPartialMessageTimer();
						return;
					}
					(this.clearPartialMessageTimer(),
						(this.nextMessageLength = -1),
						this.readSemaphore
							.lock(async () => {
								let r =
										this.options.contentDecoder !== void 0
											? await this.options.contentDecoder.decode(t)
											: t,
									i = await this.options.contentTypeDecoder.decode(r, this.options);
								this.callback(i);
							})
							.catch((r) => {
								this.fireError(r);
							}));
				}
			} catch (t) {
				this.fireError(t);
			}
		}
		clearPartialMessageTimer() {
			this.partialMessageTimer &&
				(this.partialMessageTimer.dispose(), (this.partialMessageTimer = void 0));
		}
		setPartialMessageTimer() {
			(this.clearPartialMessageTimer(),
				!(this._partialMessageTimeout <= 0) &&
					(this.partialMessageTimer = (0, Za.default)().timer.setTimeout(
						(e, t) => {
							((this.partialMessageTimer = void 0),
								e === this.messageToken &&
									(this.firePartialMessage({ messageToken: e, waitingTime: t }),
									this.setPartialMessageTimer()));
						},
						this._partialMessageTimeout,
						this.messageToken,
						this._partialMessageTimeout,
					)));
		}
	};
	gr.ReadableStreamMessageReader = tc;
});
var Tf = E((mr) => {
	'use strict';
	Object.defineProperty(mr, '__esModule', { value: !0 });
	mr.WriteableStreamMessageWriter = mr.AbstractMessageWriter = mr.MessageWriter = void 0;
	var wf = pr(),
		Mi = Jr(),
		HC = Qa(),
		Df = Zr(),
		WC = 'Content-Length: ',
		Rf = `\r
`,
		Sf;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r && Mi.func(r.dispose) && Mi.func(r.onClose) && Mi.func(r.onError) && Mi.func(r.write)
			);
		}
		n.is = e;
	})(Sf || (mr.MessageWriter = Sf = {}));
	var qs = class {
		constructor() {
			((this.errorEmitter = new Df.Emitter()), (this.closeEmitter = new Df.Emitter()));
		}
		dispose() {
			(this.errorEmitter.dispose(), this.closeEmitter.dispose());
		}
		get onError() {
			return this.errorEmitter.event;
		}
		fireError(e, t, r) {
			this.errorEmitter.fire([this.asError(e), t, r]);
		}
		get onClose() {
			return this.closeEmitter.event;
		}
		fireClose() {
			this.closeEmitter.fire(void 0);
		}
		asError(e) {
			return e instanceof Error
				? e
				: new Error(
						`Writer received error. Reason: ${Mi.string(e.message) ? e.message : 'unknown'}`,
					);
		}
	};
	mr.AbstractMessageWriter = qs;
	var nc;
	(function (n) {
		function e(t) {
			return t === void 0 || typeof t == 'string'
				? { charset: t ?? 'utf-8', contentTypeEncoder: (0, wf.default)().applicationJson.encoder }
				: {
						charset: t.charset ?? 'utf-8',
						contentEncoder: t.contentEncoder,
						contentTypeEncoder: t.contentTypeEncoder ?? (0, wf.default)().applicationJson.encoder,
					};
		}
		n.fromOptions = e;
	})(nc || (nc = {}));
	var rc = class extends qs {
		constructor(e, t) {
			(super(),
				(this.writable = e),
				(this.options = nc.fromOptions(t)),
				(this.errorCount = 0),
				(this.writeSemaphore = new HC.Semaphore(1)),
				this.writable.onError((r) => this.fireError(r)),
				this.writable.onClose(() => this.fireClose()));
		}
		async write(e) {
			return this.writeSemaphore.lock(async () =>
				this.options.contentTypeEncoder
					.encode(e, this.options)
					.then((r) =>
						this.options.contentEncoder !== void 0 ? this.options.contentEncoder.encode(r) : r,
					)
					.then(
						(r) => {
							let i = [];
							return (i.push(WC, r.byteLength.toString(), Rf), i.push(Rf), this.doWrite(e, i, r));
						},
						(r) => {
							throw (this.fireError(r), r);
						},
					),
			);
		}
		async doWrite(e, t, r) {
			try {
				return (await this.writable.write(t.join(''), 'ascii'), this.writable.write(r));
			} catch (i) {
				return (this.handleError(i, e), Promise.reject(i));
			}
		}
		handleError(e, t) {
			(this.errorCount++, this.fireError(e, t, this.errorCount));
		}
		end() {
			this.writable.end();
		}
	};
	mr.WriteableStreamMessageWriter = rc;
});
var Pf = E((Es) => {
	'use strict';
	Object.defineProperty(Es, '__esModule', { value: !0 });
	Es.AbstractMessageBuffer = void 0;
	var UC = 13,
		KC = 10,
		zC = `\r
`,
		ic = class {
			constructor(e = 'utf-8') {
				((this._encoding = e), (this._chunks = []), (this._totalLength = 0));
			}
			get encoding() {
				return this._encoding;
			}
			append(e) {
				let t = typeof e == 'string' ? this.fromString(e, this._encoding) : e;
				(this._chunks.push(t), (this._totalLength += t.byteLength));
			}
			tryReadHeaders(e = !1) {
				if (this._chunks.length === 0) return;
				let t = 0,
					r = 0,
					i = 0,
					s = 0;
				e: for (; r < this._chunks.length; ) {
					let l = this._chunks[r];
					i = 0;
					t: for (; i < l.length; ) {
						switch (l[i]) {
							case UC:
								switch (t) {
									case 0:
										t = 1;
										break;
									case 2:
										t = 3;
										break;
									default:
										t = 0;
								}
								break;
							case KC:
								switch (t) {
									case 1:
										t = 2;
										break;
									case 3:
										((t = 4), i++);
										break e;
									default:
										t = 0;
								}
								break;
							default:
								t = 0;
						}
						i++;
					}
					((s += l.byteLength), r++);
				}
				if (t !== 4) return;
				let o = this._read(s + i),
					a = new Map(),
					u = this.toString(o, 'ascii').split(zC);
				if (u.length < 2) return a;
				for (let l = 0; l < u.length - 2; l++) {
					let p = u[l],
						m = p.indexOf(':');
					if (m === -1)
						throw new Error(`Message header must separate key and value using ':'
${p}`);
					let g = p.substr(0, m),
						D = p.substr(m + 1).trim();
					a.set(e ? g.toLowerCase() : g, D);
				}
				return a;
			}
			tryReadBody(e) {
				if (!(this._totalLength < e)) return this._read(e);
			}
			get numberOfBytes() {
				return this._totalLength;
			}
			_read(e) {
				if (e === 0) return this.emptyBuffer();
				if (e > this._totalLength) throw new Error('Cannot read so many bytes!');
				if (this._chunks[0].byteLength === e) {
					let s = this._chunks[0];
					return (this._chunks.shift(), (this._totalLength -= e), this.asNative(s));
				}
				if (this._chunks[0].byteLength > e) {
					let s = this._chunks[0],
						o = this.asNative(s, e);
					return ((this._chunks[0] = s.slice(e)), (this._totalLength -= e), o);
				}
				let t = this.allocNative(e),
					r = 0,
					i = 0;
				for (; e > 0; ) {
					let s = this._chunks[i];
					if (s.byteLength > e) {
						let o = s.slice(0, e);
						(t.set(o, r),
							(r += e),
							(this._chunks[i] = s.slice(e)),
							(this._totalLength -= e),
							(e -= e));
					} else
						(t.set(s, r),
							(r += s.byteLength),
							this._chunks.shift(),
							(this._totalLength -= s.byteLength),
							(e -= s.byteLength));
				}
				return t;
			}
		};
	Es.AbstractMessageBuffer = ic;
});
var If = E((re) => {
	'use strict';
	Object.defineProperty(re, '__esModule', { value: !0 });
	re.createMessageConnection =
		re.ConnectionOptions =
		re.MessageStrategy =
		re.CancellationStrategy =
		re.CancellationSenderStrategy =
		re.CancellationReceiverStrategy =
		re.RequestCancellationReceiverStrategy =
		re.IdCancellationReceiverStrategy =
		re.ConnectionStrategy =
		re.ConnectionError =
		re.ConnectionErrors =
		re.LogTraceNotification =
		re.SetTraceNotification =
		re.TraceFormat =
		re.TraceValues =
		re.Trace =
		re.NullLogger =
		re.ProgressType =
		re.ProgressToken =
			void 0;
	var qf = pr(),
		ze = Jr(),
		Q = La(),
		Ef = ja(),
		Li = Zr(),
		sc = Ss(),
		$i;
	(function (n) {
		n.type = new Q.NotificationType('$/cancelRequest');
	})($i || ($i = {}));
	var oc;
	(function (n) {
		function e(t) {
			return typeof t == 'string' || typeof t == 'number';
		}
		n.is = e;
	})(oc || (re.ProgressToken = oc = {}));
	var Ai;
	(function (n) {
		n.type = new Q.NotificationType('$/progress');
	})(Ai || (Ai = {}));
	var ac = class {
		constructor() {}
	};
	re.ProgressType = ac;
	var cc;
	(function (n) {
		function e(t) {
			return ze.func(t);
		}
		n.is = e;
	})(cc || (cc = {}));
	re.NullLogger = Object.freeze({ error: () => {}, warn: () => {}, info: () => {}, log: () => {} });
	var De;
	(function (n) {
		((n[(n.Off = 0)] = 'Off'),
			(n[(n.Messages = 1)] = 'Messages'),
			(n[(n.Compact = 2)] = 'Compact'),
			(n[(n.Verbose = 3)] = 'Verbose'));
	})(De || (re.Trace = De = {}));
	var kf;
	(function (n) {
		((n.Off = 'off'), (n.Messages = 'messages'), (n.Compact = 'compact'), (n.Verbose = 'verbose'));
	})(kf || (re.TraceValues = kf = {}));
	(function (n) {
		function e(r) {
			if (!ze.string(r)) return n.Off;
			switch (((r = r.toLowerCase()), r)) {
				case 'off':
					return n.Off;
				case 'messages':
					return n.Messages;
				case 'compact':
					return n.Compact;
				case 'verbose':
					return n.Verbose;
				default:
					return n.Off;
			}
		}
		n.fromString = e;
		function t(r) {
			switch (r) {
				case n.Off:
					return 'off';
				case n.Messages:
					return 'messages';
				case n.Compact:
					return 'compact';
				case n.Verbose:
					return 'verbose';
				default:
					return 'off';
			}
		}
		n.toString = t;
	})(De || (re.Trace = De = {}));
	var Gt;
	(function (n) {
		((n.Text = 'text'), (n.JSON = 'json'));
	})(Gt || (re.TraceFormat = Gt = {}));
	(function (n) {
		function e(t) {
			return ze.string(t) ? ((t = t.toLowerCase()), t === 'json' ? n.JSON : n.Text) : n.Text;
		}
		n.fromString = e;
	})(Gt || (re.TraceFormat = Gt = {}));
	var uc;
	(function (n) {
		n.type = new Q.NotificationType('$/setTrace');
	})(uc || (re.SetTraceNotification = uc = {}));
	var ks;
	(function (n) {
		n.type = new Q.NotificationType('$/logTrace');
	})(ks || (re.LogTraceNotification = ks = {}));
	var ji;
	(function (n) {
		((n[(n.Closed = 1)] = 'Closed'),
			(n[(n.Disposed = 2)] = 'Disposed'),
			(n[(n.AlreadyListening = 3)] = 'AlreadyListening'));
	})(ji || (re.ConnectionErrors = ji = {}));
	var vr = class extends Error {
		constructor(e, t) {
			(super(t), (this.code = e), Object.setPrototypeOf(this, vr.prototype));
		}
	};
	re.ConnectionError = vr;
	var lc;
	(function (n) {
		function e(t) {
			let r = t;
			return r && ze.func(r.cancelUndispatched);
		}
		n.is = e;
	})(lc || (re.ConnectionStrategy = lc = {}));
	var xs;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r &&
				(r.kind === void 0 || r.kind === 'id') &&
				ze.func(r.createCancellationTokenSource) &&
				(r.dispose === void 0 || ze.func(r.dispose))
			);
		}
		n.is = e;
	})(xs || (re.IdCancellationReceiverStrategy = xs = {}));
	var dc;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r &&
				r.kind === 'request' &&
				ze.func(r.createCancellationTokenSource) &&
				(r.dispose === void 0 || ze.func(r.dispose))
			);
		}
		n.is = e;
	})(dc || (re.RequestCancellationReceiverStrategy = dc = {}));
	var Is;
	(function (n) {
		n.Message = Object.freeze({
			createCancellationTokenSource(t) {
				return new sc.CancellationTokenSource();
			},
		});
		function e(t) {
			return xs.is(t) || dc.is(t);
		}
		n.is = e;
	})(Is || (re.CancellationReceiverStrategy = Is = {}));
	var Os;
	(function (n) {
		n.Message = Object.freeze({
			sendCancellation(t, r) {
				return t.sendNotification($i.type, { id: r });
			},
			cleanup(t) {},
		});
		function e(t) {
			let r = t;
			return r && ze.func(r.sendCancellation) && ze.func(r.cleanup);
		}
		n.is = e;
	})(Os || (re.CancellationSenderStrategy = Os = {}));
	var Fs;
	(function (n) {
		n.Message = Object.freeze({ receiver: Is.Message, sender: Os.Message });
		function e(t) {
			let r = t;
			return r && Is.is(r.receiver) && Os.is(r.sender);
		}
		n.is = e;
	})(Fs || (re.CancellationStrategy = Fs = {}));
	var Ns;
	(function (n) {
		function e(t) {
			let r = t;
			return r && ze.func(r.handleMessage);
		}
		n.is = e;
	})(Ns || (re.MessageStrategy = Ns = {}));
	var xf;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r &&
				(Fs.is(r.cancellationStrategy) || lc.is(r.connectionStrategy) || Ns.is(r.messageStrategy))
			);
		}
		n.is = e;
	})(xf || (re.ConnectionOptions = xf = {}));
	var _n;
	(function (n) {
		((n[(n.New = 1)] = 'New'),
			(n[(n.Listening = 2)] = 'Listening'),
			(n[(n.Closed = 3)] = 'Closed'),
			(n[(n.Disposed = 4)] = 'Disposed'));
	})(_n || (_n = {}));
	function VC(n, e, t, r) {
		let i = t !== void 0 ? t : re.NullLogger,
			s = 0,
			o = 0,
			a = 0,
			u = '2.0',
			l,
			p = new Map(),
			m,
			g = new Map(),
			D = new Map(),
			y,
			P = new Ef.LinkedMap(),
			q = new Map(),
			N = new Set(),
			L = new Map(),
			M = De.Off,
			H = Gt.Text,
			X,
			de = _n.New,
			B = new Li.Emitter(),
			Z = new Li.Emitter(),
			ce = new Li.Emitter(),
			et = new Li.Emitter(),
			Xe = new Li.Emitter(),
			rt = r && r.cancellationStrategy ? r.cancellationStrategy : Fs.Message;
		function tn(b) {
			if (b === null)
				throw new Error("Can't send requests with id null since the response can't be correlated.");
			return 'req-' + b.toString();
		}
		function qt(b) {
			return b === null ? 'res-unknown-' + (++a).toString() : 'res-' + b.toString();
		}
		function pt() {
			return 'not-' + (++o).toString();
		}
		function gt(b, I) {
			Q.Message.isRequest(I)
				? b.set(tn(I.id), I)
				: Q.Message.isResponse(I)
					? b.set(qt(I.id), I)
					: b.set(pt(), I);
		}
		function gn(b) {}
		function En() {
			return de === _n.Listening;
		}
		function Me() {
			return de === _n.Closed;
		}
		function Ft() {
			return de === _n.Disposed;
		}
		function Et() {
			(de === _n.New || de === _n.Listening) && ((de = _n.Closed), Z.fire(void 0));
		}
		function mt(b) {
			B.fire([b, void 0, void 0]);
		}
		function cr(b) {
			B.fire(b);
		}
		(n.onClose(Et), n.onError(mt), e.onClose(Et), e.onError(cr));
		function kn() {
			y ||
				P.size === 0 ||
				(y = (0, qf.default)().timer.setImmediate(() => {
					((y = void 0), Vn());
				}));
		}
		function xn(b) {
			Q.Message.isRequest(b)
				? In(b)
				: Q.Message.isNotification(b)
					? vn(b)
					: Q.Message.isResponse(b)
						? mn(b)
						: On(b);
		}
		function Vn() {
			if (P.size === 0) return;
			let b = P.shift();
			try {
				let I = r?.messageStrategy;
				Ns.is(I) ? I.handleMessage(b, xn) : xn(b);
			} finally {
				kn();
			}
		}
		let ur = (b) => {
			try {
				if (Q.Message.isNotification(b) && b.method === $i.type.method) {
					let I = b.params.id,
						$ = tn(I),
						U = P.get($);
					if (Q.Message.isRequest(U)) {
						let ve = r?.connectionStrategy,
							Pe = ve && ve.cancelUndispatched ? ve.cancelUndispatched(U, gn) : void 0;
						if (Pe && (Pe.error !== void 0 || Pe.result !== void 0)) {
							(P.delete($),
								L.delete(I),
								(Pe.id = U.id),
								nn(Pe, b.method, Date.now()),
								e.write(Pe).catch(() => i.error('Sending response for canceled message failed.')));
							return;
						}
					}
					let Ce = L.get(I);
					if (Ce !== void 0) {
						(Ce.cancel(), rn(b));
						return;
					} else N.add(I);
				}
				gt(P, b);
			} finally {
				kn();
			}
		};
		function In(b) {
			if (Ft()) return;
			function I(oe, _e, fe) {
				let xe = { jsonrpc: u, id: b.id };
				(oe instanceof Q.ResponseError
					? (xe.error = oe.toJson())
					: (xe.result = oe === void 0 ? null : oe),
					nn(xe, _e, fe),
					e.write(xe).catch(() => i.error('Sending response failed.')));
			}
			function $(oe, _e, fe) {
				let xe = { jsonrpc: u, id: b.id, error: oe.toJson() };
				(nn(xe, _e, fe), e.write(xe).catch(() => i.error('Sending response failed.')));
			}
			function U(oe, _e, fe) {
				oe === void 0 && (oe = null);
				let xe = { jsonrpc: u, id: b.id, result: oe };
				(nn(xe, _e, fe), e.write(xe).catch(() => i.error('Sending response failed.')));
			}
			lr(b);
			let Ce = p.get(b.method),
				ve,
				Pe;
			Ce && ((ve = Ce.type), (Pe = Ce.handler));
			let ke = Date.now();
			if (Pe || l) {
				let oe = b.id ?? String(Date.now()),
					_e = xs.is(rt.receiver)
						? rt.receiver.createCancellationTokenSource(oe)
						: rt.receiver.createCancellationTokenSource(b);
				(b.id !== null && N.has(b.id) && _e.cancel(), b.id !== null && L.set(oe, _e));
				try {
					let fe;
					if (Pe)
						if (b.params === void 0) {
							if (ve !== void 0 && ve.numberOfParams !== 0) {
								$(
									new Q.ResponseError(
										Q.ErrorCodes.InvalidParams,
										`Request ${b.method} defines ${ve.numberOfParams} params but received none.`,
									),
									b.method,
									ke,
								);
								return;
							}
							fe = Pe(_e.token);
						} else if (Array.isArray(b.params)) {
							if (ve !== void 0 && ve.parameterStructures === Q.ParameterStructures.byName) {
								$(
									new Q.ResponseError(
										Q.ErrorCodes.InvalidParams,
										`Request ${b.method} defines parameters by name but received parameters by position`,
									),
									b.method,
									ke,
								);
								return;
							}
							fe = Pe(...b.params, _e.token);
						} else {
							if (ve !== void 0 && ve.parameterStructures === Q.ParameterStructures.byPosition) {
								$(
									new Q.ResponseError(
										Q.ErrorCodes.InvalidParams,
										`Request ${b.method} defines parameters by position but received parameters by name`,
									),
									b.method,
									ke,
								);
								return;
							}
							fe = Pe(b.params, _e.token);
						}
					else l && (fe = l(b.method, b.params, _e.token));
					let xe = fe;
					fe
						? xe.then
							? xe.then(
									(Je) => {
										(L.delete(oe), I(Je, b.method, ke));
									},
									(Je) => {
										(L.delete(oe),
											Je instanceof Q.ResponseError
												? $(Je, b.method, ke)
												: Je && ze.string(Je.message)
													? $(
															new Q.ResponseError(
																Q.ErrorCodes.InternalError,
																`Request ${b.method} failed with message: ${Je.message}`,
															),
															b.method,
															ke,
														)
													: $(
															new Q.ResponseError(
																Q.ErrorCodes.InternalError,
																`Request ${b.method} failed unexpectedly without providing any details.`,
															),
															b.method,
															ke,
														));
									},
								)
							: (L.delete(oe), I(fe, b.method, ke))
						: (L.delete(oe), U(fe, b.method, ke));
				} catch (fe) {
					(L.delete(oe),
						fe instanceof Q.ResponseError
							? I(fe, b.method, ke)
							: fe && ze.string(fe.message)
								? $(
										new Q.ResponseError(
											Q.ErrorCodes.InternalError,
											`Request ${b.method} failed with message: ${fe.message}`,
										),
										b.method,
										ke,
									)
								: $(
										new Q.ResponseError(
											Q.ErrorCodes.InternalError,
											`Request ${b.method} failed unexpectedly without providing any details.`,
										),
										b.method,
										ke,
									));
				}
			} else
				$(
					new Q.ResponseError(Q.ErrorCodes.MethodNotFound, `Unhandled method ${b.method}`),
					b.method,
					ke,
				);
		}
		function mn(b) {
			if (!Ft())
				if (b.id === null)
					b.error
						? i.error(`Received response message without id: Error is: 
${JSON.stringify(b.error, void 0, 4)}`)
						: i.error(
								'Received response message without id. No further error information provided.',
							);
				else {
					let I = b.id,
						$ = q.get(I);
					if ((Fn(b, $), $ !== void 0)) {
						q.delete(I);
						try {
							if (b.error) {
								let U = b.error;
								$.reject(new Q.ResponseError(U.code, U.message, U.data));
							} else if (b.result !== void 0) $.resolve(b.result);
							else throw new Error('Should never happen.');
						} catch (U) {
							U.message
								? i.error(`Response handler '${$.method}' failed with message: ${U.message}`)
								: i.error(`Response handler '${$.method}' failed unexpectedly.`);
						}
					}
				}
		}
		function vn(b) {
			if (Ft()) return;
			let I, $;
			if (b.method === $i.type.method) {
				let U = b.params.id;
				(N.delete(U), rn(b));
				return;
			} else {
				let U = g.get(b.method);
				U && (($ = U.handler), (I = U.type));
			}
			if ($ || m)
				try {
					if ((rn(b), $))
						if (b.params === void 0)
							(I !== void 0 &&
								I.numberOfParams !== 0 &&
								I.parameterStructures !== Q.ParameterStructures.byName &&
								i.error(
									`Notification ${b.method} defines ${I.numberOfParams} params but received none.`,
								),
								$());
						else if (Array.isArray(b.params)) {
							let U = b.params;
							b.method === Ai.type.method && U.length === 2 && oc.is(U[0])
								? $({ token: U[0], value: U[1] })
								: (I !== void 0 &&
										(I.parameterStructures === Q.ParameterStructures.byName &&
											i.error(
												`Notification ${b.method} defines parameters by name but received parameters by position`,
											),
										I.numberOfParams !== b.params.length &&
											i.error(
												`Notification ${b.method} defines ${I.numberOfParams} params but received ${U.length} arguments`,
											)),
									$(...U));
						} else
							(I !== void 0 &&
								I.parameterStructures === Q.ParameterStructures.byPosition &&
								i.error(
									`Notification ${b.method} defines parameters by position but received parameters by name`,
								),
								$(b.params));
					else m && m(b.method, b.params);
				} catch (U) {
					U.message
						? i.error(`Notification handler '${b.method}' failed with message: ${U.message}`)
						: i.error(`Notification handler '${b.method}' failed unexpectedly.`);
				}
			else ce.fire(b);
		}
		function On(b) {
			if (!b) {
				i.error('Received empty message.');
				return;
			}
			i.error(`Received message which is neither a response nor a notification message:
${JSON.stringify(b, null, 4)}`);
			let I = b;
			if (ze.string(I.id) || ze.number(I.id)) {
				let $ = I.id,
					U = q.get($);
				U &&
					U.reject(new Error('The received response has neither a result nor an error property.'));
			}
		}
		function it(b) {
			if (b != null)
				switch (M) {
					case De.Verbose:
						return JSON.stringify(b, null, 4);
					case De.Compact:
						return JSON.stringify(b);
					default:
						return;
				}
		}
		function Bn(b) {
			if (!(M === De.Off || !X))
				if (H === Gt.Text) {
					let I;
					((M === De.Verbose || M === De.Compact) &&
						b.params &&
						(I = `Params: ${it(b.params)}

`),
						X.log(`Sending request '${b.method} - (${b.id})'.`, I));
				} else tt('send-request', b);
		}
		function yn(b) {
			if (!(M === De.Off || !X))
				if (H === Gt.Text) {
					let I;
					((M === De.Verbose || M === De.Compact) &&
						(b.params
							? (I = `Params: ${it(b.params)}

`)
							: (I = `No parameters provided.

`)),
						X.log(`Sending notification '${b.method}'.`, I));
				} else tt('send-notification', b);
		}
		function nn(b, I, $) {
			if (!(M === De.Off || !X))
				if (H === Gt.Text) {
					let U;
					((M === De.Verbose || M === De.Compact) &&
						(b.error && b.error.data
							? (U = `Error data: ${it(b.error.data)}

`)
							: b.result
								? (U = `Result: ${it(b.result)}

`)
								: b.error === void 0 &&
									(U = `No result returned.

`)),
						X.log(
							`Sending response '${I} - (${b.id})'. Processing request took ${Date.now() - $}ms`,
							U,
						));
				} else tt('send-response', b);
		}
		function lr(b) {
			if (!(M === De.Off || !X))
				if (H === Gt.Text) {
					let I;
					((M === De.Verbose || M === De.Compact) &&
						b.params &&
						(I = `Params: ${it(b.params)}

`),
						X.log(`Received request '${b.method} - (${b.id})'.`, I));
				} else tt('receive-request', b);
		}
		function rn(b) {
			if (!(M === De.Off || !X || b.method === ks.type.method))
				if (H === Gt.Text) {
					let I;
					((M === De.Verbose || M === De.Compact) &&
						(b.params
							? (I = `Params: ${it(b.params)}

`)
							: (I = `No parameters provided.

`)),
						X.log(`Received notification '${b.method}'.`, I));
				} else tt('receive-notification', b);
		}
		function Fn(b, I) {
			if (!(M === De.Off || !X))
				if (H === Gt.Text) {
					let $;
					if (
						((M === De.Verbose || M === De.Compact) &&
							(b.error && b.error.data
								? ($ = `Error data: ${it(b.error.data)}

`)
								: b.result
									? ($ = `Result: ${it(b.result)}

`)
									: b.error === void 0 &&
										($ = `No result returned.

`)),
						I)
					) {
						let U = b.error ? ` Request failed: ${b.error.message} (${b.error.code}).` : '';
						X.log(
							`Received response '${I.method} - (${b.id})' in ${Date.now() - I.timerStart}ms.${U}`,
							$,
						);
					} else X.log(`Received response ${b.id} without active response promise.`, $);
				} else tt('receive-response', b);
		}
		function tt(b, I) {
			if (!X || M === De.Off) return;
			let $ = { isLSPMessage: !0, type: b, message: I, timestamp: Date.now() };
			X.log($);
		}
		function bt() {
			if (Me()) throw new vr(ji.Closed, 'Connection is closed.');
			if (Ft()) throw new vr(ji.Disposed, 'Connection is disposed.');
		}
		function vt() {
			if (En()) throw new vr(ji.AlreadyListening, 'Connection is already listening');
		}
		function Vt() {
			if (!En()) throw new Error('Call listen() first.');
		}
		function Nt(b) {
			return b === void 0 ? null : b;
		}
		function Nn(b) {
			if (b !== null) return b;
		}
		function Gn(b) {
			return b != null && !Array.isArray(b) && typeof b == 'object';
		}
		function Cn(b, I) {
			switch (b) {
				case Q.ParameterStructures.auto:
					return Gn(I) ? Nn(I) : [Nt(I)];
				case Q.ParameterStructures.byName:
					if (!Gn(I))
						throw new Error('Received parameters by name but param is not an object literal.');
					return Nn(I);
				case Q.ParameterStructures.byPosition:
					return [Nt(I)];
				default:
					throw new Error(`Unknown parameter structure ${b.toString()}`);
			}
		}
		function Xn(b, I) {
			let $,
				U = b.numberOfParams;
			switch (U) {
				case 0:
					$ = void 0;
					break;
				case 1:
					$ = Cn(b.parameterStructures, I[0]);
					break;
				default:
					$ = [];
					for (let Ce = 0; Ce < I.length && Ce < U; Ce++) $.push(Nt(I[Ce]));
					if (I.length < U) for (let Ce = I.length; Ce < U; Ce++) $.push(null);
					break;
			}
			return $;
		}
		let kt = {
			sendNotification: (b, ...I) => {
				bt();
				let $, U;
				if (ze.string(b)) {
					$ = b;
					let ve = I[0],
						Pe = 0,
						ke = Q.ParameterStructures.auto;
					Q.ParameterStructures.is(ve) && ((Pe = 1), (ke = ve));
					let oe = I.length,
						_e = oe - Pe;
					switch (_e) {
						case 0:
							U = void 0;
							break;
						case 1:
							U = Cn(ke, I[Pe]);
							break;
						default:
							if (ke === Q.ParameterStructures.byName)
								throw new Error(
									`Received ${_e} parameters for 'by Name' notification parameter structure.`,
								);
							U = I.slice(Pe, oe).map((fe) => Nt(fe));
							break;
					}
				} else {
					let ve = I;
					(($ = b.method), (U = Xn(b, ve)));
				}
				let Ce = { jsonrpc: u, method: $, params: U };
				return (
					yn(Ce),
					e.write(Ce).catch((ve) => {
						throw (i.error('Sending notification failed.'), ve);
					})
				);
			},
			onNotification: (b, I) => {
				bt();
				let $;
				return (
					ze.func(b)
						? (m = b)
						: I &&
							(ze.string(b)
								? (($ = b), g.set(b, { type: void 0, handler: I }))
								: (($ = b.method), g.set(b.method, { type: b, handler: I }))),
					{
						dispose: () => {
							$ !== void 0 ? g.delete($) : (m = void 0);
						},
					}
				);
			},
			onProgress: (b, I, $) => {
				if (D.has(I)) throw new Error(`Progress handler for token ${I} already registered`);
				return (
					D.set(I, $),
					{
						dispose: () => {
							D.delete(I);
						},
					}
				);
			},
			sendProgress: (b, I, $) => kt.sendNotification(Ai.type, { token: I, value: $ }),
			onUnhandledProgress: et.event,
			sendRequest: (b, ...I) => {
				(bt(), Vt());
				let $, U, Ce;
				if (ze.string(b)) {
					$ = b;
					let oe = I[0],
						_e = I[I.length - 1],
						fe = 0,
						xe = Q.ParameterStructures.auto;
					Q.ParameterStructures.is(oe) && ((fe = 1), (xe = oe));
					let Je = I.length;
					sc.CancellationToken.is(_e) && ((Je = Je - 1), (Ce = _e));
					let ct = Je - fe;
					switch (ct) {
						case 0:
							U = void 0;
							break;
						case 1:
							U = Cn(xe, I[fe]);
							break;
						default:
							if (xe === Q.ParameterStructures.byName)
								throw new Error(
									`Received ${ct} parameters for 'by Name' request parameter structure.`,
								);
							U = I.slice(fe, Je).map((dr) => Nt(dr));
							break;
					}
				} else {
					let oe = I;
					(($ = b.method), (U = Xn(b, oe)));
					let _e = b.numberOfParams;
					Ce = sc.CancellationToken.is(oe[_e]) ? oe[_e] : void 0;
				}
				let ve = s++,
					Pe;
				Ce &&
					(Pe = Ce.onCancellationRequested(() => {
						let oe = rt.sender.sendCancellation(kt, ve);
						return oe === void 0
							? (i.log(`Received no promise from cancellation strategy when cancelling id ${ve}`),
								Promise.resolve())
							: oe.catch(() => {
									i.log(`Sending cancellation messages for id ${ve} failed`);
								});
					}));
				let ke = { jsonrpc: u, id: ve, method: $, params: U };
				return (
					Bn(ke),
					typeof rt.sender.enableCancellation == 'function' && rt.sender.enableCancellation(ke),
					new Promise(async (oe, _e) => {
						let fe = (ct) => {
								(oe(ct), rt.sender.cleanup(ve), Pe?.dispose());
							},
							xe = (ct) => {
								(_e(ct), rt.sender.cleanup(ve), Pe?.dispose());
							},
							Je = { method: $, timerStart: Date.now(), resolve: fe, reject: xe };
						try {
							(await e.write(ke), q.set(ve, Je));
						} catch (ct) {
							throw (
								i.error('Sending request failed.'),
								Je.reject(
									new Q.ResponseError(
										Q.ErrorCodes.MessageWriteError,
										ct.message ? ct.message : 'Unknown reason',
									),
								),
								ct
							);
						}
					})
				);
			},
			onRequest: (b, I) => {
				bt();
				let $ = null;
				return (
					cc.is(b)
						? (($ = void 0), (l = b))
						: ze.string(b)
							? (($ = null), I !== void 0 && (($ = b), p.set(b, { handler: I, type: void 0 })))
							: I !== void 0 && (($ = b.method), p.set(b.method, { type: b, handler: I })),
					{
						dispose: () => {
							$ !== null && ($ !== void 0 ? p.delete($) : (l = void 0));
						},
					}
				);
			},
			hasPendingResponse: () => q.size > 0,
			trace: async (b, I, $) => {
				let U = !1,
					Ce = Gt.Text;
				($ !== void 0 &&
					(ze.boolean($)
						? (U = $)
						: ((U = $.sendNotification || !1), (Ce = $.traceFormat || Gt.Text))),
					(M = b),
					(H = Ce),
					M === De.Off ? (X = void 0) : (X = I),
					U && !Me() && !Ft() && (await kt.sendNotification(uc.type, { value: De.toString(b) })));
			},
			onError: B.event,
			onClose: Z.event,
			onUnhandledNotification: ce.event,
			onDispose: Xe.event,
			end: () => {
				e.end();
			},
			dispose: () => {
				if (Ft()) return;
				((de = _n.Disposed), Xe.fire(void 0));
				let b = new Q.ResponseError(
					Q.ErrorCodes.PendingResponseRejected,
					'Pending response rejected since connection got disposed',
				);
				for (let I of q.values()) I.reject(b);
				((q = new Map()),
					(L = new Map()),
					(N = new Set()),
					(P = new Ef.LinkedMap()),
					ze.func(e.dispose) && e.dispose(),
					ze.func(n.dispose) && n.dispose());
			},
			listen: () => {
				(bt(), vt(), (de = _n.Listening), n.listen(ur));
			},
			inspect: () => {
				(0, qf.default)().console.log('inspect');
			},
		};
		return (
			kt.onNotification(ks.type, (b) => {
				if (M === De.Off || !X) return;
				let I = M === De.Verbose || M === De.Compact;
				X.log(b.message, I ? b.verbose : void 0);
			}),
			kt.onNotification(Ai.type, (b) => {
				let I = D.get(b.token);
				I ? I(b.value) : et.fire(b);
			}),
			kt
		);
	}
	re.createMessageConnection = VC;
});
var Ms = E((x) => {
	'use strict';
	Object.defineProperty(x, '__esModule', { value: !0 });
	x.ProgressType =
		x.ProgressToken =
		x.createMessageConnection =
		x.NullLogger =
		x.ConnectionOptions =
		x.ConnectionStrategy =
		x.AbstractMessageBuffer =
		x.WriteableStreamMessageWriter =
		x.AbstractMessageWriter =
		x.MessageWriter =
		x.ReadableStreamMessageReader =
		x.AbstractMessageReader =
		x.MessageReader =
		x.SharedArrayReceiverStrategy =
		x.SharedArraySenderStrategy =
		x.CancellationToken =
		x.CancellationTokenSource =
		x.Emitter =
		x.Event =
		x.Disposable =
		x.LRUCache =
		x.Touch =
		x.LinkedMap =
		x.ParameterStructures =
		x.NotificationType9 =
		x.NotificationType8 =
		x.NotificationType7 =
		x.NotificationType6 =
		x.NotificationType5 =
		x.NotificationType4 =
		x.NotificationType3 =
		x.NotificationType2 =
		x.NotificationType1 =
		x.NotificationType0 =
		x.NotificationType =
		x.ErrorCodes =
		x.ResponseError =
		x.RequestType9 =
		x.RequestType8 =
		x.RequestType7 =
		x.RequestType6 =
		x.RequestType5 =
		x.RequestType4 =
		x.RequestType3 =
		x.RequestType2 =
		x.RequestType1 =
		x.RequestType0 =
		x.RequestType =
		x.Message =
		x.RAL =
			void 0;
	x.MessageStrategy =
		x.CancellationStrategy =
		x.CancellationSenderStrategy =
		x.CancellationReceiverStrategy =
		x.ConnectionError =
		x.ConnectionErrors =
		x.LogTraceNotification =
		x.SetTraceNotification =
		x.TraceFormat =
		x.TraceValues =
		x.Trace =
			void 0;
	var Le = La();
	Object.defineProperty(x, 'Message', {
		enumerable: !0,
		get: function () {
			return Le.Message;
		},
	});
	Object.defineProperty(x, 'RequestType', {
		enumerable: !0,
		get: function () {
			return Le.RequestType;
		},
	});
	Object.defineProperty(x, 'RequestType0', {
		enumerable: !0,
		get: function () {
			return Le.RequestType0;
		},
	});
	Object.defineProperty(x, 'RequestType1', {
		enumerable: !0,
		get: function () {
			return Le.RequestType1;
		},
	});
	Object.defineProperty(x, 'RequestType2', {
		enumerable: !0,
		get: function () {
			return Le.RequestType2;
		},
	});
	Object.defineProperty(x, 'RequestType3', {
		enumerable: !0,
		get: function () {
			return Le.RequestType3;
		},
	});
	Object.defineProperty(x, 'RequestType4', {
		enumerable: !0,
		get: function () {
			return Le.RequestType4;
		},
	});
	Object.defineProperty(x, 'RequestType5', {
		enumerable: !0,
		get: function () {
			return Le.RequestType5;
		},
	});
	Object.defineProperty(x, 'RequestType6', {
		enumerable: !0,
		get: function () {
			return Le.RequestType6;
		},
	});
	Object.defineProperty(x, 'RequestType7', {
		enumerable: !0,
		get: function () {
			return Le.RequestType7;
		},
	});
	Object.defineProperty(x, 'RequestType8', {
		enumerable: !0,
		get: function () {
			return Le.RequestType8;
		},
	});
	Object.defineProperty(x, 'RequestType9', {
		enumerable: !0,
		get: function () {
			return Le.RequestType9;
		},
	});
	Object.defineProperty(x, 'ResponseError', {
		enumerable: !0,
		get: function () {
			return Le.ResponseError;
		},
	});
	Object.defineProperty(x, 'ErrorCodes', {
		enumerable: !0,
		get: function () {
			return Le.ErrorCodes;
		},
	});
	Object.defineProperty(x, 'NotificationType', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType;
		},
	});
	Object.defineProperty(x, 'NotificationType0', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType0;
		},
	});
	Object.defineProperty(x, 'NotificationType1', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType1;
		},
	});
	Object.defineProperty(x, 'NotificationType2', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType2;
		},
	});
	Object.defineProperty(x, 'NotificationType3', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType3;
		},
	});
	Object.defineProperty(x, 'NotificationType4', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType4;
		},
	});
	Object.defineProperty(x, 'NotificationType5', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType5;
		},
	});
	Object.defineProperty(x, 'NotificationType6', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType6;
		},
	});
	Object.defineProperty(x, 'NotificationType7', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType7;
		},
	});
	Object.defineProperty(x, 'NotificationType8', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType8;
		},
	});
	Object.defineProperty(x, 'NotificationType9', {
		enumerable: !0,
		get: function () {
			return Le.NotificationType9;
		},
	});
	Object.defineProperty(x, 'ParameterStructures', {
		enumerable: !0,
		get: function () {
			return Le.ParameterStructures;
		},
	});
	var fc = ja();
	Object.defineProperty(x, 'LinkedMap', {
		enumerable: !0,
		get: function () {
			return fc.LinkedMap;
		},
	});
	Object.defineProperty(x, 'LRUCache', {
		enumerable: !0,
		get: function () {
			return fc.LRUCache;
		},
	});
	Object.defineProperty(x, 'Touch', {
		enumerable: !0,
		get: function () {
			return fc.Touch;
		},
	});
	var BC = vf();
	Object.defineProperty(x, 'Disposable', {
		enumerable: !0,
		get: function () {
			return BC.Disposable;
		},
	});
	var Of = Zr();
	Object.defineProperty(x, 'Event', {
		enumerable: !0,
		get: function () {
			return Of.Event;
		},
	});
	Object.defineProperty(x, 'Emitter', {
		enumerable: !0,
		get: function () {
			return Of.Emitter;
		},
	});
	var Ff = Ss();
	Object.defineProperty(x, 'CancellationTokenSource', {
		enumerable: !0,
		get: function () {
			return Ff.CancellationTokenSource;
		},
	});
	Object.defineProperty(x, 'CancellationToken', {
		enumerable: !0,
		get: function () {
			return Ff.CancellationToken;
		},
	});
	var Nf = Cf();
	Object.defineProperty(x, 'SharedArraySenderStrategy', {
		enumerable: !0,
		get: function () {
			return Nf.SharedArraySenderStrategy;
		},
	});
	Object.defineProperty(x, 'SharedArrayReceiverStrategy', {
		enumerable: !0,
		get: function () {
			return Nf.SharedArrayReceiverStrategy;
		},
	});
	var hc = _f();
	Object.defineProperty(x, 'MessageReader', {
		enumerable: !0,
		get: function () {
			return hc.MessageReader;
		},
	});
	Object.defineProperty(x, 'AbstractMessageReader', {
		enumerable: !0,
		get: function () {
			return hc.AbstractMessageReader;
		},
	});
	Object.defineProperty(x, 'ReadableStreamMessageReader', {
		enumerable: !0,
		get: function () {
			return hc.ReadableStreamMessageReader;
		},
	});
	var pc = Tf();
	Object.defineProperty(x, 'MessageWriter', {
		enumerable: !0,
		get: function () {
			return pc.MessageWriter;
		},
	});
	Object.defineProperty(x, 'AbstractMessageWriter', {
		enumerable: !0,
		get: function () {
			return pc.AbstractMessageWriter;
		},
	});
	Object.defineProperty(x, 'WriteableStreamMessageWriter', {
		enumerable: !0,
		get: function () {
			return pc.WriteableStreamMessageWriter;
		},
	});
	var GC = Pf();
	Object.defineProperty(x, 'AbstractMessageBuffer', {
		enumerable: !0,
		get: function () {
			return GC.AbstractMessageBuffer;
		},
	});
	var Ct = If();
	Object.defineProperty(x, 'ConnectionStrategy', {
		enumerable: !0,
		get: function () {
			return Ct.ConnectionStrategy;
		},
	});
	Object.defineProperty(x, 'ConnectionOptions', {
		enumerable: !0,
		get: function () {
			return Ct.ConnectionOptions;
		},
	});
	Object.defineProperty(x, 'NullLogger', {
		enumerable: !0,
		get: function () {
			return Ct.NullLogger;
		},
	});
	Object.defineProperty(x, 'createMessageConnection', {
		enumerable: !0,
		get: function () {
			return Ct.createMessageConnection;
		},
	});
	Object.defineProperty(x, 'ProgressToken', {
		enumerable: !0,
		get: function () {
			return Ct.ProgressToken;
		},
	});
	Object.defineProperty(x, 'ProgressType', {
		enumerable: !0,
		get: function () {
			return Ct.ProgressType;
		},
	});
	Object.defineProperty(x, 'Trace', {
		enumerable: !0,
		get: function () {
			return Ct.Trace;
		},
	});
	Object.defineProperty(x, 'TraceValues', {
		enumerable: !0,
		get: function () {
			return Ct.TraceValues;
		},
	});
	Object.defineProperty(x, 'TraceFormat', {
		enumerable: !0,
		get: function () {
			return Ct.TraceFormat;
		},
	});
	Object.defineProperty(x, 'SetTraceNotification', {
		enumerable: !0,
		get: function () {
			return Ct.SetTraceNotification;
		},
	});
	Object.defineProperty(x, 'LogTraceNotification', {
		enumerable: !0,
		get: function () {
			return Ct.LogTraceNotification;
		},
	});
	Object.defineProperty(x, 'ConnectionErrors', {
		enumerable: !0,
		get: function () {
			return Ct.ConnectionErrors;
		},
	});
	Object.defineProperty(x, 'ConnectionError', {
		enumerable: !0,
		get: function () {
			return Ct.ConnectionError;
		},
	});
	Object.defineProperty(x, 'CancellationReceiverStrategy', {
		enumerable: !0,
		get: function () {
			return Ct.CancellationReceiverStrategy;
		},
	});
	Object.defineProperty(x, 'CancellationSenderStrategy', {
		enumerable: !0,
		get: function () {
			return Ct.CancellationSenderStrategy;
		},
	});
	Object.defineProperty(x, 'CancellationStrategy', {
		enumerable: !0,
		get: function () {
			return Ct.CancellationStrategy;
		},
	});
	Object.defineProperty(x, 'MessageStrategy', {
		enumerable: !0,
		get: function () {
			return Ct.MessageStrategy;
		},
	});
	var XC = pr();
	x.RAL = XC.default;
});
var Af = E((yc) => {
	'use strict';
	Object.defineProperty(yc, '__esModule', { value: !0 });
	var Mf = require('util'),
		Jn = Ms(),
		ri = class extends Jn.AbstractMessageBuffer {
			constructor(e = 'utf-8') {
				super(e);
			}
			emptyBuffer() {
				return ri.emptyBuffer;
			}
			fromString(e, t) {
				return Buffer.from(e, t);
			}
			toString(e, t) {
				return e instanceof Buffer ? e.toString(t) : new Mf.TextDecoder(t).decode(e);
			}
			asNative(e, t) {
				return t === void 0
					? e instanceof Buffer
						? e
						: Buffer.from(e)
					: e instanceof Buffer
						? e.slice(0, t)
						: Buffer.from(e, 0, t);
			}
			allocNative(e) {
				return Buffer.allocUnsafe(e);
			}
		};
	ri.emptyBuffer = Buffer.allocUnsafe(0);
	var gc = class {
			constructor(e) {
				this.stream = e;
			}
			onClose(e) {
				return (
					this.stream.on('close', e),
					Jn.Disposable.create(() => this.stream.off('close', e))
				);
			}
			onError(e) {
				return (
					this.stream.on('error', e),
					Jn.Disposable.create(() => this.stream.off('error', e))
				);
			}
			onEnd(e) {
				return (this.stream.on('end', e), Jn.Disposable.create(() => this.stream.off('end', e)));
			}
			onData(e) {
				return (this.stream.on('data', e), Jn.Disposable.create(() => this.stream.off('data', e)));
			}
		},
		mc = class {
			constructor(e) {
				this.stream = e;
			}
			onClose(e) {
				return (
					this.stream.on('close', e),
					Jn.Disposable.create(() => this.stream.off('close', e))
				);
			}
			onError(e) {
				return (
					this.stream.on('error', e),
					Jn.Disposable.create(() => this.stream.off('error', e))
				);
			}
			onEnd(e) {
				return (this.stream.on('end', e), Jn.Disposable.create(() => this.stream.off('end', e)));
			}
			write(e, t) {
				return new Promise((r, i) => {
					let s = (o) => {
						o == null ? r() : i(o);
					};
					typeof e == 'string' ? this.stream.write(e, t, s) : this.stream.write(e, s);
				});
			}
			end() {
				this.stream.end();
			}
		},
		Lf = Object.freeze({
			messageBuffer: Object.freeze({ create: (n) => new ri(n) }),
			applicationJson: Object.freeze({
				encoder: Object.freeze({
					name: 'application/json',
					encode: (n, e) => {
						try {
							return Promise.resolve(Buffer.from(JSON.stringify(n, void 0, 0), e.charset));
						} catch (t) {
							return Promise.reject(t);
						}
					},
				}),
				decoder: Object.freeze({
					name: 'application/json',
					decode: (n, e) => {
						try {
							return n instanceof Buffer
								? Promise.resolve(JSON.parse(n.toString(e.charset)))
								: Promise.resolve(JSON.parse(new Mf.TextDecoder(e.charset).decode(n)));
						} catch (t) {
							return Promise.reject(t);
						}
					},
				}),
			}),
			stream: Object.freeze({
				asReadableStream: (n) => new gc(n),
				asWritableStream: (n) => new mc(n),
			}),
			console,
			timer: Object.freeze({
				setTimeout(n, e, ...t) {
					let r = setTimeout(n, e, ...t);
					return { dispose: () => clearTimeout(r) };
				},
				setImmediate(n, ...e) {
					let t = setImmediate(n, ...e);
					return { dispose: () => clearImmediate(t) };
				},
				setInterval(n, e, ...t) {
					let r = setInterval(n, e, ...t);
					return { dispose: () => clearInterval(r) };
				},
			}),
		});
	function vc() {
		return Lf;
	}
	(function (n) {
		function e() {
			Jn.RAL.install(Lf);
		}
		n.install = e;
	})(vc || (vc = {}));
	yc.default = vc;
});
var Fr = E((me) => {
	'use strict';
	var JC =
			(me && me.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		QC =
			(me && me.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && JC(e, n, t);
			};
	Object.defineProperty(me, '__esModule', { value: !0 });
	me.createMessageConnection =
		me.createServerSocketTransport =
		me.createClientSocketTransport =
		me.createServerPipeTransport =
		me.createClientPipeTransport =
		me.generateRandomPipeName =
		me.StreamMessageWriter =
		me.StreamMessageReader =
		me.SocketMessageWriter =
		me.SocketMessageReader =
		me.PortMessageWriter =
		me.PortMessageReader =
		me.IPCMessageWriter =
		me.IPCMessageReader =
			void 0;
	var ii = Af();
	ii.default.install();
	var jf = require('path'),
		YC = require('os'),
		ZC = require('crypto'),
		js = require('net'),
		Xt = Ms();
	QC(Ms(), me);
	var Cc = class extends Xt.AbstractMessageReader {
		constructor(e) {
			(super(), (this.process = e));
			let t = this.process;
			(t.on('error', (r) => this.fireError(r)), t.on('close', () => this.fireClose()));
		}
		listen(e) {
			return (
				this.process.on('message', e),
				Xt.Disposable.create(() => this.process.off('message', e))
			);
		}
	};
	me.IPCMessageReader = Cc;
	var bc = class extends Xt.AbstractMessageWriter {
		constructor(e) {
			(super(), (this.process = e), (this.errorCount = 0));
			let t = this.process;
			(t.on('error', (r) => this.fireError(r)), t.on('close', () => this.fireClose));
		}
		write(e) {
			try {
				return (
					typeof this.process.send == 'function' &&
						this.process.send(e, void 0, void 0, (t) => {
							t ? (this.errorCount++, this.handleError(t, e)) : (this.errorCount = 0);
						}),
					Promise.resolve()
				);
			} catch (t) {
				return (this.handleError(t, e), Promise.reject(t));
			}
		}
		handleError(e, t) {
			(this.errorCount++, this.fireError(e, t, this.errorCount));
		}
		end() {}
	};
	me.IPCMessageWriter = bc;
	var _c = class extends Xt.AbstractMessageReader {
		constructor(e) {
			(super(),
				(this.onData = new Xt.Emitter()),
				e.on('close', () => this.fireClose),
				e.on('error', (t) => this.fireError(t)),
				e.on('message', (t) => {
					this.onData.fire(t);
				}));
		}
		listen(e) {
			return this.onData.event(e);
		}
	};
	me.PortMessageReader = _c;
	var wc = class extends Xt.AbstractMessageWriter {
		constructor(e) {
			(super(),
				(this.port = e),
				(this.errorCount = 0),
				e.on('close', () => this.fireClose()),
				e.on('error', (t) => this.fireError(t)));
		}
		write(e) {
			try {
				return (this.port.postMessage(e), Promise.resolve());
			} catch (t) {
				return (this.handleError(t, e), Promise.reject(t));
			}
		}
		handleError(e, t) {
			(this.errorCount++, this.fireError(e, t, this.errorCount));
		}
		end() {}
	};
	me.PortMessageWriter = wc;
	var Ir = class extends Xt.ReadableStreamMessageReader {
		constructor(e, t = 'utf-8') {
			super((0, ii.default)().stream.asReadableStream(e), t);
		}
	};
	me.SocketMessageReader = Ir;
	var Or = class extends Xt.WriteableStreamMessageWriter {
		constructor(e, t) {
			(super((0, ii.default)().stream.asWritableStream(e), t), (this.socket = e));
		}
		dispose() {
			(super.dispose(), this.socket.destroy());
		}
	};
	me.SocketMessageWriter = Or;
	var Ls = class extends Xt.ReadableStreamMessageReader {
		constructor(e, t) {
			super((0, ii.default)().stream.asReadableStream(e), t);
		}
	};
	me.StreamMessageReader = Ls;
	var As = class extends Xt.WriteableStreamMessageWriter {
		constructor(e, t) {
			super((0, ii.default)().stream.asWritableStream(e), t);
		}
	};
	me.StreamMessageWriter = As;
	var $f = process.env.XDG_RUNTIME_DIR,
		eb = new Map([
			['linux', 107],
			['darwin', 103],
		]);
	function tb() {
		let n = (0, ZC.randomBytes)(21).toString('hex');
		if (process.platform === 'win32') return `\\\\.\\pipe\\vscode-jsonrpc-${n}-sock`;
		let e;
		$f ? (e = jf.join($f, `vscode-ipc-${n}.sock`)) : (e = jf.join(YC.tmpdir(), `vscode-${n}.sock`));
		let t = eb.get(process.platform);
		return (
			t !== void 0 &&
				e.length > t &&
				(0, ii.default)().console.warn(
					`WARNING: IPC handle "${e}" is longer than ${t} characters.`,
				),
			e
		);
	}
	me.generateRandomPipeName = tb;
	function nb(n, e = 'utf-8') {
		let t,
			r = new Promise((i, s) => {
				t = i;
			});
		return new Promise((i, s) => {
			let o = (0, js.createServer)((a) => {
				(o.close(), t([new Ir(a, e), new Or(a, e)]));
			});
			(o.on('error', s),
				o.listen(n, () => {
					(o.removeListener('error', s), i({ onConnected: () => r }));
				}));
		});
	}
	me.createClientPipeTransport = nb;
	function rb(n, e = 'utf-8') {
		let t = (0, js.createConnection)(n);
		return [new Ir(t, e), new Or(t, e)];
	}
	me.createServerPipeTransport = rb;
	function ib(n, e = 'utf-8') {
		let t,
			r = new Promise((i, s) => {
				t = i;
			});
		return new Promise((i, s) => {
			let o = (0, js.createServer)((a) => {
				(o.close(), t([new Ir(a, e), new Or(a, e)]));
			});
			(o.on('error', s),
				o.listen(n, '127.0.0.1', () => {
					(o.removeListener('error', s), i({ onConnected: () => r }));
				}));
		});
	}
	me.createClientSocketTransport = ib;
	function sb(n, e = 'utf-8') {
		let t = (0, js.createConnection)(n, '127.0.0.1');
		return [new Ir(t, e), new Or(t, e)];
	}
	me.createServerSocketTransport = sb;
	function ob(n) {
		let e = n;
		return e.read !== void 0 && e.addListener !== void 0;
	}
	function ab(n) {
		let e = n;
		return e.write !== void 0 && e.addListener !== void 0;
	}
	function cb(n, e, t, r) {
		t || (t = Xt.NullLogger);
		let i = ob(n) ? new Ls(n) : n,
			s = ab(e) ? new As(e) : e;
		return (
			Xt.ConnectionStrategy.is(r) && (r = { connectionStrategy: r }),
			(0, Xt.createMessageConnection)(i, s, t, r)
		);
	}
	me.createMessageConnection = cb;
});
var Dc = E((QS, Hf) => {
	'use strict';
	Hf.exports = Fr();
});
var Hs = E((Wf, $s) => {
	(function (n) {
		if (typeof $s == 'object' && typeof $s.exports == 'object') {
			var e = n(require, Wf);
			e !== void 0 && ($s.exports = e);
		} else typeof define == 'function' && define.amd && define(['require', 'exports'], n);
	})(function (n, e) {
		'use strict';
		(Object.defineProperty(e, '__esModule', { value: !0 }),
			(e.TextDocument =
				e.EOL =
				e.WorkspaceFolder =
				e.InlineCompletionContext =
				e.SelectedCompletionInfo =
				e.InlineCompletionTriggerKind =
				e.InlineCompletionList =
				e.InlineCompletionItem =
				e.StringValue =
				e.InlayHint =
				e.InlayHintLabelPart =
				e.InlayHintKind =
				e.InlineValueContext =
				e.InlineValueEvaluatableExpression =
				e.InlineValueVariableLookup =
				e.InlineValueText =
				e.SemanticTokens =
				e.SemanticTokenModifiers =
				e.SemanticTokenTypes =
				e.SelectionRange =
				e.DocumentLink =
				e.FormattingOptions =
				e.CodeLens =
				e.CodeAction =
				e.CodeActionContext =
				e.CodeActionTriggerKind =
				e.CodeActionKind =
				e.DocumentSymbol =
				e.WorkspaceSymbol =
				e.SymbolInformation =
				e.SymbolTag =
				e.SymbolKind =
				e.DocumentHighlight =
				e.DocumentHighlightKind =
				e.SignatureInformation =
				e.ParameterInformation =
				e.Hover =
				e.MarkedString =
				e.CompletionList =
				e.CompletionItem =
				e.CompletionItemLabelDetails =
				e.InsertTextMode =
				e.InsertReplaceEdit =
				e.CompletionItemTag =
				e.InsertTextFormat =
				e.CompletionItemKind =
				e.MarkupContent =
				e.MarkupKind =
				e.TextDocumentItem =
				e.OptionalVersionedTextDocumentIdentifier =
				e.VersionedTextDocumentIdentifier =
				e.TextDocumentIdentifier =
				e.WorkspaceChange =
				e.WorkspaceEdit =
				e.DeleteFile =
				e.RenameFile =
				e.CreateFile =
				e.TextDocumentEdit =
				e.AnnotatedTextEdit =
				e.ChangeAnnotationIdentifier =
				e.ChangeAnnotation =
				e.TextEdit =
				e.Command =
				e.Diagnostic =
				e.CodeDescription =
				e.DiagnosticTag =
				e.DiagnosticSeverity =
				e.DiagnosticRelatedInformation =
				e.FoldingRange =
				e.FoldingRangeKind =
				e.ColorPresentation =
				e.ColorInformation =
				e.Color =
				e.LocationLink =
				e.Location =
				e.Range =
				e.Position =
				e.uinteger =
				e.integer =
				e.URI =
				e.DocumentUri =
					void 0));
		var t;
		(function (h) {
			function _(w) {
				return typeof w == 'string';
			}
			h.is = _;
		})(t || (e.DocumentUri = t = {}));
		var r;
		(function (h) {
			function _(w) {
				return typeof w == 'string';
			}
			h.is = _;
		})(r || (e.URI = r = {}));
		var i;
		(function (h) {
			((h.MIN_VALUE = -2147483648), (h.MAX_VALUE = 2147483647));
			function _(w) {
				return typeof w == 'number' && h.MIN_VALUE <= w && w <= h.MAX_VALUE;
			}
			h.is = _;
		})(i || (e.integer = i = {}));
		var s;
		(function (h) {
			((h.MIN_VALUE = 0), (h.MAX_VALUE = 2147483647));
			function _(w) {
				return typeof w == 'number' && h.MIN_VALUE <= w && w <= h.MAX_VALUE;
			}
			h.is = _;
		})(s || (e.uinteger = s = {}));
		var o;
		(function (h) {
			function _(v, d) {
				return (
					v === Number.MAX_VALUE && (v = s.MAX_VALUE),
					d === Number.MAX_VALUE && (d = s.MAX_VALUE),
					{ line: v, character: d }
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.objectLiteral(d) && S.uinteger(d.line) && S.uinteger(d.character);
			}
			h.is = w;
		})(o || (e.Position = o = {}));
		var a;
		(function (h) {
			function _(v, d, T, O) {
				if (S.uinteger(v) && S.uinteger(d) && S.uinteger(T) && S.uinteger(O))
					return { start: o.create(v, d), end: o.create(T, O) };
				if (o.is(v) && o.is(d)) return { start: v, end: d };
				throw new Error(
					'Range#create called with invalid arguments['
						.concat(v, ', ')
						.concat(d, ', ')
						.concat(T, ', ')
						.concat(O, ']'),
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.objectLiteral(d) && o.is(d.start) && o.is(d.end);
			}
			h.is = w;
		})(a || (e.Range = a = {}));
		var u;
		(function (h) {
			function _(v, d) {
				return { uri: v, range: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.objectLiteral(d) && a.is(d.range) && (S.string(d.uri) || S.undefined(d.uri));
			}
			h.is = w;
		})(u || (e.Location = u = {}));
		var l;
		(function (h) {
			function _(v, d, T, O) {
				return { targetUri: v, targetRange: d, targetSelectionRange: T, originSelectionRange: O };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.objectLiteral(d) &&
					a.is(d.targetRange) &&
					S.string(d.targetUri) &&
					a.is(d.targetSelectionRange) &&
					(a.is(d.originSelectionRange) || S.undefined(d.originSelectionRange))
				);
			}
			h.is = w;
		})(l || (e.LocationLink = l = {}));
		var p;
		(function (h) {
			function _(v, d, T, O) {
				return { red: v, green: d, blue: T, alpha: O };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.objectLiteral(d) &&
					S.numberRange(d.red, 0, 1) &&
					S.numberRange(d.green, 0, 1) &&
					S.numberRange(d.blue, 0, 1) &&
					S.numberRange(d.alpha, 0, 1)
				);
			}
			h.is = w;
		})(p || (e.Color = p = {}));
		var m;
		(function (h) {
			function _(v, d) {
				return { range: v, color: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.objectLiteral(d) && a.is(d.range) && p.is(d.color);
			}
			h.is = w;
		})(m || (e.ColorInformation = m = {}));
		var g;
		(function (h) {
			function _(v, d, T) {
				return { label: v, textEdit: d, additionalTextEdits: T };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.objectLiteral(d) &&
					S.string(d.label) &&
					(S.undefined(d.textEdit) || X.is(d)) &&
					(S.undefined(d.additionalTextEdits) || S.typedArray(d.additionalTextEdits, X.is))
				);
			}
			h.is = w;
		})(g || (e.ColorPresentation = g = {}));
		var D;
		(function (h) {
			((h.Comment = 'comment'), (h.Imports = 'imports'), (h.Region = 'region'));
		})(D || (e.FoldingRangeKind = D = {}));
		var y;
		(function (h) {
			function _(v, d, T, O, te, $e) {
				var Ie = { startLine: v, endLine: d };
				return (
					S.defined(T) && (Ie.startCharacter = T),
					S.defined(O) && (Ie.endCharacter = O),
					S.defined(te) && (Ie.kind = te),
					S.defined($e) && (Ie.collapsedText = $e),
					Ie
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.objectLiteral(d) &&
					S.uinteger(d.startLine) &&
					S.uinteger(d.startLine) &&
					(S.undefined(d.startCharacter) || S.uinteger(d.startCharacter)) &&
					(S.undefined(d.endCharacter) || S.uinteger(d.endCharacter)) &&
					(S.undefined(d.kind) || S.string(d.kind))
				);
			}
			h.is = w;
		})(y || (e.FoldingRange = y = {}));
		var P;
		(function (h) {
			function _(v, d) {
				return { location: v, message: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && u.is(d.location) && S.string(d.message);
			}
			h.is = w;
		})(P || (e.DiagnosticRelatedInformation = P = {}));
		var q;
		(function (h) {
			((h.Error = 1), (h.Warning = 2), (h.Information = 3), (h.Hint = 4));
		})(q || (e.DiagnosticSeverity = q = {}));
		var N;
		(function (h) {
			((h.Unnecessary = 1), (h.Deprecated = 2));
		})(N || (e.DiagnosticTag = N = {}));
		var L;
		(function (h) {
			function _(w) {
				var v = w;
				return S.objectLiteral(v) && S.string(v.href);
			}
			h.is = _;
		})(L || (e.CodeDescription = L = {}));
		var M;
		(function (h) {
			function _(v, d, T, O, te, $e) {
				var Ie = { range: v, message: d };
				return (
					S.defined(T) && (Ie.severity = T),
					S.defined(O) && (Ie.code = O),
					S.defined(te) && (Ie.source = te),
					S.defined($e) && (Ie.relatedInformation = $e),
					Ie
				);
			}
			h.create = _;
			function w(v) {
				var d,
					T = v;
				return (
					S.defined(T) &&
					a.is(T.range) &&
					S.string(T.message) &&
					(S.number(T.severity) || S.undefined(T.severity)) &&
					(S.integer(T.code) || S.string(T.code) || S.undefined(T.code)) &&
					(S.undefined(T.codeDescription) ||
						S.string((d = T.codeDescription) === null || d === void 0 ? void 0 : d.href)) &&
					(S.string(T.source) || S.undefined(T.source)) &&
					(S.undefined(T.relatedInformation) || S.typedArray(T.relatedInformation, P.is))
				);
			}
			h.is = w;
		})(M || (e.Diagnostic = M = {}));
		var H;
		(function (h) {
			function _(v, d) {
				for (var T = [], O = 2; O < arguments.length; O++) T[O - 2] = arguments[O];
				var te = { title: v, command: d };
				return (S.defined(T) && T.length > 0 && (te.arguments = T), te);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && S.string(d.title) && S.string(d.command);
			}
			h.is = w;
		})(H || (e.Command = H = {}));
		var X;
		(function (h) {
			function _(T, O) {
				return { range: T, newText: O };
			}
			h.replace = _;
			function w(T, O) {
				return { range: { start: T, end: T }, newText: O };
			}
			h.insert = w;
			function v(T) {
				return { range: T, newText: '' };
			}
			h.del = v;
			function d(T) {
				var O = T;
				return S.objectLiteral(O) && S.string(O.newText) && a.is(O.range);
			}
			h.is = d;
		})(X || (e.TextEdit = X = {}));
		var de;
		(function (h) {
			function _(v, d, T) {
				var O = { label: v };
				return (d !== void 0 && (O.needsConfirmation = d), T !== void 0 && (O.description = T), O);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.objectLiteral(d) &&
					S.string(d.label) &&
					(S.boolean(d.needsConfirmation) || d.needsConfirmation === void 0) &&
					(S.string(d.description) || d.description === void 0)
				);
			}
			h.is = w;
		})(de || (e.ChangeAnnotation = de = {}));
		var B;
		(function (h) {
			function _(w) {
				var v = w;
				return S.string(v);
			}
			h.is = _;
		})(B || (e.ChangeAnnotationIdentifier = B = {}));
		var Z;
		(function (h) {
			function _(T, O, te) {
				return { range: T, newText: O, annotationId: te };
			}
			h.replace = _;
			function w(T, O, te) {
				return { range: { start: T, end: T }, newText: O, annotationId: te };
			}
			h.insert = w;
			function v(T, O) {
				return { range: T, newText: '', annotationId: O };
			}
			h.del = v;
			function d(T) {
				var O = T;
				return X.is(O) && (de.is(O.annotationId) || B.is(O.annotationId));
			}
			h.is = d;
		})(Z || (e.AnnotatedTextEdit = Z = {}));
		var ce;
		(function (h) {
			function _(v, d) {
				return { textDocument: v, edits: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && Me.is(d.textDocument) && Array.isArray(d.edits);
			}
			h.is = w;
		})(ce || (e.TextDocumentEdit = ce = {}));
		var et;
		(function (h) {
			function _(v, d, T) {
				var O = { kind: 'create', uri: v };
				return (
					d !== void 0 &&
						(d.overwrite !== void 0 || d.ignoreIfExists !== void 0) &&
						(O.options = d),
					T !== void 0 && (O.annotationId = T),
					O
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					d &&
					d.kind === 'create' &&
					S.string(d.uri) &&
					(d.options === void 0 ||
						((d.options.overwrite === void 0 || S.boolean(d.options.overwrite)) &&
							(d.options.ignoreIfExists === void 0 || S.boolean(d.options.ignoreIfExists)))) &&
					(d.annotationId === void 0 || B.is(d.annotationId))
				);
			}
			h.is = w;
		})(et || (e.CreateFile = et = {}));
		var Xe;
		(function (h) {
			function _(v, d, T, O) {
				var te = { kind: 'rename', oldUri: v, newUri: d };
				return (
					T !== void 0 &&
						(T.overwrite !== void 0 || T.ignoreIfExists !== void 0) &&
						(te.options = T),
					O !== void 0 && (te.annotationId = O),
					te
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					d &&
					d.kind === 'rename' &&
					S.string(d.oldUri) &&
					S.string(d.newUri) &&
					(d.options === void 0 ||
						((d.options.overwrite === void 0 || S.boolean(d.options.overwrite)) &&
							(d.options.ignoreIfExists === void 0 || S.boolean(d.options.ignoreIfExists)))) &&
					(d.annotationId === void 0 || B.is(d.annotationId))
				);
			}
			h.is = w;
		})(Xe || (e.RenameFile = Xe = {}));
		var rt;
		(function (h) {
			function _(v, d, T) {
				var O = { kind: 'delete', uri: v };
				return (
					d !== void 0 &&
						(d.recursive !== void 0 || d.ignoreIfNotExists !== void 0) &&
						(O.options = d),
					T !== void 0 && (O.annotationId = T),
					O
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					d &&
					d.kind === 'delete' &&
					S.string(d.uri) &&
					(d.options === void 0 ||
						((d.options.recursive === void 0 || S.boolean(d.options.recursive)) &&
							(d.options.ignoreIfNotExists === void 0 ||
								S.boolean(d.options.ignoreIfNotExists)))) &&
					(d.annotationId === void 0 || B.is(d.annotationId))
				);
			}
			h.is = w;
		})(rt || (e.DeleteFile = rt = {}));
		var tn;
		(function (h) {
			function _(w) {
				var v = w;
				return (
					v &&
					(v.changes !== void 0 || v.documentChanges !== void 0) &&
					(v.documentChanges === void 0 ||
						v.documentChanges.every(function (d) {
							return S.string(d.kind) ? et.is(d) || Xe.is(d) || rt.is(d) : ce.is(d);
						}))
				);
			}
			h.is = _;
		})(tn || (e.WorkspaceEdit = tn = {}));
		var qt = (function () {
				function h(_, w) {
					((this.edits = _), (this.changeAnnotations = w));
				}
				return (
					(h.prototype.insert = function (_, w, v) {
						var d, T;
						if (
							(v === void 0
								? (d = X.insert(_, w))
								: B.is(v)
									? ((T = v), (d = Z.insert(_, w, v)))
									: (this.assertChangeAnnotations(this.changeAnnotations),
										(T = this.changeAnnotations.manage(v)),
										(d = Z.insert(_, w, T))),
							this.edits.push(d),
							T !== void 0)
						)
							return T;
					}),
					(h.prototype.replace = function (_, w, v) {
						var d, T;
						if (
							(v === void 0
								? (d = X.replace(_, w))
								: B.is(v)
									? ((T = v), (d = Z.replace(_, w, v)))
									: (this.assertChangeAnnotations(this.changeAnnotations),
										(T = this.changeAnnotations.manage(v)),
										(d = Z.replace(_, w, T))),
							this.edits.push(d),
							T !== void 0)
						)
							return T;
					}),
					(h.prototype.delete = function (_, w) {
						var v, d;
						if (
							(w === void 0
								? (v = X.del(_))
								: B.is(w)
									? ((d = w), (v = Z.del(_, w)))
									: (this.assertChangeAnnotations(this.changeAnnotations),
										(d = this.changeAnnotations.manage(w)),
										(v = Z.del(_, d))),
							this.edits.push(v),
							d !== void 0)
						)
							return d;
					}),
					(h.prototype.add = function (_) {
						this.edits.push(_);
					}),
					(h.prototype.all = function () {
						return this.edits;
					}),
					(h.prototype.clear = function () {
						this.edits.splice(0, this.edits.length);
					}),
					(h.prototype.assertChangeAnnotations = function (_) {
						if (_ === void 0)
							throw new Error('Text edit change is not configured to manage change annotations.');
					}),
					h
				);
			})(),
			pt = (function () {
				function h(_) {
					((this._annotations = _ === void 0 ? Object.create(null) : _),
						(this._counter = 0),
						(this._size = 0));
				}
				return (
					(h.prototype.all = function () {
						return this._annotations;
					}),
					Object.defineProperty(h.prototype, 'size', {
						get: function () {
							return this._size;
						},
						enumerable: !1,
						configurable: !0,
					}),
					(h.prototype.manage = function (_, w) {
						var v;
						if (
							(B.is(_) ? (v = _) : ((v = this.nextId()), (w = _)), this._annotations[v] !== void 0)
						)
							throw new Error('Id '.concat(v, ' is already in use.'));
						if (w === void 0) throw new Error('No annotation provided for id '.concat(v));
						return ((this._annotations[v] = w), this._size++, v);
					}),
					(h.prototype.nextId = function () {
						return (this._counter++, this._counter.toString());
					}),
					h
				);
			})(),
			gt = (function () {
				function h(_) {
					var w = this;
					((this._textEditChanges = Object.create(null)),
						_ !== void 0
							? ((this._workspaceEdit = _),
								_.documentChanges
									? ((this._changeAnnotations = new pt(_.changeAnnotations)),
										(_.changeAnnotations = this._changeAnnotations.all()),
										_.documentChanges.forEach(function (v) {
											if (ce.is(v)) {
												var d = new qt(v.edits, w._changeAnnotations);
												w._textEditChanges[v.textDocument.uri] = d;
											}
										}))
									: _.changes &&
										Object.keys(_.changes).forEach(function (v) {
											var d = new qt(_.changes[v]);
											w._textEditChanges[v] = d;
										}))
							: (this._workspaceEdit = {}));
				}
				return (
					Object.defineProperty(h.prototype, 'edit', {
						get: function () {
							return (
								this.initDocumentChanges(),
								this._changeAnnotations !== void 0 &&
									(this._changeAnnotations.size === 0
										? (this._workspaceEdit.changeAnnotations = void 0)
										: (this._workspaceEdit.changeAnnotations = this._changeAnnotations.all())),
								this._workspaceEdit
							);
						},
						enumerable: !1,
						configurable: !0,
					}),
					(h.prototype.getTextEditChange = function (_) {
						if (Me.is(_)) {
							if ((this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0))
								throw new Error('Workspace edit is not configured for document changes.');
							var w = { uri: _.uri, version: _.version },
								v = this._textEditChanges[w.uri];
							if (!v) {
								var d = [],
									T = { textDocument: w, edits: d };
								(this._workspaceEdit.documentChanges.push(T),
									(v = new qt(d, this._changeAnnotations)),
									(this._textEditChanges[w.uri] = v));
							}
							return v;
						} else {
							if ((this.initChanges(), this._workspaceEdit.changes === void 0))
								throw new Error('Workspace edit is not configured for normal text edit changes.');
							var v = this._textEditChanges[_];
							if (!v) {
								var d = [];
								((this._workspaceEdit.changes[_] = d),
									(v = new qt(d)),
									(this._textEditChanges[_] = v));
							}
							return v;
						}
					}),
					(h.prototype.initDocumentChanges = function () {
						this._workspaceEdit.documentChanges === void 0 &&
							this._workspaceEdit.changes === void 0 &&
							((this._changeAnnotations = new pt()),
							(this._workspaceEdit.documentChanges = []),
							(this._workspaceEdit.changeAnnotations = this._changeAnnotations.all()));
					}),
					(h.prototype.initChanges = function () {
						this._workspaceEdit.documentChanges === void 0 &&
							this._workspaceEdit.changes === void 0 &&
							(this._workspaceEdit.changes = Object.create(null));
					}),
					(h.prototype.createFile = function (_, w, v) {
						if ((this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0))
							throw new Error('Workspace edit is not configured for document changes.');
						var d;
						de.is(w) || B.is(w) ? (d = w) : (v = w);
						var T, O;
						if (
							(d === void 0
								? (T = et.create(_, v))
								: ((O = B.is(d) ? d : this._changeAnnotations.manage(d)), (T = et.create(_, v, O))),
							this._workspaceEdit.documentChanges.push(T),
							O !== void 0)
						)
							return O;
					}),
					(h.prototype.renameFile = function (_, w, v, d) {
						if ((this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0))
							throw new Error('Workspace edit is not configured for document changes.');
						var T;
						de.is(v) || B.is(v) ? (T = v) : (d = v);
						var O, te;
						if (
							(T === void 0
								? (O = Xe.create(_, w, d))
								: ((te = B.is(T) ? T : this._changeAnnotations.manage(T)),
									(O = Xe.create(_, w, d, te))),
							this._workspaceEdit.documentChanges.push(O),
							te !== void 0)
						)
							return te;
					}),
					(h.prototype.deleteFile = function (_, w, v) {
						if ((this.initDocumentChanges(), this._workspaceEdit.documentChanges === void 0))
							throw new Error('Workspace edit is not configured for document changes.');
						var d;
						de.is(w) || B.is(w) ? (d = w) : (v = w);
						var T, O;
						if (
							(d === void 0
								? (T = rt.create(_, v))
								: ((O = B.is(d) ? d : this._changeAnnotations.manage(d)), (T = rt.create(_, v, O))),
							this._workspaceEdit.documentChanges.push(T),
							O !== void 0)
						)
							return O;
					}),
					h
				);
			})();
		e.WorkspaceChange = gt;
		var gn;
		(function (h) {
			function _(v) {
				return { uri: v };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && S.string(d.uri);
			}
			h.is = w;
		})(gn || (e.TextDocumentIdentifier = gn = {}));
		var En;
		(function (h) {
			function _(v, d) {
				return { uri: v, version: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && S.string(d.uri) && S.integer(d.version);
			}
			h.is = w;
		})(En || (e.VersionedTextDocumentIdentifier = En = {}));
		var Me;
		(function (h) {
			function _(v, d) {
				return { uri: v, version: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && S.string(d.uri) && (d.version === null || S.integer(d.version));
			}
			h.is = w;
		})(Me || (e.OptionalVersionedTextDocumentIdentifier = Me = {}));
		var Ft;
		(function (h) {
			function _(v, d, T, O) {
				return { uri: v, languageId: d, version: T, text: O };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.defined(d) &&
					S.string(d.uri) &&
					S.string(d.languageId) &&
					S.integer(d.version) &&
					S.string(d.text)
				);
			}
			h.is = w;
		})(Ft || (e.TextDocumentItem = Ft = {}));
		var Et;
		(function (h) {
			((h.PlainText = 'plaintext'), (h.Markdown = 'markdown'));
			function _(w) {
				var v = w;
				return v === h.PlainText || v === h.Markdown;
			}
			h.is = _;
		})(Et || (e.MarkupKind = Et = {}));
		var mt;
		(function (h) {
			function _(w) {
				var v = w;
				return S.objectLiteral(w) && Et.is(v.kind) && S.string(v.value);
			}
			h.is = _;
		})(mt || (e.MarkupContent = mt = {}));
		var cr;
		(function (h) {
			((h.Text = 1),
				(h.Method = 2),
				(h.Function = 3),
				(h.Constructor = 4),
				(h.Field = 5),
				(h.Variable = 6),
				(h.Class = 7),
				(h.Interface = 8),
				(h.Module = 9),
				(h.Property = 10),
				(h.Unit = 11),
				(h.Value = 12),
				(h.Enum = 13),
				(h.Keyword = 14),
				(h.Snippet = 15),
				(h.Color = 16),
				(h.File = 17),
				(h.Reference = 18),
				(h.Folder = 19),
				(h.EnumMember = 20),
				(h.Constant = 21),
				(h.Struct = 22),
				(h.Event = 23),
				(h.Operator = 24),
				(h.TypeParameter = 25));
		})(cr || (e.CompletionItemKind = cr = {}));
		var kn;
		(function (h) {
			((h.PlainText = 1), (h.Snippet = 2));
		})(kn || (e.InsertTextFormat = kn = {}));
		var xn;
		(function (h) {
			h.Deprecated = 1;
		})(xn || (e.CompletionItemTag = xn = {}));
		var Vn;
		(function (h) {
			function _(v, d, T) {
				return { newText: v, insert: d, replace: T };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return d && S.string(d.newText) && a.is(d.insert) && a.is(d.replace);
			}
			h.is = w;
		})(Vn || (e.InsertReplaceEdit = Vn = {}));
		var ur;
		(function (h) {
			((h.asIs = 1), (h.adjustIndentation = 2));
		})(ur || (e.InsertTextMode = ur = {}));
		var In;
		(function (h) {
			function _(w) {
				var v = w;
				return (
					v &&
					(S.string(v.detail) || v.detail === void 0) &&
					(S.string(v.description) || v.description === void 0)
				);
			}
			h.is = _;
		})(In || (e.CompletionItemLabelDetails = In = {}));
		var mn;
		(function (h) {
			function _(w) {
				return { label: w };
			}
			h.create = _;
		})(mn || (e.CompletionItem = mn = {}));
		var vn;
		(function (h) {
			function _(w, v) {
				return { items: w || [], isIncomplete: !!v };
			}
			h.create = _;
		})(vn || (e.CompletionList = vn = {}));
		var On;
		(function (h) {
			function _(v) {
				return v.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
			}
			h.fromPlainText = _;
			function w(v) {
				var d = v;
				return S.string(d) || (S.objectLiteral(d) && S.string(d.language) && S.string(d.value));
			}
			h.is = w;
		})(On || (e.MarkedString = On = {}));
		var it;
		(function (h) {
			function _(w) {
				var v = w;
				return (
					!!v &&
					S.objectLiteral(v) &&
					(mt.is(v.contents) || On.is(v.contents) || S.typedArray(v.contents, On.is)) &&
					(w.range === void 0 || a.is(w.range))
				);
			}
			h.is = _;
		})(it || (e.Hover = it = {}));
		var Bn;
		(function (h) {
			function _(w, v) {
				return v ? { label: w, documentation: v } : { label: w };
			}
			h.create = _;
		})(Bn || (e.ParameterInformation = Bn = {}));
		var yn;
		(function (h) {
			function _(w, v) {
				for (var d = [], T = 2; T < arguments.length; T++) d[T - 2] = arguments[T];
				var O = { label: w };
				return (
					S.defined(v) && (O.documentation = v),
					S.defined(d) ? (O.parameters = d) : (O.parameters = []),
					O
				);
			}
			h.create = _;
		})(yn || (e.SignatureInformation = yn = {}));
		var nn;
		(function (h) {
			((h.Text = 1), (h.Read = 2), (h.Write = 3));
		})(nn || (e.DocumentHighlightKind = nn = {}));
		var lr;
		(function (h) {
			function _(w, v) {
				var d = { range: w };
				return (S.number(v) && (d.kind = v), d);
			}
			h.create = _;
		})(lr || (e.DocumentHighlight = lr = {}));
		var rn;
		(function (h) {
			((h.File = 1),
				(h.Module = 2),
				(h.Namespace = 3),
				(h.Package = 4),
				(h.Class = 5),
				(h.Method = 6),
				(h.Property = 7),
				(h.Field = 8),
				(h.Constructor = 9),
				(h.Enum = 10),
				(h.Interface = 11),
				(h.Function = 12),
				(h.Variable = 13),
				(h.Constant = 14),
				(h.String = 15),
				(h.Number = 16),
				(h.Boolean = 17),
				(h.Array = 18),
				(h.Object = 19),
				(h.Key = 20),
				(h.Null = 21),
				(h.EnumMember = 22),
				(h.Struct = 23),
				(h.Event = 24),
				(h.Operator = 25),
				(h.TypeParameter = 26));
		})(rn || (e.SymbolKind = rn = {}));
		var Fn;
		(function (h) {
			h.Deprecated = 1;
		})(Fn || (e.SymbolTag = Fn = {}));
		var tt;
		(function (h) {
			function _(w, v, d, T, O) {
				var te = { name: w, kind: v, location: { uri: T, range: d } };
				return (O && (te.containerName = O), te);
			}
			h.create = _;
		})(tt || (e.SymbolInformation = tt = {}));
		var bt;
		(function (h) {
			function _(w, v, d, T) {
				return T !== void 0
					? { name: w, kind: v, location: { uri: d, range: T } }
					: { name: w, kind: v, location: { uri: d } };
			}
			h.create = _;
		})(bt || (e.WorkspaceSymbol = bt = {}));
		var vt;
		(function (h) {
			function _(v, d, T, O, te, $e) {
				var Ie = { name: v, detail: d, kind: T, range: O, selectionRange: te };
				return ($e !== void 0 && (Ie.children = $e), Ie);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					d &&
					S.string(d.name) &&
					S.number(d.kind) &&
					a.is(d.range) &&
					a.is(d.selectionRange) &&
					(d.detail === void 0 || S.string(d.detail)) &&
					(d.deprecated === void 0 || S.boolean(d.deprecated)) &&
					(d.children === void 0 || Array.isArray(d.children)) &&
					(d.tags === void 0 || Array.isArray(d.tags))
				);
			}
			h.is = w;
		})(vt || (e.DocumentSymbol = vt = {}));
		var Vt;
		(function (h) {
			((h.Empty = ''),
				(h.QuickFix = 'quickfix'),
				(h.Refactor = 'refactor'),
				(h.RefactorExtract = 'refactor.extract'),
				(h.RefactorInline = 'refactor.inline'),
				(h.RefactorRewrite = 'refactor.rewrite'),
				(h.Source = 'source'),
				(h.SourceOrganizeImports = 'source.organizeImports'),
				(h.SourceFixAll = 'source.fixAll'));
		})(Vt || (e.CodeActionKind = Vt = {}));
		var Nt;
		(function (h) {
			((h.Invoked = 1), (h.Automatic = 2));
		})(Nt || (e.CodeActionTriggerKind = Nt = {}));
		var Nn;
		(function (h) {
			function _(v, d, T) {
				var O = { diagnostics: v };
				return (d != null && (O.only = d), T != null && (O.triggerKind = T), O);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.defined(d) &&
					S.typedArray(d.diagnostics, M.is) &&
					(d.only === void 0 || S.typedArray(d.only, S.string)) &&
					(d.triggerKind === void 0 ||
						d.triggerKind === Nt.Invoked ||
						d.triggerKind === Nt.Automatic)
				);
			}
			h.is = w;
		})(Nn || (e.CodeActionContext = Nn = {}));
		var Gn;
		(function (h) {
			function _(v, d, T) {
				var O = { title: v },
					te = !0;
				return (
					typeof d == 'string'
						? ((te = !1), (O.kind = d))
						: H.is(d)
							? (O.command = d)
							: (O.edit = d),
					te && T !== void 0 && (O.kind = T),
					O
				);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					d &&
					S.string(d.title) &&
					(d.diagnostics === void 0 || S.typedArray(d.diagnostics, M.is)) &&
					(d.kind === void 0 || S.string(d.kind)) &&
					(d.edit !== void 0 || d.command !== void 0) &&
					(d.command === void 0 || H.is(d.command)) &&
					(d.isPreferred === void 0 || S.boolean(d.isPreferred)) &&
					(d.edit === void 0 || tn.is(d.edit))
				);
			}
			h.is = w;
		})(Gn || (e.CodeAction = Gn = {}));
		var Cn;
		(function (h) {
			function _(v, d) {
				var T = { range: v };
				return (S.defined(d) && (T.data = d), T);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && a.is(d.range) && (S.undefined(d.command) || H.is(d.command));
			}
			h.is = w;
		})(Cn || (e.CodeLens = Cn = {}));
		var Xn;
		(function (h) {
			function _(v, d) {
				return { tabSize: v, insertSpaces: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && S.uinteger(d.tabSize) && S.boolean(d.insertSpaces);
			}
			h.is = w;
		})(Xn || (e.FormattingOptions = Xn = {}));
		var kt;
		(function (h) {
			function _(v, d, T) {
				return { range: v, target: d, data: T };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && a.is(d.range) && (S.undefined(d.target) || S.string(d.target));
			}
			h.is = w;
		})(kt || (e.DocumentLink = kt = {}));
		var b;
		(function (h) {
			function _(v, d) {
				return { range: v, parent: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.objectLiteral(d) && a.is(d.range) && (d.parent === void 0 || h.is(d.parent));
			}
			h.is = w;
		})(b || (e.SelectionRange = b = {}));
		var I;
		(function (h) {
			((h.namespace = 'namespace'),
				(h.type = 'type'),
				(h.class = 'class'),
				(h.enum = 'enum'),
				(h.interface = 'interface'),
				(h.struct = 'struct'),
				(h.typeParameter = 'typeParameter'),
				(h.parameter = 'parameter'),
				(h.variable = 'variable'),
				(h.property = 'property'),
				(h.enumMember = 'enumMember'),
				(h.event = 'event'),
				(h.function = 'function'),
				(h.method = 'method'),
				(h.macro = 'macro'),
				(h.keyword = 'keyword'),
				(h.modifier = 'modifier'),
				(h.comment = 'comment'),
				(h.string = 'string'),
				(h.number = 'number'),
				(h.regexp = 'regexp'),
				(h.operator = 'operator'),
				(h.decorator = 'decorator'));
		})(I || (e.SemanticTokenTypes = I = {}));
		var $;
		(function (h) {
			((h.declaration = 'declaration'),
				(h.definition = 'definition'),
				(h.readonly = 'readonly'),
				(h.static = 'static'),
				(h.deprecated = 'deprecated'),
				(h.abstract = 'abstract'),
				(h.async = 'async'),
				(h.modification = 'modification'),
				(h.documentation = 'documentation'),
				(h.defaultLibrary = 'defaultLibrary'));
		})($ || (e.SemanticTokenModifiers = $ = {}));
		var U;
		(function (h) {
			function _(w) {
				var v = w;
				return (
					S.objectLiteral(v) &&
					(v.resultId === void 0 || typeof v.resultId == 'string') &&
					Array.isArray(v.data) &&
					(v.data.length === 0 || typeof v.data[0] == 'number')
				);
			}
			h.is = _;
		})(U || (e.SemanticTokens = U = {}));
		var Ce;
		(function (h) {
			function _(v, d) {
				return { range: v, text: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return d != null && a.is(d.range) && S.string(d.text);
			}
			h.is = w;
		})(Ce || (e.InlineValueText = Ce = {}));
		var ve;
		(function (h) {
			function _(v, d, T) {
				return { range: v, variableName: d, caseSensitiveLookup: T };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					d != null &&
					a.is(d.range) &&
					S.boolean(d.caseSensitiveLookup) &&
					(S.string(d.variableName) || d.variableName === void 0)
				);
			}
			h.is = w;
		})(ve || (e.InlineValueVariableLookup = ve = {}));
		var Pe;
		(function (h) {
			function _(v, d) {
				return { range: v, expression: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return d != null && a.is(d.range) && (S.string(d.expression) || d.expression === void 0);
			}
			h.is = w;
		})(Pe || (e.InlineValueEvaluatableExpression = Pe = {}));
		var ke;
		(function (h) {
			function _(v, d) {
				return { frameId: v, stoppedLocation: d };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return S.defined(d) && a.is(v.stoppedLocation);
			}
			h.is = w;
		})(ke || (e.InlineValueContext = ke = {}));
		var oe;
		(function (h) {
			((h.Type = 1), (h.Parameter = 2));
			function _(w) {
				return w === 1 || w === 2;
			}
			h.is = _;
		})(oe || (e.InlayHintKind = oe = {}));
		var _e;
		(function (h) {
			function _(v) {
				return { value: v };
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					S.objectLiteral(d) &&
					(d.tooltip === void 0 || S.string(d.tooltip) || mt.is(d.tooltip)) &&
					(d.location === void 0 || u.is(d.location)) &&
					(d.command === void 0 || H.is(d.command))
				);
			}
			h.is = w;
		})(_e || (e.InlayHintLabelPart = _e = {}));
		var fe;
		(function (h) {
			function _(v, d, T) {
				var O = { position: v, label: d };
				return (T !== void 0 && (O.kind = T), O);
			}
			h.create = _;
			function w(v) {
				var d = v;
				return (
					(S.objectLiteral(d) &&
						o.is(d.position) &&
						(S.string(d.label) || S.typedArray(d.label, _e.is)) &&
						(d.kind === void 0 || oe.is(d.kind)) &&
						d.textEdits === void 0) ||
					(S.typedArray(d.textEdits, X.is) &&
						(d.tooltip === void 0 || S.string(d.tooltip) || mt.is(d.tooltip)) &&
						(d.paddingLeft === void 0 || S.boolean(d.paddingLeft)) &&
						(d.paddingRight === void 0 || S.boolean(d.paddingRight)))
				);
			}
			h.is = w;
		})(fe || (e.InlayHint = fe = {}));
		var xe;
		(function (h) {
			function _(w) {
				return { kind: 'snippet', value: w };
			}
			h.createSnippet = _;
		})(xe || (e.StringValue = xe = {}));
		var Je;
		(function (h) {
			function _(w, v, d, T) {
				return { insertText: w, filterText: v, range: d, command: T };
			}
			h.create = _;
		})(Je || (e.InlineCompletionItem = Je = {}));
		var ct;
		(function (h) {
			function _(w) {
				return { items: w };
			}
			h.create = _;
		})(ct || (e.InlineCompletionList = ct = {}));
		var dr;
		(function (h) {
			((h.Invoked = 0), (h.Automatic = 1));
		})(dr || (e.InlineCompletionTriggerKind = dr = {}));
		var fr;
		(function (h) {
			function _(w, v) {
				return { range: w, text: v };
			}
			h.create = _;
		})(fr || (e.SelectedCompletionInfo = fr = {}));
		var f;
		(function (h) {
			function _(w, v) {
				return { triggerKind: w, selectedCompletionInfo: v };
			}
			h.create = _;
		})(f || (e.InlineCompletionContext = f = {}));
		var k;
		((function (h) {
			function _(w) {
				var v = w;
				return S.objectLiteral(v) && r.is(v.uri) && S.string(v.name);
			}
			h.is = _;
		})(k || (e.WorkspaceFolder = k = {})),
			(e.EOL = [
				`
`,
				`\r
`,
				'\r',
			]));
		var V;
		(function (h) {
			function _(T, O, te, $e) {
				return new we(T, O, te, $e);
			}
			h.create = _;
			function w(T) {
				var O = T;
				return !!(
					S.defined(O) &&
					S.string(O.uri) &&
					(S.undefined(O.languageId) || S.string(O.languageId)) &&
					S.uinteger(O.lineCount) &&
					S.func(O.getText) &&
					S.func(O.positionAt) &&
					S.func(O.offsetAt)
				);
			}
			h.is = w;
			function v(T, O) {
				for (
					var te = T.getText(),
						$e = d(O, function (Mn, c) {
							var R = Mn.range.start.line - c.range.start.line;
							return R === 0 ? Mn.range.start.character - c.range.start.character : R;
						}),
						Ie = te.length,
						Mt = $e.length - 1;
					Mt >= 0;
					Mt--
				) {
					var Bt = $e[Mt],
						bn = T.offsetAt(Bt.range.start),
						le = T.offsetAt(Bt.range.end);
					if (le <= Ie) te = te.substring(0, bn) + Bt.newText + te.substring(le, te.length);
					else throw new Error('Overlapping edit');
					Ie = bn;
				}
				return te;
			}
			h.applyEdits = v;
			function d(T, O) {
				if (T.length <= 1) return T;
				var te = (T.length / 2) | 0,
					$e = T.slice(0, te),
					Ie = T.slice(te);
				(d($e, O), d(Ie, O));
				for (var Mt = 0, Bt = 0, bn = 0; Mt < $e.length && Bt < Ie.length; ) {
					var le = O($e[Mt], Ie[Bt]);
					le <= 0 ? (T[bn++] = $e[Mt++]) : (T[bn++] = Ie[Bt++]);
				}
				for (; Mt < $e.length; ) T[bn++] = $e[Mt++];
				for (; Bt < Ie.length; ) T[bn++] = Ie[Bt++];
				return T;
			}
		})(V || (e.TextDocument = V = {}));
		var we = (function () {
				function h(_, w, v, d) {
					((this._uri = _),
						(this._languageId = w),
						(this._version = v),
						(this._content = d),
						(this._lineOffsets = void 0));
				}
				return (
					Object.defineProperty(h.prototype, 'uri', {
						get: function () {
							return this._uri;
						},
						enumerable: !1,
						configurable: !0,
					}),
					Object.defineProperty(h.prototype, 'languageId', {
						get: function () {
							return this._languageId;
						},
						enumerable: !1,
						configurable: !0,
					}),
					Object.defineProperty(h.prototype, 'version', {
						get: function () {
							return this._version;
						},
						enumerable: !1,
						configurable: !0,
					}),
					(h.prototype.getText = function (_) {
						if (_) {
							var w = this.offsetAt(_.start),
								v = this.offsetAt(_.end);
							return this._content.substring(w, v);
						}
						return this._content;
					}),
					(h.prototype.update = function (_, w) {
						((this._content = _.text), (this._version = w), (this._lineOffsets = void 0));
					}),
					(h.prototype.getLineOffsets = function () {
						if (this._lineOffsets === void 0) {
							for (var _ = [], w = this._content, v = !0, d = 0; d < w.length; d++) {
								v && (_.push(d), (v = !1));
								var T = w.charAt(d);
								((v =
									T === '\r' ||
									T ===
										`
`),
									T === '\r' &&
										d + 1 < w.length &&
										w.charAt(d + 1) ===
											`
` &&
										d++);
							}
							(v && w.length > 0 && _.push(w.length), (this._lineOffsets = _));
						}
						return this._lineOffsets;
					}),
					(h.prototype.positionAt = function (_) {
						_ = Math.max(Math.min(_, this._content.length), 0);
						var w = this.getLineOffsets(),
							v = 0,
							d = w.length;
						if (d === 0) return o.create(0, _);
						for (; v < d; ) {
							var T = Math.floor((v + d) / 2);
							w[T] > _ ? (d = T) : (v = T + 1);
						}
						var O = v - 1;
						return o.create(O, _ - w[O]);
					}),
					(h.prototype.offsetAt = function (_) {
						var w = this.getLineOffsets();
						if (_.line >= w.length) return this._content.length;
						if (_.line < 0) return 0;
						var v = w[_.line],
							d = _.line + 1 < w.length ? w[_.line + 1] : this._content.length;
						return Math.max(Math.min(v + _.character, d), v);
					}),
					Object.defineProperty(h.prototype, 'lineCount', {
						get: function () {
							return this.getLineOffsets().length;
						},
						enumerable: !1,
						configurable: !0,
					}),
					h
				);
			})(),
			S;
		(function (h) {
			var _ = Object.prototype.toString;
			function w(le) {
				return typeof le < 'u';
			}
			h.defined = w;
			function v(le) {
				return typeof le > 'u';
			}
			h.undefined = v;
			function d(le) {
				return le === !0 || le === !1;
			}
			h.boolean = d;
			function T(le) {
				return _.call(le) === '[object String]';
			}
			h.string = T;
			function O(le) {
				return _.call(le) === '[object Number]';
			}
			h.number = O;
			function te(le, Mn, c) {
				return _.call(le) === '[object Number]' && Mn <= le && le <= c;
			}
			h.numberRange = te;
			function $e(le) {
				return _.call(le) === '[object Number]' && -2147483648 <= le && le <= 2147483647;
			}
			h.integer = $e;
			function Ie(le) {
				return _.call(le) === '[object Number]' && 0 <= le && le <= 2147483647;
			}
			h.uinteger = Ie;
			function Mt(le) {
				return _.call(le) === '[object Function]';
			}
			h.func = Mt;
			function Bt(le) {
				return le !== null && typeof le == 'object';
			}
			h.objectLiteral = Bt;
			function bn(le, Mn) {
				return Array.isArray(le) && le.every(Mn);
			}
			h.typedArray = bn;
		})(S || (S = {}));
	});
});
var He = E((Lt) => {
	'use strict';
	Object.defineProperty(Lt, '__esModule', { value: !0 });
	Lt.ProtocolNotificationType =
		Lt.ProtocolNotificationType0 =
		Lt.ProtocolRequestType =
		Lt.ProtocolRequestType0 =
		Lt.RegistrationType =
		Lt.MessageDirection =
			void 0;
	var si = Fr(),
		Uf;
	(function (n) {
		((n.clientToServer = 'clientToServer'),
			(n.serverToClient = 'serverToClient'),
			(n.both = 'both'));
	})(Uf || (Lt.MessageDirection = Uf = {}));
	var Rc = class {
		constructor(e) {
			this.method = e;
		}
	};
	Lt.RegistrationType = Rc;
	var Sc = class extends si.RequestType0 {
		constructor(e) {
			super(e);
		}
	};
	Lt.ProtocolRequestType0 = Sc;
	var Tc = class extends si.RequestType {
		constructor(e) {
			super(e, si.ParameterStructures.byName);
		}
	};
	Lt.ProtocolRequestType = Tc;
	var Pc = class extends si.NotificationType0 {
		constructor(e) {
			super(e);
		}
	};
	Lt.ProtocolNotificationType0 = Pc;
	var qc = class extends si.NotificationType {
		constructor(e) {
			super(e, si.ParameterStructures.byName);
		}
	};
	Lt.ProtocolNotificationType = qc;
});
var Ws = E((st) => {
	'use strict';
	Object.defineProperty(st, '__esModule', { value: !0 });
	st.objectLiteral =
		st.typedArray =
		st.stringArray =
		st.array =
		st.func =
		st.error =
		st.number =
		st.string =
		st.boolean =
			void 0;
	function ub(n) {
		return n === !0 || n === !1;
	}
	st.boolean = ub;
	function Kf(n) {
		return typeof n == 'string' || n instanceof String;
	}
	st.string = Kf;
	function lb(n) {
		return typeof n == 'number' || n instanceof Number;
	}
	st.number = lb;
	function db(n) {
		return n instanceof Error;
	}
	st.error = db;
	function fb(n) {
		return typeof n == 'function';
	}
	st.func = fb;
	function zf(n) {
		return Array.isArray(n);
	}
	st.array = zf;
	function hb(n) {
		return zf(n) && n.every((e) => Kf(e));
	}
	st.stringArray = hb;
	function pb(n, e) {
		return Array.isArray(n) && n.every(e);
	}
	st.typedArray = pb;
	function gb(n) {
		return n !== null && typeof n == 'object';
	}
	st.objectLiteral = gb;
});
var Gf = E((Us) => {
	'use strict';
	Object.defineProperty(Us, '__esModule', { value: !0 });
	Us.ImplementationRequest = void 0;
	var Vf = He(),
		Bf;
	(function (n) {
		((n.method = 'textDocument/implementation'),
			(n.messageDirection = Vf.MessageDirection.clientToServer),
			(n.type = new Vf.ProtocolRequestType(n.method)));
	})(Bf || (Us.ImplementationRequest = Bf = {}));
});
var Qf = E((Ks) => {
	'use strict';
	Object.defineProperty(Ks, '__esModule', { value: !0 });
	Ks.TypeDefinitionRequest = void 0;
	var Xf = He(),
		Jf;
	(function (n) {
		((n.method = 'textDocument/typeDefinition'),
			(n.messageDirection = Xf.MessageDirection.clientToServer),
			(n.type = new Xf.ProtocolRequestType(n.method)));
	})(Jf || (Ks.TypeDefinitionRequest = Jf = {}));
});
var eh = E((oi) => {
	'use strict';
	Object.defineProperty(oi, '__esModule', { value: !0 });
	oi.DidChangeWorkspaceFoldersNotification = oi.WorkspaceFoldersRequest = void 0;
	var zs = He(),
		Yf;
	(function (n) {
		((n.method = 'workspace/workspaceFolders'),
			(n.messageDirection = zs.MessageDirection.serverToClient),
			(n.type = new zs.ProtocolRequestType0(n.method)));
	})(Yf || (oi.WorkspaceFoldersRequest = Yf = {}));
	var Zf;
	(function (n) {
		((n.method = 'workspace/didChangeWorkspaceFolders'),
			(n.messageDirection = zs.MessageDirection.clientToServer),
			(n.type = new zs.ProtocolNotificationType(n.method)));
	})(Zf || (oi.DidChangeWorkspaceFoldersNotification = Zf = {}));
});
var rh = E((Vs) => {
	'use strict';
	Object.defineProperty(Vs, '__esModule', { value: !0 });
	Vs.ConfigurationRequest = void 0;
	var th = He(),
		nh;
	(function (n) {
		((n.method = 'workspace/configuration'),
			(n.messageDirection = th.MessageDirection.serverToClient),
			(n.type = new th.ProtocolRequestType(n.method)));
	})(nh || (Vs.ConfigurationRequest = nh = {}));
});
var oh = E((ai) => {
	'use strict';
	Object.defineProperty(ai, '__esModule', { value: !0 });
	ai.ColorPresentationRequest = ai.DocumentColorRequest = void 0;
	var Bs = He(),
		ih;
	(function (n) {
		((n.method = 'textDocument/documentColor'),
			(n.messageDirection = Bs.MessageDirection.clientToServer),
			(n.type = new Bs.ProtocolRequestType(n.method)));
	})(ih || (ai.DocumentColorRequest = ih = {}));
	var sh;
	(function (n) {
		((n.method = 'textDocument/colorPresentation'),
			(n.messageDirection = Bs.MessageDirection.clientToServer),
			(n.type = new Bs.ProtocolRequestType(n.method)));
	})(sh || (ai.ColorPresentationRequest = sh = {}));
});
var uh = E((ci) => {
	'use strict';
	Object.defineProperty(ci, '__esModule', { value: !0 });
	ci.FoldingRangeRefreshRequest = ci.FoldingRangeRequest = void 0;
	var Gs = He(),
		ah;
	(function (n) {
		((n.method = 'textDocument/foldingRange'),
			(n.messageDirection = Gs.MessageDirection.clientToServer),
			(n.type = new Gs.ProtocolRequestType(n.method)));
	})(ah || (ci.FoldingRangeRequest = ah = {}));
	var ch;
	(function (n) {
		((n.method = 'workspace/foldingRange/refresh'),
			(n.messageDirection = Gs.MessageDirection.serverToClient),
			(n.type = new Gs.ProtocolRequestType0(n.method)));
	})(ch || (ci.FoldingRangeRefreshRequest = ch = {}));
});
var fh = E((Xs) => {
	'use strict';
	Object.defineProperty(Xs, '__esModule', { value: !0 });
	Xs.DeclarationRequest = void 0;
	var lh = He(),
		dh;
	(function (n) {
		((n.method = 'textDocument/declaration'),
			(n.messageDirection = lh.MessageDirection.clientToServer),
			(n.type = new lh.ProtocolRequestType(n.method)));
	})(dh || (Xs.DeclarationRequest = dh = {}));
});
var gh = E((Js) => {
	'use strict';
	Object.defineProperty(Js, '__esModule', { value: !0 });
	Js.SelectionRangeRequest = void 0;
	var hh = He(),
		ph;
	(function (n) {
		((n.method = 'textDocument/selectionRange'),
			(n.messageDirection = hh.MessageDirection.clientToServer),
			(n.type = new hh.ProtocolRequestType(n.method)));
	})(ph || (Js.SelectionRangeRequest = ph = {}));
});
var Ch = E((yr) => {
	'use strict';
	Object.defineProperty(yr, '__esModule', { value: !0 });
	yr.WorkDoneProgressCancelNotification =
		yr.WorkDoneProgressCreateRequest =
		yr.WorkDoneProgress =
			void 0;
	var mb = Fr(),
		Qs = He(),
		mh;
	(function (n) {
		n.type = new mb.ProgressType();
		function e(t) {
			return t === n.type;
		}
		n.is = e;
	})(mh || (yr.WorkDoneProgress = mh = {}));
	var vh;
	(function (n) {
		((n.method = 'window/workDoneProgress/create'),
			(n.messageDirection = Qs.MessageDirection.serverToClient),
			(n.type = new Qs.ProtocolRequestType(n.method)));
	})(vh || (yr.WorkDoneProgressCreateRequest = vh = {}));
	var yh;
	(function (n) {
		((n.method = 'window/workDoneProgress/cancel'),
			(n.messageDirection = Qs.MessageDirection.clientToServer),
			(n.type = new Qs.ProtocolNotificationType(n.method)));
	})(yh || (yr.WorkDoneProgressCancelNotification = yh = {}));
});
var Dh = E((Cr) => {
	'use strict';
	Object.defineProperty(Cr, '__esModule', { value: !0 });
	Cr.CallHierarchyOutgoingCallsRequest =
		Cr.CallHierarchyIncomingCallsRequest =
		Cr.CallHierarchyPrepareRequest =
			void 0;
	var ui = He(),
		bh;
	(function (n) {
		((n.method = 'textDocument/prepareCallHierarchy'),
			(n.messageDirection = ui.MessageDirection.clientToServer),
			(n.type = new ui.ProtocolRequestType(n.method)));
	})(bh || (Cr.CallHierarchyPrepareRequest = bh = {}));
	var _h;
	(function (n) {
		((n.method = 'callHierarchy/incomingCalls'),
			(n.messageDirection = ui.MessageDirection.clientToServer),
			(n.type = new ui.ProtocolRequestType(n.method)));
	})(_h || (Cr.CallHierarchyIncomingCallsRequest = _h = {}));
	var wh;
	(function (n) {
		((n.method = 'callHierarchy/outgoingCalls'),
			(n.messageDirection = ui.MessageDirection.clientToServer),
			(n.type = new ui.ProtocolRequestType(n.method)));
	})(wh || (Cr.CallHierarchyOutgoingCallsRequest = wh = {}));
});
var Eh = E((At) => {
	'use strict';
	Object.defineProperty(At, '__esModule', { value: !0 });
	At.SemanticTokensRefreshRequest =
		At.SemanticTokensRangeRequest =
		At.SemanticTokensDeltaRequest =
		At.SemanticTokensRequest =
		At.SemanticTokensRegistrationType =
		At.TokenFormat =
			void 0;
	var Qn = He(),
		Rh;
	(function (n) {
		n.Relative = 'relative';
	})(Rh || (At.TokenFormat = Rh = {}));
	var Hi;
	(function (n) {
		((n.method = 'textDocument/semanticTokens'), (n.type = new Qn.RegistrationType(n.method)));
	})(Hi || (At.SemanticTokensRegistrationType = Hi = {}));
	var Sh;
	(function (n) {
		((n.method = 'textDocument/semanticTokens/full'),
			(n.messageDirection = Qn.MessageDirection.clientToServer),
			(n.type = new Qn.ProtocolRequestType(n.method)),
			(n.registrationMethod = Hi.method));
	})(Sh || (At.SemanticTokensRequest = Sh = {}));
	var Th;
	(function (n) {
		((n.method = 'textDocument/semanticTokens/full/delta'),
			(n.messageDirection = Qn.MessageDirection.clientToServer),
			(n.type = new Qn.ProtocolRequestType(n.method)),
			(n.registrationMethod = Hi.method));
	})(Th || (At.SemanticTokensDeltaRequest = Th = {}));
	var Ph;
	(function (n) {
		((n.method = 'textDocument/semanticTokens/range'),
			(n.messageDirection = Qn.MessageDirection.clientToServer),
			(n.type = new Qn.ProtocolRequestType(n.method)),
			(n.registrationMethod = Hi.method));
	})(Ph || (At.SemanticTokensRangeRequest = Ph = {}));
	var qh;
	(function (n) {
		((n.method = 'workspace/semanticTokens/refresh'),
			(n.messageDirection = Qn.MessageDirection.serverToClient),
			(n.type = new Qn.ProtocolRequestType0(n.method)));
	})(qh || (At.SemanticTokensRefreshRequest = qh = {}));
});
var Ih = E((Ys) => {
	'use strict';
	Object.defineProperty(Ys, '__esModule', { value: !0 });
	Ys.ShowDocumentRequest = void 0;
	var kh = He(),
		xh;
	(function (n) {
		((n.method = 'window/showDocument'),
			(n.messageDirection = kh.MessageDirection.serverToClient),
			(n.type = new kh.ProtocolRequestType(n.method)));
	})(xh || (Ys.ShowDocumentRequest = xh = {}));
});
var Nh = E((Zs) => {
	'use strict';
	Object.defineProperty(Zs, '__esModule', { value: !0 });
	Zs.LinkedEditingRangeRequest = void 0;
	var Oh = He(),
		Fh;
	(function (n) {
		((n.method = 'textDocument/linkedEditingRange'),
			(n.messageDirection = Oh.MessageDirection.clientToServer),
			(n.type = new Oh.ProtocolRequestType(n.method)));
	})(Fh || (Zs.LinkedEditingRangeRequest = Fh = {}));
});
var Uh = E((Dt) => {
	'use strict';
	Object.defineProperty(Dt, '__esModule', { value: !0 });
	Dt.WillDeleteFilesRequest =
		Dt.DidDeleteFilesNotification =
		Dt.DidRenameFilesNotification =
		Dt.WillRenameFilesRequest =
		Dt.DidCreateFilesNotification =
		Dt.WillCreateFilesRequest =
		Dt.FileOperationPatternKind =
			void 0;
	var sn = He(),
		Mh;
	(function (n) {
		((n.file = 'file'), (n.folder = 'folder'));
	})(Mh || (Dt.FileOperationPatternKind = Mh = {}));
	var Lh;
	(function (n) {
		((n.method = 'workspace/willCreateFiles'),
			(n.messageDirection = sn.MessageDirection.clientToServer),
			(n.type = new sn.ProtocolRequestType(n.method)));
	})(Lh || (Dt.WillCreateFilesRequest = Lh = {}));
	var Ah;
	(function (n) {
		((n.method = 'workspace/didCreateFiles'),
			(n.messageDirection = sn.MessageDirection.clientToServer),
			(n.type = new sn.ProtocolNotificationType(n.method)));
	})(Ah || (Dt.DidCreateFilesNotification = Ah = {}));
	var jh;
	(function (n) {
		((n.method = 'workspace/willRenameFiles'),
			(n.messageDirection = sn.MessageDirection.clientToServer),
			(n.type = new sn.ProtocolRequestType(n.method)));
	})(jh || (Dt.WillRenameFilesRequest = jh = {}));
	var $h;
	(function (n) {
		((n.method = 'workspace/didRenameFiles'),
			(n.messageDirection = sn.MessageDirection.clientToServer),
			(n.type = new sn.ProtocolNotificationType(n.method)));
	})($h || (Dt.DidRenameFilesNotification = $h = {}));
	var Hh;
	(function (n) {
		((n.method = 'workspace/didDeleteFiles'),
			(n.messageDirection = sn.MessageDirection.clientToServer),
			(n.type = new sn.ProtocolNotificationType(n.method)));
	})(Hh || (Dt.DidDeleteFilesNotification = Hh = {}));
	var Wh;
	(function (n) {
		((n.method = 'workspace/willDeleteFiles'),
			(n.messageDirection = sn.MessageDirection.clientToServer),
			(n.type = new sn.ProtocolRequestType(n.method)));
	})(Wh || (Dt.WillDeleteFilesRequest = Wh = {}));
});
var Gh = E((br) => {
	'use strict';
	Object.defineProperty(br, '__esModule', { value: !0 });
	br.MonikerRequest = br.MonikerKind = br.UniquenessLevel = void 0;
	var Kh = He(),
		zh;
	(function (n) {
		((n.document = 'document'),
			(n.project = 'project'),
			(n.group = 'group'),
			(n.scheme = 'scheme'),
			(n.global = 'global'));
	})(zh || (br.UniquenessLevel = zh = {}));
	var Vh;
	(function (n) {
		((n.$import = 'import'), (n.$export = 'export'), (n.local = 'local'));
	})(Vh || (br.MonikerKind = Vh = {}));
	var Bh;
	(function (n) {
		((n.method = 'textDocument/moniker'),
			(n.messageDirection = Kh.MessageDirection.clientToServer),
			(n.type = new Kh.ProtocolRequestType(n.method)));
	})(Bh || (br.MonikerRequest = Bh = {}));
});
var Yh = E((_r) => {
	'use strict';
	Object.defineProperty(_r, '__esModule', { value: !0 });
	_r.TypeHierarchySubtypesRequest =
		_r.TypeHierarchySupertypesRequest =
		_r.TypeHierarchyPrepareRequest =
			void 0;
	var li = He(),
		Xh;
	(function (n) {
		((n.method = 'textDocument/prepareTypeHierarchy'),
			(n.messageDirection = li.MessageDirection.clientToServer),
			(n.type = new li.ProtocolRequestType(n.method)));
	})(Xh || (_r.TypeHierarchyPrepareRequest = Xh = {}));
	var Jh;
	(function (n) {
		((n.method = 'typeHierarchy/supertypes'),
			(n.messageDirection = li.MessageDirection.clientToServer),
			(n.type = new li.ProtocolRequestType(n.method)));
	})(Jh || (_r.TypeHierarchySupertypesRequest = Jh = {}));
	var Qh;
	(function (n) {
		((n.method = 'typeHierarchy/subtypes'),
			(n.messageDirection = li.MessageDirection.clientToServer),
			(n.type = new li.ProtocolRequestType(n.method)));
	})(Qh || (_r.TypeHierarchySubtypesRequest = Qh = {}));
});
var tp = E((di) => {
	'use strict';
	Object.defineProperty(di, '__esModule', { value: !0 });
	di.InlineValueRefreshRequest = di.InlineValueRequest = void 0;
	var eo = He(),
		Zh;
	(function (n) {
		((n.method = 'textDocument/inlineValue'),
			(n.messageDirection = eo.MessageDirection.clientToServer),
			(n.type = new eo.ProtocolRequestType(n.method)));
	})(Zh || (di.InlineValueRequest = Zh = {}));
	var ep;
	(function (n) {
		((n.method = 'workspace/inlineValue/refresh'),
			(n.messageDirection = eo.MessageDirection.serverToClient),
			(n.type = new eo.ProtocolRequestType0(n.method)));
	})(ep || (di.InlineValueRefreshRequest = ep = {}));
});
var sp = E((wr) => {
	'use strict';
	Object.defineProperty(wr, '__esModule', { value: !0 });
	wr.InlayHintRefreshRequest = wr.InlayHintResolveRequest = wr.InlayHintRequest = void 0;
	var fi = He(),
		np;
	(function (n) {
		((n.method = 'textDocument/inlayHint'),
			(n.messageDirection = fi.MessageDirection.clientToServer),
			(n.type = new fi.ProtocolRequestType(n.method)));
	})(np || (wr.InlayHintRequest = np = {}));
	var rp;
	(function (n) {
		((n.method = 'inlayHint/resolve'),
			(n.messageDirection = fi.MessageDirection.clientToServer),
			(n.type = new fi.ProtocolRequestType(n.method)));
	})(rp || (wr.InlayHintResolveRequest = rp = {}));
	var ip;
	(function (n) {
		((n.method = 'workspace/inlayHint/refresh'),
			(n.messageDirection = fi.MessageDirection.serverToClient),
			(n.type = new fi.ProtocolRequestType0(n.method)));
	})(ip || (wr.InlayHintRefreshRequest = ip = {}));
});
var fp = E((on) => {
	'use strict';
	Object.defineProperty(on, '__esModule', { value: !0 });
	on.DiagnosticRefreshRequest =
		on.WorkspaceDiagnosticRequest =
		on.DocumentDiagnosticRequest =
		on.DocumentDiagnosticReportKind =
		on.DiagnosticServerCancellationData =
			void 0;
	var dp = Fr(),
		vb = Ws(),
		hi = He(),
		op;
	(function (n) {
		function e(t) {
			let r = t;
			return r && vb.boolean(r.retriggerRequest);
		}
		n.is = e;
	})(op || (on.DiagnosticServerCancellationData = op = {}));
	var ap;
	(function (n) {
		((n.Full = 'full'), (n.Unchanged = 'unchanged'));
	})(ap || (on.DocumentDiagnosticReportKind = ap = {}));
	var cp;
	(function (n) {
		((n.method = 'textDocument/diagnostic'),
			(n.messageDirection = hi.MessageDirection.clientToServer),
			(n.type = new hi.ProtocolRequestType(n.method)),
			(n.partialResult = new dp.ProgressType()));
	})(cp || (on.DocumentDiagnosticRequest = cp = {}));
	var up;
	(function (n) {
		((n.method = 'workspace/diagnostic'),
			(n.messageDirection = hi.MessageDirection.clientToServer),
			(n.type = new hi.ProtocolRequestType(n.method)),
			(n.partialResult = new dp.ProgressType()));
	})(up || (on.WorkspaceDiagnosticRequest = up = {}));
	var lp;
	(function (n) {
		((n.method = 'workspace/diagnostic/refresh'),
			(n.messageDirection = hi.MessageDirection.serverToClient),
			(n.type = new hi.ProtocolRequestType0(n.method)));
	})(lp || (on.DiagnosticRefreshRequest = lp = {}));
});
var Cp = E((Qe) => {
	'use strict';
	Object.defineProperty(Qe, '__esModule', { value: !0 });
	Qe.DidCloseNotebookDocumentNotification =
		Qe.DidSaveNotebookDocumentNotification =
		Qe.DidChangeNotebookDocumentNotification =
		Qe.NotebookCellArrayChange =
		Qe.DidOpenNotebookDocumentNotification =
		Qe.NotebookDocumentSyncRegistrationType =
		Qe.NotebookDocument =
		Qe.NotebookCell =
		Qe.ExecutionSummary =
		Qe.NotebookCellKind =
			void 0;
	var Wi = Hs(),
		wn = Ws(),
		An = He(),
		Ec;
	(function (n) {
		((n.Markup = 1), (n.Code = 2));
		function e(t) {
			return t === 1 || t === 2;
		}
		n.is = e;
	})(Ec || (Qe.NotebookCellKind = Ec = {}));
	var kc;
	(function (n) {
		function e(i, s) {
			let o = { executionOrder: i };
			return ((s === !0 || s === !1) && (o.success = s), o);
		}
		n.create = e;
		function t(i) {
			let s = i;
			return (
				wn.objectLiteral(s) &&
				Wi.uinteger.is(s.executionOrder) &&
				(s.success === void 0 || wn.boolean(s.success))
			);
		}
		n.is = t;
		function r(i, s) {
			return i === s
				? !0
				: i == null || s === null || s === void 0
					? !1
					: i.executionOrder === s.executionOrder && i.success === s.success;
		}
		n.equals = r;
	})(kc || (Qe.ExecutionSummary = kc = {}));
	var to;
	(function (n) {
		function e(s, o) {
			return { kind: s, document: o };
		}
		n.create = e;
		function t(s) {
			let o = s;
			return (
				wn.objectLiteral(o) &&
				Ec.is(o.kind) &&
				Wi.DocumentUri.is(o.document) &&
				(o.metadata === void 0 || wn.objectLiteral(o.metadata))
			);
		}
		n.is = t;
		function r(s, o) {
			let a = new Set();
			return (
				s.document !== o.document && a.add('document'),
				s.kind !== o.kind && a.add('kind'),
				s.executionSummary !== o.executionSummary && a.add('executionSummary'),
				(s.metadata !== void 0 || o.metadata !== void 0) &&
					!i(s.metadata, o.metadata) &&
					a.add('metadata'),
				(s.executionSummary !== void 0 || o.executionSummary !== void 0) &&
					!kc.equals(s.executionSummary, o.executionSummary) &&
					a.add('executionSummary'),
				a
			);
		}
		n.diff = r;
		function i(s, o) {
			if (s === o) return !0;
			if (s == null || o === null || o === void 0 || typeof s != typeof o || typeof s != 'object')
				return !1;
			let a = Array.isArray(s),
				u = Array.isArray(o);
			if (a !== u) return !1;
			if (a && u) {
				if (s.length !== o.length) return !1;
				for (let l = 0; l < s.length; l++) if (!i(s[l], o[l])) return !1;
			}
			if (wn.objectLiteral(s) && wn.objectLiteral(o)) {
				let l = Object.keys(s),
					p = Object.keys(o);
				if (l.length !== p.length || (l.sort(), p.sort(), !i(l, p))) return !1;
				for (let m = 0; m < l.length; m++) {
					let g = l[m];
					if (!i(s[g], o[g])) return !1;
				}
			}
			return !0;
		}
	})(to || (Qe.NotebookCell = to = {}));
	var hp;
	(function (n) {
		function e(r, i, s, o) {
			return { uri: r, notebookType: i, version: s, cells: o };
		}
		n.create = e;
		function t(r) {
			let i = r;
			return (
				wn.objectLiteral(i) &&
				wn.string(i.uri) &&
				Wi.integer.is(i.version) &&
				wn.typedArray(i.cells, to.is)
			);
		}
		n.is = t;
	})(hp || (Qe.NotebookDocument = hp = {}));
	var pi;
	(function (n) {
		((n.method = 'notebookDocument/sync'),
			(n.messageDirection = An.MessageDirection.clientToServer),
			(n.type = new An.RegistrationType(n.method)));
	})(pi || (Qe.NotebookDocumentSyncRegistrationType = pi = {}));
	var pp;
	(function (n) {
		((n.method = 'notebookDocument/didOpen'),
			(n.messageDirection = An.MessageDirection.clientToServer),
			(n.type = new An.ProtocolNotificationType(n.method)),
			(n.registrationMethod = pi.method));
	})(pp || (Qe.DidOpenNotebookDocumentNotification = pp = {}));
	var gp;
	(function (n) {
		function e(r) {
			let i = r;
			return (
				wn.objectLiteral(i) &&
				Wi.uinteger.is(i.start) &&
				Wi.uinteger.is(i.deleteCount) &&
				(i.cells === void 0 || wn.typedArray(i.cells, to.is))
			);
		}
		n.is = e;
		function t(r, i, s) {
			let o = { start: r, deleteCount: i };
			return (s !== void 0 && (o.cells = s), o);
		}
		n.create = t;
	})(gp || (Qe.NotebookCellArrayChange = gp = {}));
	var mp;
	(function (n) {
		((n.method = 'notebookDocument/didChange'),
			(n.messageDirection = An.MessageDirection.clientToServer),
			(n.type = new An.ProtocolNotificationType(n.method)),
			(n.registrationMethod = pi.method));
	})(mp || (Qe.DidChangeNotebookDocumentNotification = mp = {}));
	var vp;
	(function (n) {
		((n.method = 'notebookDocument/didSave'),
			(n.messageDirection = An.MessageDirection.clientToServer),
			(n.type = new An.ProtocolNotificationType(n.method)),
			(n.registrationMethod = pi.method));
	})(vp || (Qe.DidSaveNotebookDocumentNotification = vp = {}));
	var yp;
	(function (n) {
		((n.method = 'notebookDocument/didClose'),
			(n.messageDirection = An.MessageDirection.clientToServer),
			(n.type = new An.ProtocolNotificationType(n.method)),
			(n.registrationMethod = pi.method));
	})(yp || (Qe.DidCloseNotebookDocumentNotification = yp = {}));
});
var wp = E((no) => {
	'use strict';
	Object.defineProperty(no, '__esModule', { value: !0 });
	no.InlineCompletionRequest = void 0;
	var bp = He(),
		_p;
	(function (n) {
		((n.method = 'textDocument/inlineCompletion'),
			(n.messageDirection = bp.MessageDirection.clientToServer),
			(n.type = new bp.ProtocolRequestType(n.method)));
	})(_p || (no.InlineCompletionRequest = _p = {}));
});
var Ng = E((C) => {
	'use strict';
	Object.defineProperty(C, '__esModule', { value: !0 });
	C.WorkspaceSymbolRequest =
		C.CodeActionResolveRequest =
		C.CodeActionRequest =
		C.DocumentSymbolRequest =
		C.DocumentHighlightRequest =
		C.ReferencesRequest =
		C.DefinitionRequest =
		C.SignatureHelpRequest =
		C.SignatureHelpTriggerKind =
		C.HoverRequest =
		C.CompletionResolveRequest =
		C.CompletionRequest =
		C.CompletionTriggerKind =
		C.PublishDiagnosticsNotification =
		C.WatchKind =
		C.RelativePattern =
		C.FileChangeType =
		C.DidChangeWatchedFilesNotification =
		C.WillSaveTextDocumentWaitUntilRequest =
		C.WillSaveTextDocumentNotification =
		C.TextDocumentSaveReason =
		C.DidSaveTextDocumentNotification =
		C.DidCloseTextDocumentNotification =
		C.DidChangeTextDocumentNotification =
		C.TextDocumentContentChangeEvent =
		C.DidOpenTextDocumentNotification =
		C.TextDocumentSyncKind =
		C.TelemetryEventNotification =
		C.LogMessageNotification =
		C.ShowMessageRequest =
		C.ShowMessageNotification =
		C.MessageType =
		C.DidChangeConfigurationNotification =
		C.ExitNotification =
		C.ShutdownRequest =
		C.InitializedNotification =
		C.InitializeErrorCodes =
		C.InitializeRequest =
		C.WorkDoneProgressOptions =
		C.TextDocumentRegistrationOptions =
		C.StaticRegistrationOptions =
		C.PositionEncodingKind =
		C.FailureHandlingKind =
		C.ResourceOperationKind =
		C.UnregistrationRequest =
		C.RegistrationRequest =
		C.DocumentSelector =
		C.NotebookCellTextDocumentFilter =
		C.NotebookDocumentFilter =
		C.TextDocumentFilter =
			void 0;
	C.MonikerRequest =
		C.MonikerKind =
		C.UniquenessLevel =
		C.WillDeleteFilesRequest =
		C.DidDeleteFilesNotification =
		C.WillRenameFilesRequest =
		C.DidRenameFilesNotification =
		C.WillCreateFilesRequest =
		C.DidCreateFilesNotification =
		C.FileOperationPatternKind =
		C.LinkedEditingRangeRequest =
		C.ShowDocumentRequest =
		C.SemanticTokensRegistrationType =
		C.SemanticTokensRefreshRequest =
		C.SemanticTokensRangeRequest =
		C.SemanticTokensDeltaRequest =
		C.SemanticTokensRequest =
		C.TokenFormat =
		C.CallHierarchyPrepareRequest =
		C.CallHierarchyOutgoingCallsRequest =
		C.CallHierarchyIncomingCallsRequest =
		C.WorkDoneProgressCancelNotification =
		C.WorkDoneProgressCreateRequest =
		C.WorkDoneProgress =
		C.SelectionRangeRequest =
		C.DeclarationRequest =
		C.FoldingRangeRefreshRequest =
		C.FoldingRangeRequest =
		C.ColorPresentationRequest =
		C.DocumentColorRequest =
		C.ConfigurationRequest =
		C.DidChangeWorkspaceFoldersNotification =
		C.WorkspaceFoldersRequest =
		C.TypeDefinitionRequest =
		C.ImplementationRequest =
		C.ApplyWorkspaceEditRequest =
		C.ExecuteCommandRequest =
		C.PrepareRenameRequest =
		C.RenameRequest =
		C.PrepareSupportDefaultBehavior =
		C.DocumentOnTypeFormattingRequest =
		C.DocumentRangesFormattingRequest =
		C.DocumentRangeFormattingRequest =
		C.DocumentFormattingRequest =
		C.DocumentLinkResolveRequest =
		C.DocumentLinkRequest =
		C.CodeLensRefreshRequest =
		C.CodeLensResolveRequest =
		C.CodeLensRequest =
		C.WorkspaceSymbolResolveRequest =
			void 0;
	C.InlineCompletionRequest =
		C.DidCloseNotebookDocumentNotification =
		C.DidSaveNotebookDocumentNotification =
		C.DidChangeNotebookDocumentNotification =
		C.NotebookCellArrayChange =
		C.DidOpenNotebookDocumentNotification =
		C.NotebookDocumentSyncRegistrationType =
		C.NotebookDocument =
		C.NotebookCell =
		C.ExecutionSummary =
		C.NotebookCellKind =
		C.DiagnosticRefreshRequest =
		C.WorkspaceDiagnosticRequest =
		C.DocumentDiagnosticRequest =
		C.DocumentDiagnosticReportKind =
		C.DiagnosticServerCancellationData =
		C.InlayHintRefreshRequest =
		C.InlayHintResolveRequest =
		C.InlayHintRequest =
		C.InlineValueRefreshRequest =
		C.InlineValueRequest =
		C.TypeHierarchySupertypesRequest =
		C.TypeHierarchySubtypesRequest =
		C.TypeHierarchyPrepareRequest =
			void 0;
	var j = He(),
		Dp = Hs(),
		dt = Ws(),
		yb = Gf();
	Object.defineProperty(C, 'ImplementationRequest', {
		enumerable: !0,
		get: function () {
			return yb.ImplementationRequest;
		},
	});
	var Cb = Qf();
	Object.defineProperty(C, 'TypeDefinitionRequest', {
		enumerable: !0,
		get: function () {
			return Cb.TypeDefinitionRequest;
		},
	});
	var xg = eh();
	Object.defineProperty(C, 'WorkspaceFoldersRequest', {
		enumerable: !0,
		get: function () {
			return xg.WorkspaceFoldersRequest;
		},
	});
	Object.defineProperty(C, 'DidChangeWorkspaceFoldersNotification', {
		enumerable: !0,
		get: function () {
			return xg.DidChangeWorkspaceFoldersNotification;
		},
	});
	var bb = rh();
	Object.defineProperty(C, 'ConfigurationRequest', {
		enumerable: !0,
		get: function () {
			return bb.ConfigurationRequest;
		},
	});
	var Ig = oh();
	Object.defineProperty(C, 'DocumentColorRequest', {
		enumerable: !0,
		get: function () {
			return Ig.DocumentColorRequest;
		},
	});
	Object.defineProperty(C, 'ColorPresentationRequest', {
		enumerable: !0,
		get: function () {
			return Ig.ColorPresentationRequest;
		},
	});
	var Og = uh();
	Object.defineProperty(C, 'FoldingRangeRequest', {
		enumerable: !0,
		get: function () {
			return Og.FoldingRangeRequest;
		},
	});
	Object.defineProperty(C, 'FoldingRangeRefreshRequest', {
		enumerable: !0,
		get: function () {
			return Og.FoldingRangeRefreshRequest;
		},
	});
	var _b = fh();
	Object.defineProperty(C, 'DeclarationRequest', {
		enumerable: !0,
		get: function () {
			return _b.DeclarationRequest;
		},
	});
	var wb = gh();
	Object.defineProperty(C, 'SelectionRangeRequest', {
		enumerable: !0,
		get: function () {
			return wb.SelectionRangeRequest;
		},
	});
	var Nc = Ch();
	Object.defineProperty(C, 'WorkDoneProgress', {
		enumerable: !0,
		get: function () {
			return Nc.WorkDoneProgress;
		},
	});
	Object.defineProperty(C, 'WorkDoneProgressCreateRequest', {
		enumerable: !0,
		get: function () {
			return Nc.WorkDoneProgressCreateRequest;
		},
	});
	Object.defineProperty(C, 'WorkDoneProgressCancelNotification', {
		enumerable: !0,
		get: function () {
			return Nc.WorkDoneProgressCancelNotification;
		},
	});
	var Mc = Dh();
	Object.defineProperty(C, 'CallHierarchyIncomingCallsRequest', {
		enumerable: !0,
		get: function () {
			return Mc.CallHierarchyIncomingCallsRequest;
		},
	});
	Object.defineProperty(C, 'CallHierarchyOutgoingCallsRequest', {
		enumerable: !0,
		get: function () {
			return Mc.CallHierarchyOutgoingCallsRequest;
		},
	});
	Object.defineProperty(C, 'CallHierarchyPrepareRequest', {
		enumerable: !0,
		get: function () {
			return Mc.CallHierarchyPrepareRequest;
		},
	});
	var gi = Eh();
	Object.defineProperty(C, 'TokenFormat', {
		enumerable: !0,
		get: function () {
			return gi.TokenFormat;
		},
	});
	Object.defineProperty(C, 'SemanticTokensRequest', {
		enumerable: !0,
		get: function () {
			return gi.SemanticTokensRequest;
		},
	});
	Object.defineProperty(C, 'SemanticTokensDeltaRequest', {
		enumerable: !0,
		get: function () {
			return gi.SemanticTokensDeltaRequest;
		},
	});
	Object.defineProperty(C, 'SemanticTokensRangeRequest', {
		enumerable: !0,
		get: function () {
			return gi.SemanticTokensRangeRequest;
		},
	});
	Object.defineProperty(C, 'SemanticTokensRefreshRequest', {
		enumerable: !0,
		get: function () {
			return gi.SemanticTokensRefreshRequest;
		},
	});
	Object.defineProperty(C, 'SemanticTokensRegistrationType', {
		enumerable: !0,
		get: function () {
			return gi.SemanticTokensRegistrationType;
		},
	});
	var Db = Ih();
	Object.defineProperty(C, 'ShowDocumentRequest', {
		enumerable: !0,
		get: function () {
			return Db.ShowDocumentRequest;
		},
	});
	var Rb = Nh();
	Object.defineProperty(C, 'LinkedEditingRangeRequest', {
		enumerable: !0,
		get: function () {
			return Rb.LinkedEditingRangeRequest;
		},
	});
	var Nr = Uh();
	Object.defineProperty(C, 'FileOperationPatternKind', {
		enumerable: !0,
		get: function () {
			return Nr.FileOperationPatternKind;
		},
	});
	Object.defineProperty(C, 'DidCreateFilesNotification', {
		enumerable: !0,
		get: function () {
			return Nr.DidCreateFilesNotification;
		},
	});
	Object.defineProperty(C, 'WillCreateFilesRequest', {
		enumerable: !0,
		get: function () {
			return Nr.WillCreateFilesRequest;
		},
	});
	Object.defineProperty(C, 'DidRenameFilesNotification', {
		enumerable: !0,
		get: function () {
			return Nr.DidRenameFilesNotification;
		},
	});
	Object.defineProperty(C, 'WillRenameFilesRequest', {
		enumerable: !0,
		get: function () {
			return Nr.WillRenameFilesRequest;
		},
	});
	Object.defineProperty(C, 'DidDeleteFilesNotification', {
		enumerable: !0,
		get: function () {
			return Nr.DidDeleteFilesNotification;
		},
	});
	Object.defineProperty(C, 'WillDeleteFilesRequest', {
		enumerable: !0,
		get: function () {
			return Nr.WillDeleteFilesRequest;
		},
	});
	var Lc = Gh();
	Object.defineProperty(C, 'UniquenessLevel', {
		enumerable: !0,
		get: function () {
			return Lc.UniquenessLevel;
		},
	});
	Object.defineProperty(C, 'MonikerKind', {
		enumerable: !0,
		get: function () {
			return Lc.MonikerKind;
		},
	});
	Object.defineProperty(C, 'MonikerRequest', {
		enumerable: !0,
		get: function () {
			return Lc.MonikerRequest;
		},
	});
	var Ac = Yh();
	Object.defineProperty(C, 'TypeHierarchyPrepareRequest', {
		enumerable: !0,
		get: function () {
			return Ac.TypeHierarchyPrepareRequest;
		},
	});
	Object.defineProperty(C, 'TypeHierarchySubtypesRequest', {
		enumerable: !0,
		get: function () {
			return Ac.TypeHierarchySubtypesRequest;
		},
	});
	Object.defineProperty(C, 'TypeHierarchySupertypesRequest', {
		enumerable: !0,
		get: function () {
			return Ac.TypeHierarchySupertypesRequest;
		},
	});
	var Fg = tp();
	Object.defineProperty(C, 'InlineValueRequest', {
		enumerable: !0,
		get: function () {
			return Fg.InlineValueRequest;
		},
	});
	Object.defineProperty(C, 'InlineValueRefreshRequest', {
		enumerable: !0,
		get: function () {
			return Fg.InlineValueRefreshRequest;
		},
	});
	var jc = sp();
	Object.defineProperty(C, 'InlayHintRequest', {
		enumerable: !0,
		get: function () {
			return jc.InlayHintRequest;
		},
	});
	Object.defineProperty(C, 'InlayHintResolveRequest', {
		enumerable: !0,
		get: function () {
			return jc.InlayHintResolveRequest;
		},
	});
	Object.defineProperty(C, 'InlayHintRefreshRequest', {
		enumerable: !0,
		get: function () {
			return jc.InlayHintRefreshRequest;
		},
	});
	var Ui = fp();
	Object.defineProperty(C, 'DiagnosticServerCancellationData', {
		enumerable: !0,
		get: function () {
			return Ui.DiagnosticServerCancellationData;
		},
	});
	Object.defineProperty(C, 'DocumentDiagnosticReportKind', {
		enumerable: !0,
		get: function () {
			return Ui.DocumentDiagnosticReportKind;
		},
	});
	Object.defineProperty(C, 'DocumentDiagnosticRequest', {
		enumerable: !0,
		get: function () {
			return Ui.DocumentDiagnosticRequest;
		},
	});
	Object.defineProperty(C, 'WorkspaceDiagnosticRequest', {
		enumerable: !0,
		get: function () {
			return Ui.WorkspaceDiagnosticRequest;
		},
	});
	Object.defineProperty(C, 'DiagnosticRefreshRequest', {
		enumerable: !0,
		get: function () {
			return Ui.DiagnosticRefreshRequest;
		},
	});
	var jn = Cp();
	Object.defineProperty(C, 'NotebookCellKind', {
		enumerable: !0,
		get: function () {
			return jn.NotebookCellKind;
		},
	});
	Object.defineProperty(C, 'ExecutionSummary', {
		enumerable: !0,
		get: function () {
			return jn.ExecutionSummary;
		},
	});
	Object.defineProperty(C, 'NotebookCell', {
		enumerable: !0,
		get: function () {
			return jn.NotebookCell;
		},
	});
	Object.defineProperty(C, 'NotebookDocument', {
		enumerable: !0,
		get: function () {
			return jn.NotebookDocument;
		},
	});
	Object.defineProperty(C, 'NotebookDocumentSyncRegistrationType', {
		enumerable: !0,
		get: function () {
			return jn.NotebookDocumentSyncRegistrationType;
		},
	});
	Object.defineProperty(C, 'DidOpenNotebookDocumentNotification', {
		enumerable: !0,
		get: function () {
			return jn.DidOpenNotebookDocumentNotification;
		},
	});
	Object.defineProperty(C, 'NotebookCellArrayChange', {
		enumerable: !0,
		get: function () {
			return jn.NotebookCellArrayChange;
		},
	});
	Object.defineProperty(C, 'DidChangeNotebookDocumentNotification', {
		enumerable: !0,
		get: function () {
			return jn.DidChangeNotebookDocumentNotification;
		},
	});
	Object.defineProperty(C, 'DidSaveNotebookDocumentNotification', {
		enumerable: !0,
		get: function () {
			return jn.DidSaveNotebookDocumentNotification;
		},
	});
	Object.defineProperty(C, 'DidCloseNotebookDocumentNotification', {
		enumerable: !0,
		get: function () {
			return jn.DidCloseNotebookDocumentNotification;
		},
	});
	var Sb = wp();
	Object.defineProperty(C, 'InlineCompletionRequest', {
		enumerable: !0,
		get: function () {
			return Sb.InlineCompletionRequest;
		},
	});
	var xc;
	(function (n) {
		function e(t) {
			let r = t;
			return dt.string(r) || dt.string(r.language) || dt.string(r.scheme) || dt.string(r.pattern);
		}
		n.is = e;
	})(xc || (C.TextDocumentFilter = xc = {}));
	var Ic;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				dt.objectLiteral(r) &&
				(dt.string(r.notebookType) || dt.string(r.scheme) || dt.string(r.pattern))
			);
		}
		n.is = e;
	})(Ic || (C.NotebookDocumentFilter = Ic = {}));
	var Oc;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				dt.objectLiteral(r) &&
				(dt.string(r.notebook) || Ic.is(r.notebook)) &&
				(r.language === void 0 || dt.string(r.language))
			);
		}
		n.is = e;
	})(Oc || (C.NotebookCellTextDocumentFilter = Oc = {}));
	var Fc;
	(function (n) {
		function e(t) {
			if (!Array.isArray(t)) return !1;
			for (let r of t) if (!dt.string(r) && !xc.is(r) && !Oc.is(r)) return !1;
			return !0;
		}
		n.is = e;
	})(Fc || (C.DocumentSelector = Fc = {}));
	var Rp;
	(function (n) {
		((n.method = 'client/registerCapability'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Rp || (C.RegistrationRequest = Rp = {}));
	var Sp;
	(function (n) {
		((n.method = 'client/unregisterCapability'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Sp || (C.UnregistrationRequest = Sp = {}));
	var Tp;
	(function (n) {
		((n.Create = 'create'), (n.Rename = 'rename'), (n.Delete = 'delete'));
	})(Tp || (C.ResourceOperationKind = Tp = {}));
	var Pp;
	(function (n) {
		((n.Abort = 'abort'),
			(n.Transactional = 'transactional'),
			(n.TextOnlyTransactional = 'textOnlyTransactional'),
			(n.Undo = 'undo'));
	})(Pp || (C.FailureHandlingKind = Pp = {}));
	var qp;
	(function (n) {
		((n.UTF8 = 'utf-8'), (n.UTF16 = 'utf-16'), (n.UTF32 = 'utf-32'));
	})(qp || (C.PositionEncodingKind = qp = {}));
	var Ep;
	(function (n) {
		function e(t) {
			let r = t;
			return r && dt.string(r.id) && r.id.length > 0;
		}
		n.hasId = e;
	})(Ep || (C.StaticRegistrationOptions = Ep = {}));
	var kp;
	(function (n) {
		function e(t) {
			let r = t;
			return r && (r.documentSelector === null || Fc.is(r.documentSelector));
		}
		n.is = e;
	})(kp || (C.TextDocumentRegistrationOptions = kp = {}));
	var xp;
	(function (n) {
		function e(r) {
			let i = r;
			return (
				dt.objectLiteral(i) && (i.workDoneProgress === void 0 || dt.boolean(i.workDoneProgress))
			);
		}
		n.is = e;
		function t(r) {
			let i = r;
			return i && dt.boolean(i.workDoneProgress);
		}
		n.hasWorkDoneProgress = t;
	})(xp || (C.WorkDoneProgressOptions = xp = {}));
	var Ip;
	(function (n) {
		((n.method = 'initialize'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Ip || (C.InitializeRequest = Ip = {}));
	var Op;
	(function (n) {
		n.unknownProtocolVersion = 1;
	})(Op || (C.InitializeErrorCodes = Op = {}));
	var Fp;
	(function (n) {
		((n.method = 'initialized'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Fp || (C.InitializedNotification = Fp = {}));
	var Np;
	(function (n) {
		((n.method = 'shutdown'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType0(n.method)));
	})(Np || (C.ShutdownRequest = Np = {}));
	var Mp;
	(function (n) {
		((n.method = 'exit'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType0(n.method)));
	})(Mp || (C.ExitNotification = Mp = {}));
	var Lp;
	(function (n) {
		((n.method = 'workspace/didChangeConfiguration'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Lp || (C.DidChangeConfigurationNotification = Lp = {}));
	var Ap;
	(function (n) {
		((n.Error = 1), (n.Warning = 2), (n.Info = 3), (n.Log = 4), (n.Debug = 5));
	})(Ap || (C.MessageType = Ap = {}));
	var jp;
	(function (n) {
		((n.method = 'window/showMessage'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(jp || (C.ShowMessageNotification = jp = {}));
	var $p;
	(function (n) {
		((n.method = 'window/showMessageRequest'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolRequestType(n.method)));
	})($p || (C.ShowMessageRequest = $p = {}));
	var Hp;
	(function (n) {
		((n.method = 'window/logMessage'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Hp || (C.LogMessageNotification = Hp = {}));
	var Wp;
	(function (n) {
		((n.method = 'telemetry/event'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Wp || (C.TelemetryEventNotification = Wp = {}));
	var Up;
	(function (n) {
		((n.None = 0), (n.Full = 1), (n.Incremental = 2));
	})(Up || (C.TextDocumentSyncKind = Up = {}));
	var Kp;
	(function (n) {
		((n.method = 'textDocument/didOpen'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Kp || (C.DidOpenTextDocumentNotification = Kp = {}));
	var zp;
	(function (n) {
		function e(r) {
			let i = r;
			return (
				i != null &&
				typeof i.text == 'string' &&
				i.range !== void 0 &&
				(i.rangeLength === void 0 || typeof i.rangeLength == 'number')
			);
		}
		n.isIncremental = e;
		function t(r) {
			let i = r;
			return (
				i != null && typeof i.text == 'string' && i.range === void 0 && i.rangeLength === void 0
			);
		}
		n.isFull = t;
	})(zp || (C.TextDocumentContentChangeEvent = zp = {}));
	var Vp;
	(function (n) {
		((n.method = 'textDocument/didChange'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Vp || (C.DidChangeTextDocumentNotification = Vp = {}));
	var Bp;
	(function (n) {
		((n.method = 'textDocument/didClose'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Bp || (C.DidCloseTextDocumentNotification = Bp = {}));
	var Gp;
	(function (n) {
		((n.method = 'textDocument/didSave'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Gp || (C.DidSaveTextDocumentNotification = Gp = {}));
	var Xp;
	(function (n) {
		((n.Manual = 1), (n.AfterDelay = 2), (n.FocusOut = 3));
	})(Xp || (C.TextDocumentSaveReason = Xp = {}));
	var Jp;
	(function (n) {
		((n.method = 'textDocument/willSave'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Jp || (C.WillSaveTextDocumentNotification = Jp = {}));
	var Qp;
	(function (n) {
		((n.method = 'textDocument/willSaveWaitUntil'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Qp || (C.WillSaveTextDocumentWaitUntilRequest = Qp = {}));
	var Yp;
	(function (n) {
		((n.method = 'workspace/didChangeWatchedFiles'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(Yp || (C.DidChangeWatchedFilesNotification = Yp = {}));
	var Zp;
	(function (n) {
		((n.Created = 1), (n.Changed = 2), (n.Deleted = 3));
	})(Zp || (C.FileChangeType = Zp = {}));
	var eg;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				dt.objectLiteral(r) &&
				(Dp.URI.is(r.baseUri) || Dp.WorkspaceFolder.is(r.baseUri)) &&
				dt.string(r.pattern)
			);
		}
		n.is = e;
	})(eg || (C.RelativePattern = eg = {}));
	var tg;
	(function (n) {
		((n.Create = 1), (n.Change = 2), (n.Delete = 4));
	})(tg || (C.WatchKind = tg = {}));
	var ng;
	(function (n) {
		((n.method = 'textDocument/publishDiagnostics'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolNotificationType(n.method)));
	})(ng || (C.PublishDiagnosticsNotification = ng = {}));
	var rg;
	(function (n) {
		((n.Invoked = 1), (n.TriggerCharacter = 2), (n.TriggerForIncompleteCompletions = 3));
	})(rg || (C.CompletionTriggerKind = rg = {}));
	var ig;
	(function (n) {
		((n.method = 'textDocument/completion'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(ig || (C.CompletionRequest = ig = {}));
	var sg;
	(function (n) {
		((n.method = 'completionItem/resolve'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(sg || (C.CompletionResolveRequest = sg = {}));
	var og;
	(function (n) {
		((n.method = 'textDocument/hover'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(og || (C.HoverRequest = og = {}));
	var ag;
	(function (n) {
		((n.Invoked = 1), (n.TriggerCharacter = 2), (n.ContentChange = 3));
	})(ag || (C.SignatureHelpTriggerKind = ag = {}));
	var cg;
	(function (n) {
		((n.method = 'textDocument/signatureHelp'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(cg || (C.SignatureHelpRequest = cg = {}));
	var ug;
	(function (n) {
		((n.method = 'textDocument/definition'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(ug || (C.DefinitionRequest = ug = {}));
	var lg;
	(function (n) {
		((n.method = 'textDocument/references'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(lg || (C.ReferencesRequest = lg = {}));
	var dg;
	(function (n) {
		((n.method = 'textDocument/documentHighlight'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(dg || (C.DocumentHighlightRequest = dg = {}));
	var fg;
	(function (n) {
		((n.method = 'textDocument/documentSymbol'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(fg || (C.DocumentSymbolRequest = fg = {}));
	var hg;
	(function (n) {
		((n.method = 'textDocument/codeAction'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(hg || (C.CodeActionRequest = hg = {}));
	var pg;
	(function (n) {
		((n.method = 'codeAction/resolve'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(pg || (C.CodeActionResolveRequest = pg = {}));
	var gg;
	(function (n) {
		((n.method = 'workspace/symbol'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(gg || (C.WorkspaceSymbolRequest = gg = {}));
	var mg;
	(function (n) {
		((n.method = 'workspaceSymbol/resolve'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(mg || (C.WorkspaceSymbolResolveRequest = mg = {}));
	var vg;
	(function (n) {
		((n.method = 'textDocument/codeLens'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(vg || (C.CodeLensRequest = vg = {}));
	var yg;
	(function (n) {
		((n.method = 'codeLens/resolve'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(yg || (C.CodeLensResolveRequest = yg = {}));
	var Cg;
	(function (n) {
		((n.method = 'workspace/codeLens/refresh'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolRequestType0(n.method)));
	})(Cg || (C.CodeLensRefreshRequest = Cg = {}));
	var bg;
	(function (n) {
		((n.method = 'textDocument/documentLink'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(bg || (C.DocumentLinkRequest = bg = {}));
	var _g;
	(function (n) {
		((n.method = 'documentLink/resolve'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(_g || (C.DocumentLinkResolveRequest = _g = {}));
	var wg;
	(function (n) {
		((n.method = 'textDocument/formatting'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(wg || (C.DocumentFormattingRequest = wg = {}));
	var Dg;
	(function (n) {
		((n.method = 'textDocument/rangeFormatting'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Dg || (C.DocumentRangeFormattingRequest = Dg = {}));
	var Rg;
	(function (n) {
		((n.method = 'textDocument/rangesFormatting'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Rg || (C.DocumentRangesFormattingRequest = Rg = {}));
	var Sg;
	(function (n) {
		((n.method = 'textDocument/onTypeFormatting'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Sg || (C.DocumentOnTypeFormattingRequest = Sg = {}));
	var Tg;
	(function (n) {
		n.Identifier = 1;
	})(Tg || (C.PrepareSupportDefaultBehavior = Tg = {}));
	var Pg;
	(function (n) {
		((n.method = 'textDocument/rename'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Pg || (C.RenameRequest = Pg = {}));
	var qg;
	(function (n) {
		((n.method = 'textDocument/prepareRename'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(qg || (C.PrepareRenameRequest = qg = {}));
	var Eg;
	(function (n) {
		((n.method = 'workspace/executeCommand'),
			(n.messageDirection = j.MessageDirection.clientToServer),
			(n.type = new j.ProtocolRequestType(n.method)));
	})(Eg || (C.ExecuteCommandRequest = Eg = {}));
	var kg;
	(function (n) {
		((n.method = 'workspace/applyEdit'),
			(n.messageDirection = j.MessageDirection.serverToClient),
			(n.type = new j.ProtocolRequestType('workspace/applyEdit')));
	})(kg || (C.ApplyWorkspaceEditRequest = kg = {}));
});
var Lg = E((ro) => {
	'use strict';
	Object.defineProperty(ro, '__esModule', { value: !0 });
	ro.createProtocolConnection = void 0;
	var Mg = Fr();
	function Tb(n, e, t, r) {
		return (
			Mg.ConnectionStrategy.is(r) && (r = { connectionStrategy: r }),
			(0, Mg.createMessageConnection)(n, e, t, r)
		);
	}
	ro.createProtocolConnection = Tb;
});
var jg = E((jt) => {
	'use strict';
	var Pb =
			(jt && jt.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		io =
			(jt && jt.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && Pb(e, n, t);
			};
	Object.defineProperty(jt, '__esModule', { value: !0 });
	jt.LSPErrorCodes = jt.createProtocolConnection = void 0;
	io(Fr(), jt);
	io(Hs(), jt);
	io(He(), jt);
	io(Ng(), jt);
	var qb = Lg();
	Object.defineProperty(jt, 'createProtocolConnection', {
		enumerable: !0,
		get: function () {
			return qb.createProtocolConnection;
		},
	});
	var Ag;
	(function (n) {
		((n.lspReservedErrorRangeStart = -32899),
			(n.RequestFailed = -32803),
			(n.ServerCancelled = -32802),
			(n.ContentModified = -32801),
			(n.RequestCancelled = -32800),
			(n.lspReservedErrorRangeEnd = -32800));
	})(Ag || (jt.LSPErrorCodes = Ag = {}));
});
var ee = E(($n) => {
	'use strict';
	var Eb =
			($n && $n.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		$g =
			($n && $n.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && Eb(e, n, t);
			};
	Object.defineProperty($n, '__esModule', { value: !0 });
	$n.createProtocolConnection = void 0;
	var kb = Dc();
	$g(Dc(), $n);
	$g(jg(), $n);
	function xb(n, e, t, r) {
		return (0, kb.createMessageConnection)(n, e, t, r);
	}
	$n.createProtocolConnection = xb;
});
var Zg = E((Re) => {
	'use strict';
	var Ib =
			(Re && Re.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		Ob =
			(Re && Re.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && Ib(e, n, t);
			};
	Object.defineProperty(Re, '__esModule', { value: !0 });
	Re.GetVirtualCodeRequest =
		Re.GetVirtualFileRequest =
		Re.GetServicePluginsRequest =
		Re.UpdateServicePluginStateNotification =
		Re.UpdateVirtualCodeStateNotification =
		Re.DocumentDrop_DataTransferItemFileDataRequest =
		Re.DocumentDrop_DataTransferItemAsStringRequest =
		Re.DocumentDropRequest =
		Re.ReloadProjectNotification =
		Re.AutoInsertRequest =
		Re.GetMatchTsConfigRequest =
		Re.FindFileReferenceRequest =
			void 0;
	var an = ee();
	Ob(ee(), Re);
	var Hg;
	(function (n) {
		n.type = new an.RequestType('volar/client/findFileReference');
	})(Hg || (Re.FindFileReferenceRequest = Hg = {}));
	var Wg;
	(function (n) {
		n.type = new an.RequestType('volar/client/tsconfig');
	})(Wg || (Re.GetMatchTsConfigRequest = Wg = {}));
	var Ug;
	(function (n) {
		n.type = new an.RequestType('volar/client/autoInsert');
	})(Ug || (Re.AutoInsertRequest = Ug = {}));
	var Kg;
	(function (n) {
		n.type = new an.NotificationType('volar/client/reloadProject');
	})(Kg || (Re.ReloadProjectNotification = Kg = {}));
	var zg;
	(function (n) {
		n.type = new an.RequestType('volar/client/documentDrop');
	})(zg || (Re.DocumentDropRequest = zg = {}));
	var Vg;
	(function (n) {
		n.type = new an.RequestType('volar/client/documentDrop/asString');
	})(Vg || (Re.DocumentDrop_DataTransferItemAsStringRequest = Vg = {}));
	var Bg;
	(function (n) {
		n.type = new an.RequestType('volar/client/documentDrop/fileData');
	})(Bg || (Re.DocumentDrop_DataTransferItemFileDataRequest = Bg = {}));
	var Gg;
	(function (n) {
		n.type = new an.NotificationType('volar/client/labs/updateVirtualFileState');
	})(Gg || (Re.UpdateVirtualCodeStateNotification = Gg = {}));
	var Xg;
	(function (n) {
		n.type = new an.NotificationType('volar/client/labs/updateServicePluginState');
	})(Xg || (Re.UpdateServicePluginStateNotification = Xg = {}));
	var Jg;
	(function (n) {
		n.type = new an.RequestType('volar/client/servicePlugins');
	})(Jg || (Re.GetServicePluginsRequest = Jg = {}));
	var Qg;
	(function (n) {
		n.type = new an.RequestType('volar/client/virtualFiles');
	})(Qg || (Re.GetVirtualFileRequest = Qg = {}));
	var Yg;
	(function (n) {
		n.type = new an.RequestType('volar/client/virtualFile');
	})(Yg || (Re.GetVirtualCodeRequest = Yg = {}));
});
var cn = E((Ye) => {
	'use strict';
	Object.defineProperty(Ye, '__esModule', { value: !0 });
	Ye.asPromise =
		Ye.thenable =
		Ye.typedArray =
		Ye.stringArray =
		Ye.array =
		Ye.func =
		Ye.error =
		Ye.number =
		Ye.string =
		Ye.boolean =
			void 0;
	function Fb(n) {
		return n === !0 || n === !1;
	}
	Ye.boolean = Fb;
	function em(n) {
		return typeof n == 'string' || n instanceof String;
	}
	Ye.string = em;
	function Nb(n) {
		return typeof n == 'number' || n instanceof Number;
	}
	Ye.number = Nb;
	function Mb(n) {
		return n instanceof Error;
	}
	Ye.error = Mb;
	function tm(n) {
		return typeof n == 'function';
	}
	Ye.func = tm;
	function nm(n) {
		return Array.isArray(n);
	}
	Ye.array = nm;
	function Lb(n) {
		return nm(n) && n.every((e) => em(e));
	}
	Ye.stringArray = Lb;
	function Ab(n, e) {
		return Array.isArray(n) && n.every(e);
	}
	Ye.typedArray = Ab;
	function rm(n) {
		return n && tm(n.then);
	}
	Ye.thenable = rm;
	function jb(n) {
		return n instanceof Promise
			? n
			: rm(n)
				? new Promise((e, t) => {
						n.then(
							(r) => e(r),
							(r) => t(r),
						);
					})
				: Promise.resolve(n);
	}
	Ye.asPromise = jb;
});
var so = E((Rt) => {
	'use strict';
	Object.defineProperty(Rt, '__esModule', { value: !0 });
	Rt.forEach =
		Rt.mapAsync =
		Rt.map =
		Rt.clearTestMode =
		Rt.setTestMode =
		Rt.Semaphore =
		Rt.Delayer =
			void 0;
	var zi = ee(),
		$c = class {
			constructor(e) {
				((this.defaultDelay = e),
					(this.timeout = void 0),
					(this.completionPromise = void 0),
					(this.onSuccess = void 0),
					(this.task = void 0));
			}
			trigger(e, t = this.defaultDelay) {
				return (
					(this.task = e),
					t >= 0 && this.cancelTimeout(),
					this.completionPromise ||
						(this.completionPromise = new Promise((r) => {
							this.onSuccess = r;
						}).then(() => {
							((this.completionPromise = void 0), (this.onSuccess = void 0));
							var r = this.task();
							return ((this.task = void 0), r);
						})),
					(t >= 0 || this.timeout === void 0) &&
						(this.timeout = (0, zi.RAL)().timer.setTimeout(
							() => {
								((this.timeout = void 0), this.onSuccess(void 0));
							},
							t >= 0 ? t : this.defaultDelay,
						)),
					this.completionPromise
				);
			}
			forceDelivery() {
				if (!this.completionPromise) return;
				this.cancelTimeout();
				let e = this.task();
				return (
					(this.completionPromise = void 0),
					(this.onSuccess = void 0),
					(this.task = void 0),
					e
				);
			}
			isTriggered() {
				return this.timeout !== void 0;
			}
			cancel() {
				(this.cancelTimeout(), (this.completionPromise = void 0));
			}
			cancelTimeout() {
				this.timeout !== void 0 && (this.timeout.dispose(), (this.timeout = void 0));
			}
		};
	Rt.Delayer = $c;
	var Hc = class {
		constructor(e = 1) {
			if (e <= 0) throw new Error('Capacity must be greater than 0');
			((this._capacity = e), (this._active = 0), (this._waiting = []));
		}
		lock(e) {
			return new Promise((t, r) => {
				(this._waiting.push({ thunk: e, resolve: t, reject: r }), this.runNext());
			});
		}
		get active() {
			return this._active;
		}
		runNext() {
			this._waiting.length === 0 ||
				this._active === this._capacity ||
				(0, zi.RAL)().timer.setImmediate(() => this.doRunNext());
		}
		doRunNext() {
			if (this._waiting.length === 0 || this._active === this._capacity) return;
			let e = this._waiting.shift();
			if ((this._active++, this._active > this._capacity)) throw new Error('To many thunks active');
			try {
				let t = e.thunk();
				t instanceof Promise
					? t.then(
							(r) => {
								(this._active--, e.resolve(r), this.runNext());
							},
							(r) => {
								(this._active--, e.reject(r), this.runNext());
							},
						)
					: (this._active--, e.resolve(t), this.runNext());
			} catch (t) {
				(this._active--, e.reject(t), this.runNext());
			}
		}
	};
	Rt.Semaphore = Hc;
	var Wc = !1;
	function $b() {
		Wc = !0;
	}
	Rt.setTestMode = $b;
	function Hb() {
		Wc = !1;
	}
	Rt.clearTestMode = Hb;
	var im = 15,
		Ki = class {
			constructor(e = im) {
				((this.yieldAfter = Wc === !0 ? Math.max(e, 2) : Math.max(e, im)),
					(this.startTime = Date.now()),
					(this.counter = 0),
					(this.total = 0),
					(this.counterInterval = 1));
			}
			start() {
				((this.counter = 0),
					(this.total = 0),
					(this.counterInterval = 1),
					(this.startTime = Date.now()));
			}
			shouldYield() {
				if (++this.counter >= this.counterInterval) {
					let e = Date.now() - this.startTime,
						t = Math.max(0, this.yieldAfter - e);
					if (((this.total += this.counter), (this.counter = 0), e >= this.yieldAfter || t <= 1))
						return ((this.counterInterval = 1), (this.total = 0), !0);
					switch (e) {
						case 0:
						case 1:
							this.counterInterval = this.total * 2;
							break;
					}
				}
				return !1;
			}
		};
	async function Wb(n, e, t, r) {
		if (n.length === 0) return [];
		let i = new Array(n.length),
			s = new Ki(r?.yieldAfter);
		function o(u) {
			s.start();
			for (let l = u; l < n.length; l++)
				if (((i[l] = e(n[l])), s.shouldYield()))
					return (r?.yieldCallback && r.yieldCallback(), l + 1);
			return -1;
		}
		let a = o(0);
		for (; a !== -1 && !(t !== void 0 && t.isCancellationRequested); )
			a = await new Promise((u) => {
				(0, zi.RAL)().timer.setImmediate(() => {
					u(o(a));
				});
			});
		return i;
	}
	Rt.map = Wb;
	async function Ub(n, e, t, r) {
		if (n.length === 0) return [];
		let i = new Array(n.length),
			s = new Ki(r?.yieldAfter);
		async function o(u) {
			s.start();
			for (let l = u; l < n.length; l++)
				if (((i[l] = await e(n[l], t)), s.shouldYield()))
					return (r?.yieldCallback && r.yieldCallback(), l + 1);
			return -1;
		}
		let a = await o(0);
		for (; a !== -1 && !(t !== void 0 && t.isCancellationRequested); )
			a = await new Promise((u) => {
				(0, zi.RAL)().timer.setImmediate(() => {
					u(o(a));
				});
			});
		return i;
	}
	Rt.mapAsync = Ub;
	async function Kb(n, e, t, r) {
		if (n.length === 0) return;
		let i = new Ki(r?.yieldAfter);
		function s(a) {
			i.start();
			for (let u = a; u < n.length; u++)
				if ((e(n[u]), i.shouldYield())) return (r?.yieldCallback && r.yieldCallback(), u + 1);
			return -1;
		}
		let o = s(0);
		for (; o !== -1 && !(t !== void 0 && t.isCancellationRequested); )
			o = await new Promise((a) => {
				(0, zi.RAL)().timer.setImmediate(() => {
					a(s(o));
				});
			});
	}
	Rt.forEach = Kb;
});
var zc = E((Kc) => {
	'use strict';
	Object.defineProperty(Kc, '__esModule', { value: !0 });
	var zb = require('vscode'),
		Uc = class extends zb.CompletionItem {
			constructor(e) {
				super(e);
			}
		};
	Kc.default = Uc;
});
var Gc = E((Bc) => {
	'use strict';
	Object.defineProperty(Bc, '__esModule', { value: !0 });
	var Vb = require('vscode'),
		Vc = class extends Vb.CodeLens {
			constructor(e) {
				super(e);
			}
		};
	Bc.default = Vc;
});
var Qc = E((Jc) => {
	'use strict';
	Object.defineProperty(Jc, '__esModule', { value: !0 });
	var Bb = require('vscode'),
		Xc = class extends Bb.DocumentLink {
			constructor(e, t) {
				super(e, t);
			}
		};
	Jc.default = Xc;
});
var eu = E((Zc) => {
	'use strict';
	Object.defineProperty(Zc, '__esModule', { value: !0 });
	var Gb = require('vscode'),
		Yc = class extends Gb.CodeAction {
			constructor(e, t) {
				(super(e), (this.data = t));
			}
		};
	Zc.default = Yc;
});
var ru = E((mi) => {
	'use strict';
	Object.defineProperty(mi, '__esModule', { value: !0 });
	mi.ProtocolDiagnostic = mi.DiagnosticCode = void 0;
	var Xb = require('vscode'),
		tu = cn(),
		sm;
	(function (n) {
		function e(t) {
			let r = t;
			return r != null && (tu.number(r.value) || tu.string(r.value)) && tu.string(r.target);
		}
		n.is = e;
	})(sm || (mi.DiagnosticCode = sm = {}));
	var nu = class extends Xb.Diagnostic {
		constructor(e, t, r, i) {
			(super(e, t, r), (this.data = i), (this.hasDiagnosticCode = !1));
		}
	};
	mi.ProtocolDiagnostic = nu;
});
var ou = E((su) => {
	'use strict';
	Object.defineProperty(su, '__esModule', { value: !0 });
	var Jb = require('vscode'),
		iu = class extends Jb.CallHierarchyItem {
			constructor(e, t, r, i, s, o, a) {
				(super(e, t, r, i, s, o), a !== void 0 && (this.data = a));
			}
		};
	su.default = iu;
});
var uu = E((cu) => {
	'use strict';
	Object.defineProperty(cu, '__esModule', { value: !0 });
	var Qb = require('vscode'),
		au = class extends Qb.TypeHierarchyItem {
			constructor(e, t, r, i, s, o, a) {
				(super(e, t, r, i, s, o), a !== void 0 && (this.data = a));
			}
		};
	cu.default = au;
});
var fu = E((du) => {
	'use strict';
	Object.defineProperty(du, '__esModule', { value: !0 });
	var oo = require('vscode'),
		lu = class extends oo.SymbolInformation {
			constructor(e, t, r, i, s) {
				let o = !(i instanceof oo.Uri);
				(super(e, t, r, o ? i : new oo.Location(i, new oo.Range(0, 0, 0, 0))),
					(this.hasRange = o),
					s !== void 0 && (this.data = s));
			}
		};
	du.default = lu;
});
var gu = E((pu) => {
	'use strict';
	Object.defineProperty(pu, '__esModule', { value: !0 });
	var Yb = require('vscode'),
		hu = class extends Yb.InlayHint {
			constructor(e, t, r) {
				super(e, t, r);
			}
		};
	pu.default = hu;
});
var um = E((ao) => {
	'use strict';
	Object.defineProperty(ao, '__esModule', { value: !0 });
	ao.createConverter = void 0;
	var ot = require('vscode'),
		ne = ee(),
		Mr = cn(),
		om = so(),
		Zb = zc(),
		e_ = Gc(),
		t_ = Qc(),
		am = eu(),
		cm = ru(),
		n_ = ou(),
		r_ = uu(),
		i_ = fu(),
		s_ = gu(),
		mu;
	(function (n) {
		function e(t) {
			let r = t;
			return r && !!r.inserting && !!r.replacing;
		}
		n.is = e;
	})(mu || (mu = {}));
	function o_(n) {
		let t = n || ((f) => f.toString());
		function r(f) {
			return t(f);
		}
		function i(f) {
			return { uri: t(f.uri) };
		}
		function s(f) {
			return { uri: t(f.uri), languageId: f.languageId, version: f.version, text: f.getText() };
		}
		function o(f) {
			return { uri: t(f.uri), version: f.version };
		}
		function a(f) {
			return { textDocument: s(f) };
		}
		function u(f) {
			let k = f;
			return !!k.document && !!k.contentChanges;
		}
		function l(f) {
			let k = f;
			return !!k.uri && !!k.version;
		}
		function p(f, k, V) {
			if (l(f))
				return {
					textDocument: { uri: t(f.uri), version: f.version },
					contentChanges: [{ text: f.getText() }],
				};
			if (u(f)) {
				let we = k,
					S = V;
				return {
					textDocument: { uri: t(we), version: S },
					contentChanges: f.contentChanges.map((_) => {
						let w = _.range;
						return {
							range: {
								start: { line: w.start.line, character: w.start.character },
								end: { line: w.end.line, character: w.end.character },
							},
							rangeLength: _.rangeLength,
							text: _.text,
						};
					}),
				};
			} else throw Error('Unsupported text document change parameter');
		}
		function m(f) {
			return { textDocument: i(f) };
		}
		function g(f, k = !1) {
			let V = { textDocument: i(f) };
			return (k && (V.text = f.getText()), V);
		}
		function D(f) {
			switch (f) {
				case ot.TextDocumentSaveReason.Manual:
					return ne.TextDocumentSaveReason.Manual;
				case ot.TextDocumentSaveReason.AfterDelay:
					return ne.TextDocumentSaveReason.AfterDelay;
				case ot.TextDocumentSaveReason.FocusOut:
					return ne.TextDocumentSaveReason.FocusOut;
			}
			return ne.TextDocumentSaveReason.Manual;
		}
		function y(f) {
			return { textDocument: i(f.document), reason: D(f.reason) };
		}
		function P(f) {
			return { files: f.files.map((k) => ({ uri: t(k) })) };
		}
		function q(f) {
			return { files: f.files.map((k) => ({ oldUri: t(k.oldUri), newUri: t(k.newUri) })) };
		}
		function N(f) {
			return { files: f.files.map((k) => ({ uri: t(k) })) };
		}
		function L(f) {
			return { files: f.files.map((k) => ({ uri: t(k) })) };
		}
		function M(f) {
			return { files: f.files.map((k) => ({ oldUri: t(k.oldUri), newUri: t(k.newUri) })) };
		}
		function H(f) {
			return { files: f.files.map((k) => ({ uri: t(k) })) };
		}
		function X(f, k) {
			return { textDocument: i(f), position: pt(k) };
		}
		function de(f) {
			switch (f) {
				case ot.CompletionTriggerKind.TriggerCharacter:
					return ne.CompletionTriggerKind.TriggerCharacter;
				case ot.CompletionTriggerKind.TriggerForIncompleteCompletions:
					return ne.CompletionTriggerKind.TriggerForIncompleteCompletions;
				default:
					return ne.CompletionTriggerKind.Invoked;
			}
		}
		function B(f, k, V) {
			return {
				textDocument: i(f),
				position: pt(k),
				context: { triggerKind: de(V.triggerKind), triggerCharacter: V.triggerCharacter },
			};
		}
		function Z(f) {
			switch (f) {
				case ot.SignatureHelpTriggerKind.Invoke:
					return ne.SignatureHelpTriggerKind.Invoked;
				case ot.SignatureHelpTriggerKind.TriggerCharacter:
					return ne.SignatureHelpTriggerKind.TriggerCharacter;
				case ot.SignatureHelpTriggerKind.ContentChange:
					return ne.SignatureHelpTriggerKind.ContentChange;
			}
		}
		function ce(f) {
			return { label: f.label };
		}
		function et(f) {
			return f.map(ce);
		}
		function Xe(f) {
			return { label: f.label, parameters: et(f.parameters) };
		}
		function rt(f) {
			return f.map(Xe);
		}
		function tn(f) {
			return f === void 0
				? f
				: {
						signatures: rt(f.signatures),
						activeSignature: f.activeSignature,
						activeParameter: f.activeParameter,
					};
		}
		function qt(f, k, V) {
			return {
				textDocument: i(f),
				position: pt(k),
				context: {
					isRetrigger: V.isRetrigger,
					triggerCharacter: V.triggerCharacter,
					triggerKind: Z(V.triggerKind),
					activeSignatureHelp: tn(V.activeSignatureHelp),
				},
			};
		}
		function pt(f) {
			return { line: f.line, character: f.character };
		}
		function gt(f) {
			return f == null
				? f
				: {
						line: f.line > ne.uinteger.MAX_VALUE ? ne.uinteger.MAX_VALUE : f.line,
						character: f.character > ne.uinteger.MAX_VALUE ? ne.uinteger.MAX_VALUE : f.character,
					};
		}
		function gn(f, k) {
			return om.map(f, gt, k);
		}
		function En(f) {
			return f.map(gt);
		}
		function Me(f) {
			return f == null ? f : { start: gt(f.start), end: gt(f.end) };
		}
		function Ft(f) {
			return f.map(Me);
		}
		function Et(f) {
			return f == null ? f : ne.Location.create(r(f.uri), Me(f.range));
		}
		function mt(f) {
			switch (f) {
				case ot.DiagnosticSeverity.Error:
					return ne.DiagnosticSeverity.Error;
				case ot.DiagnosticSeverity.Warning:
					return ne.DiagnosticSeverity.Warning;
				case ot.DiagnosticSeverity.Information:
					return ne.DiagnosticSeverity.Information;
				case ot.DiagnosticSeverity.Hint:
					return ne.DiagnosticSeverity.Hint;
			}
		}
		function cr(f) {
			if (!f) return;
			let k = [];
			for (let V of f) {
				let we = kn(V);
				we !== void 0 && k.push(we);
			}
			return k.length > 0 ? k : void 0;
		}
		function kn(f) {
			switch (f) {
				case ot.DiagnosticTag.Unnecessary:
					return ne.DiagnosticTag.Unnecessary;
				case ot.DiagnosticTag.Deprecated:
					return ne.DiagnosticTag.Deprecated;
				default:
					return;
			}
		}
		function xn(f) {
			return { message: f.message, location: Et(f.location) };
		}
		function Vn(f) {
			return f.map(xn);
		}
		function ur(f) {
			if (f != null)
				return Mr.number(f) || Mr.string(f) ? f : { value: f.value, target: r(f.target) };
		}
		function In(f) {
			let k = ne.Diagnostic.create(Me(f.range), f.message),
				V = f instanceof cm.ProtocolDiagnostic ? f : void 0;
			V !== void 0 && V.data !== void 0 && (k.data = V.data);
			let we = ur(f.code);
			return (
				cm.DiagnosticCode.is(we)
					? V !== void 0 && V.hasDiagnosticCode
						? (k.code = we)
						: ((k.code = we.value), (k.codeDescription = { href: we.target }))
					: (k.code = we),
				Mr.number(f.severity) && (k.severity = mt(f.severity)),
				Array.isArray(f.tags) && (k.tags = cr(f.tags)),
				f.relatedInformation && (k.relatedInformation = Vn(f.relatedInformation)),
				f.source && (k.source = f.source),
				k
			);
		}
		function mn(f, k) {
			return f == null ? f : om.map(f, In, k);
		}
		function vn(f) {
			return f == null ? f : f.map(In);
		}
		function On(f, k) {
			switch (f) {
				case '$string':
					return k;
				case ne.MarkupKind.PlainText:
					return { kind: f, value: k };
				case ne.MarkupKind.Markdown:
					return { kind: f, value: k.value };
				default:
					return `Unsupported Markup content received. Kind is: ${f}`;
			}
		}
		function it(f) {
			switch (f) {
				case ot.CompletionItemTag.Deprecated:
					return ne.CompletionItemTag.Deprecated;
			}
		}
		function Bn(f) {
			if (f === void 0) return f;
			let k = [];
			for (let V of f) {
				let we = it(V);
				we !== void 0 && k.push(we);
			}
			return k;
		}
		function yn(f, k) {
			return k !== void 0 ? k : f + 1;
		}
		function nn(f, k = !1) {
			let V, we;
			Mr.string(f.label)
				? (V = f.label)
				: ((V = f.label.label),
					k &&
						(f.label.detail !== void 0 || f.label.description !== void 0) &&
						(we = { detail: f.label.detail, description: f.label.description }));
			let S = { label: V };
			we !== void 0 && (S.labelDetails = we);
			let h = f instanceof Zb.default ? f : void 0;
			(f.detail && (S.detail = f.detail),
				f.documentation &&
					(!h || h.documentationFormat === '$string'
						? (S.documentation = f.documentation)
						: (S.documentation = On(h.documentationFormat, f.documentation))),
				f.filterText && (S.filterText = f.filterText),
				lr(S, f),
				Mr.number(f.kind) && (S.kind = yn(f.kind, h && h.originalItemKind)),
				f.sortText && (S.sortText = f.sortText),
				f.additionalTextEdits && (S.additionalTextEdits = tt(f.additionalTextEdits)),
				f.commitCharacters && (S.commitCharacters = f.commitCharacters.slice()),
				f.command && (S.command = U(f.command)),
				(f.preselect === !0 || f.preselect === !1) && (S.preselect = f.preselect));
			let _ = Bn(f.tags);
			if (h) {
				if ((h.data !== void 0 && (S.data = h.data), h.deprecated === !0 || h.deprecated === !1)) {
					if (h.deprecated === !0 && _ !== void 0 && _.length > 0) {
						let w = _.indexOf(ot.CompletionItemTag.Deprecated);
						w !== -1 && _.splice(w, 1);
					}
					S.deprecated = h.deprecated;
				}
				h.insertTextMode !== void 0 && (S.insertTextMode = h.insertTextMode);
			}
			return (
				_ !== void 0 && _.length > 0 && (S.tags = _),
				S.insertTextMode === void 0 &&
					f.keepWhitespace === !0 &&
					(S.insertTextMode = ne.InsertTextMode.adjustIndentation),
				S
			);
		}
		function lr(f, k) {
			let V = ne.InsertTextFormat.PlainText,
				we,
				S;
			(k.textEdit
				? ((we = k.textEdit.newText), (S = k.textEdit.range))
				: k.insertText instanceof ot.SnippetString
					? ((V = ne.InsertTextFormat.Snippet), (we = k.insertText.value))
					: (we = k.insertText),
				k.range && (S = k.range),
				(f.insertTextFormat = V),
				k.fromEdit && we !== void 0 && S !== void 0
					? (f.textEdit = rn(we, S))
					: (f.insertText = we));
		}
		function rn(f, k) {
			return mu.is(k)
				? ne.InsertReplaceEdit.create(f, Me(k.inserting), Me(k.replacing))
				: { newText: f, range: Me(k) };
		}
		function Fn(f) {
			return { range: Me(f.range), newText: f.newText };
		}
		function tt(f) {
			return f == null ? f : f.map(Fn);
		}
		function bt(f) {
			return f <= ot.SymbolKind.TypeParameter ? f + 1 : ne.SymbolKind.Property;
		}
		function vt(f) {
			return f;
		}
		function Vt(f) {
			return f.map(vt);
		}
		function Nt(f, k, V) {
			return {
				textDocument: i(f),
				position: pt(k),
				context: { includeDeclaration: V.includeDeclaration },
			};
		}
		async function Nn(f, k) {
			let V = ne.CodeAction.create(f.title);
			if (
				(f instanceof am.default && f.data !== void 0 && (V.data = f.data),
				f.kind !== void 0 && (V.kind = b(f.kind)),
				f.diagnostics !== void 0 && (V.diagnostics = await mn(f.diagnostics, k)),
				f.edit !== void 0)
			)
				throw new Error(
					'VS Code code actions can only be converted to a protocol code action without an edit.',
				);
			return (
				f.command !== void 0 && (V.command = U(f.command)),
				f.isPreferred !== void 0 && (V.isPreferred = f.isPreferred),
				f.disabled !== void 0 && (V.disabled = { reason: f.disabled.reason }),
				V
			);
		}
		function Gn(f) {
			let k = ne.CodeAction.create(f.title);
			if (
				(f instanceof am.default && f.data !== void 0 && (k.data = f.data),
				f.kind !== void 0 && (k.kind = b(f.kind)),
				f.diagnostics !== void 0 && (k.diagnostics = vn(f.diagnostics)),
				f.edit !== void 0)
			)
				throw new Error(
					'VS Code code actions can only be converted to a protocol code action without an edit.',
				);
			return (
				f.command !== void 0 && (k.command = U(f.command)),
				f.isPreferred !== void 0 && (k.isPreferred = f.isPreferred),
				f.disabled !== void 0 && (k.disabled = { reason: f.disabled.reason }),
				k
			);
		}
		async function Cn(f, k) {
			if (f == null) return f;
			let V;
			return (
				f.only && Mr.string(f.only.value) && (V = [f.only.value]),
				ne.CodeActionContext.create(await mn(f.diagnostics, k), V, kt(f.triggerKind))
			);
		}
		function Xn(f) {
			if (f == null) return f;
			let k;
			return (
				f.only && Mr.string(f.only.value) && (k = [f.only.value]),
				ne.CodeActionContext.create(vn(f.diagnostics), k, kt(f.triggerKind))
			);
		}
		function kt(f) {
			switch (f) {
				case ot.CodeActionTriggerKind.Invoke:
					return ne.CodeActionTriggerKind.Invoked;
				case ot.CodeActionTriggerKind.Automatic:
					return ne.CodeActionTriggerKind.Automatic;
				default:
					return;
			}
		}
		function b(f) {
			if (f != null) return f.value;
		}
		function I(f) {
			return f == null ? f : ne.InlineValueContext.create(f.frameId, Me(f.stoppedLocation));
		}
		function $(f, k, V) {
			return {
				context: ne.InlineCompletionContext.create(V.triggerKind, V.selectedCompletionInfo),
				textDocument: i(f),
				position: gt(k),
			};
		}
		function U(f) {
			let k = ne.Command.create(f.title, f.command);
			return (f.arguments && (k.arguments = f.arguments), k);
		}
		function Ce(f) {
			let k = ne.CodeLens.create(Me(f.range));
			return (
				f.command && (k.command = U(f.command)),
				f instanceof e_.default && f.data && (k.data = f.data),
				k
			);
		}
		function ve(f, k) {
			let V = { tabSize: f.tabSize, insertSpaces: f.insertSpaces };
			return (
				k.trimTrailingWhitespace && (V.trimTrailingWhitespace = !0),
				k.trimFinalNewlines && (V.trimFinalNewlines = !0),
				k.insertFinalNewline && (V.insertFinalNewline = !0),
				V
			);
		}
		function Pe(f) {
			return { textDocument: i(f) };
		}
		function ke(f) {
			return { textDocument: i(f) };
		}
		function oe(f) {
			let k = ne.DocumentLink.create(Me(f.range));
			(f.target && (k.target = r(f.target)), f.tooltip !== void 0 && (k.tooltip = f.tooltip));
			let V = f instanceof t_.default ? f : void 0;
			return (V && V.data && (k.data = V.data), k);
		}
		function _e(f) {
			return { textDocument: i(f) };
		}
		function fe(f) {
			let k = {
				name: f.name,
				kind: bt(f.kind),
				uri: r(f.uri),
				range: Me(f.range),
				selectionRange: Me(f.selectionRange),
			};
			return (
				f.detail !== void 0 && f.detail.length > 0 && (k.detail = f.detail),
				f.tags !== void 0 && (k.tags = Vt(f.tags)),
				f instanceof n_.default && f.data !== void 0 && (k.data = f.data),
				k
			);
		}
		function xe(f) {
			let k = {
				name: f.name,
				kind: bt(f.kind),
				uri: r(f.uri),
				range: Me(f.range),
				selectionRange: Me(f.selectionRange),
			};
			return (
				f.detail !== void 0 && f.detail.length > 0 && (k.detail = f.detail),
				f.tags !== void 0 && (k.tags = Vt(f.tags)),
				f instanceof r_.default && f.data !== void 0 && (k.data = f.data),
				k
			);
		}
		function Je(f) {
			let k =
				f instanceof i_.default
					? {
							name: f.name,
							kind: bt(f.kind),
							location: f.hasRange ? Et(f.location) : { uri: t(f.location.uri) },
							data: f.data,
						}
					: { name: f.name, kind: bt(f.kind), location: Et(f.location) };
			return (
				f.tags !== void 0 && (k.tags = Vt(f.tags)),
				f.containerName !== '' && (k.containerName = f.containerName),
				k
			);
		}
		function ct(f) {
			let k = typeof f.label == 'string' ? f.label : f.label.map(dr),
				V = ne.InlayHint.create(gt(f.position), k);
			return (
				f.kind !== void 0 && (V.kind = f.kind),
				f.textEdits !== void 0 && (V.textEdits = tt(f.textEdits)),
				f.tooltip !== void 0 && (V.tooltip = fr(f.tooltip)),
				f.paddingLeft !== void 0 && (V.paddingLeft = f.paddingLeft),
				f.paddingRight !== void 0 && (V.paddingRight = f.paddingRight),
				f instanceof s_.default && f.data !== void 0 && (V.data = f.data),
				V
			);
		}
		function dr(f) {
			let k = ne.InlayHintLabelPart.create(f.value);
			return (
				f.location !== void 0 && (k.location = Et(f.location)),
				f.command !== void 0 && (k.command = U(f.command)),
				f.tooltip !== void 0 && (k.tooltip = fr(f.tooltip)),
				k
			);
		}
		function fr(f) {
			return typeof f == 'string' ? f : { kind: ne.MarkupKind.Markdown, value: f.value };
		}
		return {
			asUri: r,
			asTextDocumentIdentifier: i,
			asTextDocumentItem: s,
			asVersionedTextDocumentIdentifier: o,
			asOpenTextDocumentParams: a,
			asChangeTextDocumentParams: p,
			asCloseTextDocumentParams: m,
			asSaveTextDocumentParams: g,
			asWillSaveTextDocumentParams: y,
			asDidCreateFilesParams: P,
			asDidRenameFilesParams: q,
			asDidDeleteFilesParams: N,
			asWillCreateFilesParams: L,
			asWillRenameFilesParams: M,
			asWillDeleteFilesParams: H,
			asTextDocumentPositionParams: X,
			asCompletionParams: B,
			asSignatureHelpParams: qt,
			asWorkerPosition: pt,
			asRange: Me,
			asRanges: Ft,
			asPosition: gt,
			asPositions: gn,
			asPositionsSync: En,
			asLocation: Et,
			asDiagnosticSeverity: mt,
			asDiagnosticTag: kn,
			asDiagnostic: In,
			asDiagnostics: mn,
			asDiagnosticsSync: vn,
			asCompletionItem: nn,
			asTextEdit: Fn,
			asSymbolKind: bt,
			asSymbolTag: vt,
			asSymbolTags: Vt,
			asReferenceParams: Nt,
			asCodeAction: Nn,
			asCodeActionSync: Gn,
			asCodeActionContext: Cn,
			asCodeActionContextSync: Xn,
			asInlineValueContext: I,
			asCommand: U,
			asCodeLens: Ce,
			asFormattingOptions: ve,
			asDocumentSymbolParams: Pe,
			asCodeLensParams: ke,
			asDocumentLink: oe,
			asDocumentLinkParams: _e,
			asCallHierarchyItem: fe,
			asTypeHierarchyItem: xe,
			asInlayHint: ct,
			asWorkspaceSymbol: Je,
			asInlineCompletionParams: $,
		};
	}
	ao.createConverter = o_;
});
var fm = E((uo) => {
	'use strict';
	Object.defineProperty(uo, '__esModule', { value: !0 });
	uo.createConverter = void 0;
	var W = require('vscode'),
		Y = ee(),
		un = cn(),
		be = so(),
		a_ = zc(),
		c_ = Gc(),
		u_ = Qc(),
		l_ = eu(),
		lm = ru(),
		d_ = ou(),
		f_ = uu(),
		h_ = fu(),
		p_ = gu(),
		dm = ee(),
		co;
	(function (n) {
		function e(t) {
			let r = t;
			return r && un.string(r.language) && un.string(r.value);
		}
		n.is = e;
	})(co || (co = {}));
	function g_(n, e, t) {
		let i = n || ((c) => W.Uri.parse(c));
		function s(c) {
			return i(c);
		}
		function o(c) {
			let R = [];
			for (let F of c)
				if (typeof F == 'string') R.push(F);
				else if (dm.NotebookCellTextDocumentFilter.is(F))
					if (typeof F.notebook == 'string')
						R.push({ notebookType: F.notebook, language: F.language });
					else {
						let G = F.notebook.notebookType ?? '*';
						R.push({
							notebookType: G,
							scheme: F.notebook.scheme,
							pattern: F.notebook.pattern,
							language: F.language,
						});
					}
				else
					dm.TextDocumentFilter.is(F) &&
						R.push({ language: F.language, scheme: F.scheme, pattern: F.pattern });
			return R;
		}
		async function a(c, R) {
			return be.map(c, l, R);
		}
		function u(c) {
			let R = new Array(c.length);
			for (let F = 0; F < c.length; F++) R[F] = l(c[F]);
			return R;
		}
		function l(c) {
			let R = new lm.ProtocolDiagnostic(y(c.range), c.message, q(c.severity), c.data);
			if (c.code !== void 0) {
				if (typeof c.code == 'string' || typeof c.code == 'number')
					Y.CodeDescription.is(c.codeDescription)
						? (R.code = { value: c.code, target: s(c.codeDescription.href) })
						: (R.code = c.code);
				else if (lm.DiagnosticCode.is(c.code)) {
					R.hasDiagnosticCode = !0;
					let F = c.code;
					R.code = { value: F.value, target: s(F.target) };
				}
			}
			return (
				c.source && (R.source = c.source),
				c.relatedInformation && (R.relatedInformation = p(c.relatedInformation)),
				Array.isArray(c.tags) && (R.tags = m(c.tags)),
				R
			);
		}
		function p(c) {
			let R = new Array(c.length);
			for (let F = 0; F < c.length; F++) {
				let G = c[F];
				R[F] = new W.DiagnosticRelatedInformation(mt(G.location), G.message);
			}
			return R;
		}
		function m(c) {
			if (!c) return;
			let R = [];
			for (let F of c) {
				let G = g(F);
				G !== void 0 && R.push(G);
			}
			return R.length > 0 ? R : void 0;
		}
		function g(c) {
			switch (c) {
				case Y.DiagnosticTag.Unnecessary:
					return W.DiagnosticTag.Unnecessary;
				case Y.DiagnosticTag.Deprecated:
					return W.DiagnosticTag.Deprecated;
				default:
					return;
			}
		}
		function D(c) {
			return c ? new W.Position(c.line, c.character) : void 0;
		}
		function y(c) {
			return c ? new W.Range(c.start.line, c.start.character, c.end.line, c.end.character) : void 0;
		}
		async function P(c, R) {
			return be.map(
				c,
				(F) => new W.Range(F.start.line, F.start.character, F.end.line, F.end.character),
				R,
			);
		}
		function q(c) {
			if (c == null) return W.DiagnosticSeverity.Error;
			switch (c) {
				case Y.DiagnosticSeverity.Error:
					return W.DiagnosticSeverity.Error;
				case Y.DiagnosticSeverity.Warning:
					return W.DiagnosticSeverity.Warning;
				case Y.DiagnosticSeverity.Information:
					return W.DiagnosticSeverity.Information;
				case Y.DiagnosticSeverity.Hint:
					return W.DiagnosticSeverity.Hint;
			}
			return W.DiagnosticSeverity.Error;
		}
		function N(c) {
			if (un.string(c)) return M(c);
			if (co.is(c)) return M().appendCodeblock(c.value, c.language);
			if (Array.isArray(c)) {
				let R = [];
				for (let F of c) {
					let G = M();
					(co.is(F) ? G.appendCodeblock(F.value, F.language) : G.appendMarkdown(F), R.push(G));
				}
				return R;
			} else return M(c);
		}
		function L(c) {
			if (un.string(c)) return c;
			switch (c.kind) {
				case Y.MarkupKind.Markdown:
					return M(c.value);
				case Y.MarkupKind.PlainText:
					return c.value;
				default:
					return `Unsupported Markup content received. Kind is: ${c.kind}`;
			}
		}
		function M(c) {
			let R;
			if (c === void 0 || typeof c == 'string') R = new W.MarkdownString(c);
			else
				switch (c.kind) {
					case Y.MarkupKind.Markdown:
						R = new W.MarkdownString(c.value);
						break;
					case Y.MarkupKind.PlainText:
						((R = new W.MarkdownString()), R.appendText(c.value));
						break;
					default:
						((R = new W.MarkdownString()),
							R.appendText(`Unsupported Markup content received. Kind is: ${c.kind}`));
						break;
				}
			return ((R.isTrusted = e), (R.supportHtml = t), R);
		}
		function H(c) {
			if (c) return new W.Hover(N(c.contents), y(c.range));
		}
		async function X(c, R, F) {
			if (!c) return;
			if (Array.isArray(c)) return be.map(c, (Ln) => et(Ln, R), F);
			let G = c,
				{ defaultRange: ut, commitCharacters: yt } = de(G, R),
				Ee = await be.map(
					G.items,
					(Ln) =>
						et(
							Ln,
							yt,
							ut,
							G.itemDefaults?.insertTextMode,
							G.itemDefaults?.insertTextFormat,
							G.itemDefaults?.data,
						),
					F,
				);
			return new W.CompletionList(Ee, G.isIncomplete);
		}
		function de(c, R) {
			let F = c.itemDefaults?.editRange,
				G = c.itemDefaults?.commitCharacters ?? R;
			return Y.Range.is(F)
				? { defaultRange: y(F), commitCharacters: G }
				: F !== void 0
					? {
							defaultRange: { inserting: y(F.insert), replacing: y(F.replace) },
							commitCharacters: G,
						}
					: { defaultRange: void 0, commitCharacters: G };
		}
		function B(c) {
			return Y.CompletionItemKind.Text <= c && c <= Y.CompletionItemKind.TypeParameter
				? [c - 1, void 0]
				: [W.CompletionItemKind.Text, c];
		}
		function Z(c) {
			switch (c) {
				case Y.CompletionItemTag.Deprecated:
					return W.CompletionItemTag.Deprecated;
			}
		}
		function ce(c) {
			if (c == null) return [];
			let R = [];
			for (let F of c) {
				let G = Z(F);
				G !== void 0 && R.push(G);
			}
			return R;
		}
		function et(c, R, F, G, ut, yt) {
			let Ee = ce(c.tags),
				Ln = Xe(c),
				Fe = new a_.default(Ln);
			(c.detail && (Fe.detail = c.detail),
				c.documentation &&
					((Fe.documentation = L(c.documentation)),
					(Fe.documentationFormat = un.string(c.documentation) ? '$string' : c.documentation.kind)),
				c.filterText && (Fe.filterText = c.filterText));
			let Cs = rt(c, F, ut);
			if (
				(Cs && ((Fe.insertText = Cs.text), (Fe.range = Cs.range), (Fe.fromEdit = Cs.fromEdit)),
				un.number(c.kind))
			) {
				let [_C, lf] = B(c.kind);
				((Fe.kind = _C), lf && (Fe.originalItemKind = lf));
			}
			(c.sortText && (Fe.sortText = c.sortText),
				c.additionalTextEdits && (Fe.additionalTextEdits = gt(c.additionalTextEdits)));
			let cf =
				c.commitCharacters !== void 0
					? un.stringArray(c.commitCharacters)
						? c.commitCharacters
						: void 0
					: R;
			(cf && (Fe.commitCharacters = cf.slice()),
				c.command && (Fe.command = tt(c.command)),
				(c.deprecated === !0 || c.deprecated === !1) &&
					((Fe.deprecated = c.deprecated),
					c.deprecated === !0 && Ee.push(W.CompletionItemTag.Deprecated)),
				(c.preselect === !0 || c.preselect === !1) && (Fe.preselect = c.preselect));
			let uf = c.data ?? yt;
			(uf !== void 0 && (Fe.data = uf), Ee.length > 0 && (Fe.tags = Ee));
			let ha = c.insertTextMode ?? G;
			return (
				ha !== void 0 &&
					((Fe.insertTextMode = ha), ha === Y.InsertTextMode.asIs && (Fe.keepWhitespace = !0)),
				Fe
			);
		}
		function Xe(c) {
			return Y.CompletionItemLabelDetails.is(c.labelDetails)
				? { label: c.label, detail: c.labelDetails.detail, description: c.labelDetails.description }
				: c.label;
		}
		function rt(c, R, F) {
			let G = c.insertTextFormat ?? F;
			if (c.textEdit !== void 0 || R !== void 0) {
				let [ut, yt] = c.textEdit !== void 0 ? tn(c.textEdit) : [R, c.textEditText ?? c.label];
				return G === Y.InsertTextFormat.Snippet
					? { text: new W.SnippetString(yt), range: ut, fromEdit: !0 }
					: { text: yt, range: ut, fromEdit: !0 };
			} else
				return c.insertText
					? G === Y.InsertTextFormat.Snippet
						? { text: new W.SnippetString(c.insertText), fromEdit: !1 }
						: { text: c.insertText, fromEdit: !1 }
					: void 0;
		}
		function tn(c) {
			return Y.InsertReplaceEdit.is(c)
				? [{ inserting: y(c.insert), replacing: y(c.replace) }, c.newText]
				: [y(c.range), c.newText];
		}
		function qt(c) {
			if (c) return new W.TextEdit(y(c.range), c.newText);
		}
		async function pt(c, R) {
			if (c) return be.map(c, qt, R);
		}
		function gt(c) {
			if (!c) return;
			let R = new Array(c.length);
			for (let F = 0; F < c.length; F++) R[F] = qt(c[F]);
			return R;
		}
		async function gn(c, R) {
			if (!c) return;
			let F = new W.SignatureHelp();
			return (
				un.number(c.activeSignature)
					? (F.activeSignature = c.activeSignature)
					: (F.activeSignature = 0),
				un.number(c.activeParameter)
					? (F.activeParameter = c.activeParameter)
					: (F.activeParameter = 0),
				c.signatures && (F.signatures = await En(c.signatures, R)),
				F
			);
		}
		async function En(c, R) {
			return be.mapAsync(c, Me, R);
		}
		async function Me(c, R) {
			let F = new W.SignatureInformation(c.label);
			return (
				c.documentation !== void 0 && (F.documentation = L(c.documentation)),
				c.parameters !== void 0 && (F.parameters = await Ft(c.parameters, R)),
				c.activeParameter !== void 0 && (F.activeParameter = c.activeParameter),
				F
			);
		}
		function Ft(c, R) {
			return be.map(c, Et, R);
		}
		function Et(c) {
			let R = new W.ParameterInformation(c.label);
			return (c.documentation && (R.documentation = L(c.documentation)), R);
		}
		function mt(c) {
			return c ? new W.Location(i(c.uri), y(c.range)) : void 0;
		}
		async function cr(c, R) {
			if (c) return Vn(c, R);
		}
		async function kn(c, R) {
			if (c) return Vn(c, R);
		}
		function xn(c) {
			if (!c) return;
			let R = {
				targetUri: i(c.targetUri),
				targetRange: y(c.targetRange),
				originSelectionRange: y(c.originSelectionRange),
				targetSelectionRange: y(c.targetSelectionRange),
			};
			if (!R.targetSelectionRange)
				throw new Error('targetSelectionRange must not be undefined or null');
			return R;
		}
		async function Vn(c, R) {
			if (c)
				if (un.array(c)) {
					if (c.length === 0) return [];
					if (Y.LocationLink.is(c[0])) {
						let F = c;
						return be.map(F, xn, R);
					} else {
						let F = c;
						return be.map(F, mt, R);
					}
				} else return Y.LocationLink.is(c) ? [xn(c)] : mt(c);
		}
		async function ur(c, R) {
			if (c) return be.map(c, mt, R);
		}
		async function In(c, R) {
			if (c) return be.map(c, mn, R);
		}
		function mn(c) {
			let R = new W.DocumentHighlight(y(c.range));
			return (un.number(c.kind) && (R.kind = vn(c.kind)), R);
		}
		function vn(c) {
			switch (c) {
				case Y.DocumentHighlightKind.Text:
					return W.DocumentHighlightKind.Text;
				case Y.DocumentHighlightKind.Read:
					return W.DocumentHighlightKind.Read;
				case Y.DocumentHighlightKind.Write:
					return W.DocumentHighlightKind.Write;
			}
			return W.DocumentHighlightKind.Text;
		}
		async function On(c, R) {
			if (c) return be.map(c, nn, R);
		}
		function it(c) {
			return c <= Y.SymbolKind.TypeParameter ? c - 1 : W.SymbolKind.Property;
		}
		function Bn(c) {
			switch (c) {
				case Y.SymbolTag.Deprecated:
					return W.SymbolTag.Deprecated;
				default:
					return;
			}
		}
		function yn(c) {
			if (c == null) return;
			let R = [];
			for (let F of c) {
				let G = Bn(F);
				G !== void 0 && R.push(G);
			}
			return R.length === 0 ? void 0 : R;
		}
		function nn(c) {
			let R = c.data,
				F = c.location,
				G =
					F.range === void 0 || R !== void 0
						? new h_.default(
								c.name,
								it(c.kind),
								c.containerName ?? '',
								F.range === void 0 ? i(F.uri) : new W.Location(i(c.location.uri), y(F.range)),
								R,
							)
						: new W.SymbolInformation(
								c.name,
								it(c.kind),
								c.containerName ?? '',
								new W.Location(i(c.location.uri), y(F.range)),
							);
			return (Fn(G, c), G);
		}
		async function lr(c, R) {
			if (c != null) return be.map(c, rn, R);
		}
		function rn(c) {
			let R = new W.DocumentSymbol(
				c.name,
				c.detail || '',
				it(c.kind),
				y(c.range),
				y(c.selectionRange),
			);
			if ((Fn(R, c), c.children !== void 0 && c.children.length > 0)) {
				let F = [];
				for (let G of c.children) F.push(rn(G));
				R.children = F;
			}
			return R;
		}
		function Fn(c, R) {
			((c.tags = yn(R.tags)),
				R.deprecated &&
					(c.tags
						? c.tags.includes(W.SymbolTag.Deprecated) ||
							(c.tags = c.tags.concat(W.SymbolTag.Deprecated))
						: (c.tags = [W.SymbolTag.Deprecated])));
		}
		function tt(c) {
			let R = { title: c.title, command: c.command };
			return (c.arguments && (R.arguments = c.arguments), R);
		}
		async function bt(c, R) {
			if (c) return be.map(c, tt, R);
		}
		let vt = new Map();
		(vt.set(Y.CodeActionKind.Empty, W.CodeActionKind.Empty),
			vt.set(Y.CodeActionKind.QuickFix, W.CodeActionKind.QuickFix),
			vt.set(Y.CodeActionKind.Refactor, W.CodeActionKind.Refactor),
			vt.set(Y.CodeActionKind.RefactorExtract, W.CodeActionKind.RefactorExtract),
			vt.set(Y.CodeActionKind.RefactorInline, W.CodeActionKind.RefactorInline),
			vt.set(Y.CodeActionKind.RefactorRewrite, W.CodeActionKind.RefactorRewrite),
			vt.set(Y.CodeActionKind.Source, W.CodeActionKind.Source),
			vt.set(Y.CodeActionKind.SourceOrganizeImports, W.CodeActionKind.SourceOrganizeImports));
		function Vt(c) {
			if (c == null) return;
			let R = vt.get(c);
			if (R) return R;
			let F = c.split('.');
			R = W.CodeActionKind.Empty;
			for (let G of F) R = R.append(G);
			return R;
		}
		function Nt(c) {
			if (c != null) return c.map((R) => Vt(R));
		}
		async function Nn(c, R) {
			if (c == null) return;
			let F = new l_.default(c.title, c.data);
			return (
				c.kind !== void 0 && (F.kind = Vt(c.kind)),
				c.diagnostics !== void 0 && (F.diagnostics = u(c.diagnostics)),
				c.edit !== void 0 && (F.edit = await kt(c.edit, R)),
				c.command !== void 0 && (F.command = tt(c.command)),
				c.isPreferred !== void 0 && (F.isPreferred = c.isPreferred),
				c.disabled !== void 0 && (F.disabled = { reason: c.disabled.reason }),
				F
			);
		}
		function Gn(c, R) {
			return be.mapAsync(c, async (F) => (Y.Command.is(F) ? tt(F) : Nn(F, R)), R);
		}
		function Cn(c) {
			if (!c) return;
			let R = new c_.default(y(c.range));
			return (
				c.command && (R.command = tt(c.command)),
				c.data !== void 0 && c.data !== null && (R.data = c.data),
				R
			);
		}
		async function Xn(c, R) {
			if (c) return be.map(c, Cn, R);
		}
		async function kt(c, R) {
			if (!c) return;
			let F = new Map();
			if (c.changeAnnotations !== void 0) {
				let yt = c.changeAnnotations;
				await be.forEach(
					Object.keys(yt),
					(Ee) => {
						let Ln = b(yt[Ee]);
						F.set(Ee, Ln);
					},
					R,
				);
			}
			let G = (yt) => {
					if (yt !== void 0) return F.get(yt);
				},
				ut = new W.WorkspaceEdit();
			if (c.documentChanges) {
				let yt = c.documentChanges;
				await be.forEach(
					yt,
					(Ee) => {
						if (Y.CreateFile.is(Ee)) ut.createFile(i(Ee.uri), Ee.options, G(Ee.annotationId));
						else if (Y.RenameFile.is(Ee))
							ut.renameFile(i(Ee.oldUri), i(Ee.newUri), Ee.options, G(Ee.annotationId));
						else if (Y.DeleteFile.is(Ee)) ut.deleteFile(i(Ee.uri), Ee.options, G(Ee.annotationId));
						else if (Y.TextDocumentEdit.is(Ee)) {
							let Ln = i(Ee.textDocument.uri);
							for (let Fe of Ee.edits)
								Y.AnnotatedTextEdit.is(Fe)
									? ut.replace(Ln, y(Fe.range), Fe.newText, G(Fe.annotationId))
									: ut.replace(Ln, y(Fe.range), Fe.newText);
						} else
							throw new Error(`Unknown workspace edit change received:
${JSON.stringify(Ee, void 0, 4)}`);
					},
					R,
				);
			} else if (c.changes) {
				let yt = c.changes;
				await be.forEach(
					Object.keys(yt),
					(Ee) => {
						ut.set(i(Ee), gt(yt[Ee]));
					},
					R,
				);
			}
			return ut;
		}
		function b(c) {
			if (c !== void 0)
				return {
					label: c.label,
					needsConfirmation: !!c.needsConfirmation,
					description: c.description,
				};
		}
		function I(c) {
			let R = y(c.range),
				F = c.target ? s(c.target) : void 0,
				G = new u_.default(R, F);
			return (
				c.tooltip !== void 0 && (G.tooltip = c.tooltip),
				c.data !== void 0 && c.data !== null && (G.data = c.data),
				G
			);
		}
		async function $(c, R) {
			if (c) return be.map(c, I, R);
		}
		function U(c) {
			return new W.Color(c.red, c.green, c.blue, c.alpha);
		}
		function Ce(c) {
			return new W.ColorInformation(y(c.range), U(c.color));
		}
		async function ve(c, R) {
			if (c) return be.map(c, Ce, R);
		}
		function Pe(c) {
			let R = new W.ColorPresentation(c.label);
			return (
				(R.additionalTextEdits = gt(c.additionalTextEdits)),
				c.textEdit && (R.textEdit = qt(c.textEdit)),
				R
			);
		}
		async function ke(c, R) {
			if (c) return be.map(c, Pe, R);
		}
		function oe(c) {
			if (c)
				switch (c) {
					case Y.FoldingRangeKind.Comment:
						return W.FoldingRangeKind.Comment;
					case Y.FoldingRangeKind.Imports:
						return W.FoldingRangeKind.Imports;
					case Y.FoldingRangeKind.Region:
						return W.FoldingRangeKind.Region;
				}
		}
		function _e(c) {
			return new W.FoldingRange(c.startLine, c.endLine, oe(c.kind));
		}
		async function fe(c, R) {
			if (c) return be.map(c, _e, R);
		}
		function xe(c) {
			return new W.SelectionRange(y(c.range), c.parent ? xe(c.parent) : void 0);
		}
		async function Je(c, R) {
			return Array.isArray(c) ? be.map(c, xe, R) : [];
		}
		function ct(c) {
			return Y.InlineValueText.is(c)
				? new W.InlineValueText(y(c.range), c.text)
				: Y.InlineValueVariableLookup.is(c)
					? new W.InlineValueVariableLookup(y(c.range), c.variableName, c.caseSensitiveLookup)
					: new W.InlineValueEvaluatableExpression(y(c.range), c.expression);
		}
		async function dr(c, R) {
			return Array.isArray(c) ? be.map(c, ct, R) : [];
		}
		async function fr(c, R) {
			let F = typeof c.label == 'string' ? c.label : await be.map(c.label, f, R),
				G = new p_.default(D(c.position), F);
			return (
				c.kind !== void 0 && (G.kind = c.kind),
				c.textEdits !== void 0 && (G.textEdits = await pt(c.textEdits, R)),
				c.tooltip !== void 0 && (G.tooltip = k(c.tooltip)),
				c.paddingLeft !== void 0 && (G.paddingLeft = c.paddingLeft),
				c.paddingRight !== void 0 && (G.paddingRight = c.paddingRight),
				c.data !== void 0 && (G.data = c.data),
				G
			);
		}
		function f(c) {
			let R = new W.InlayHintLabelPart(c.value);
			return (
				c.location !== void 0 && (R.location = mt(c.location)),
				c.tooltip !== void 0 && (R.tooltip = k(c.tooltip)),
				c.command !== void 0 && (R.command = tt(c.command)),
				R
			);
		}
		function k(c) {
			return typeof c == 'string' ? c : M(c);
		}
		async function V(c, R) {
			if (Array.isArray(c)) return be.mapAsync(c, fr, R);
		}
		function we(c) {
			if (c === null) return;
			let R = new d_.default(
				it(c.kind),
				c.name,
				c.detail || '',
				s(c.uri),
				y(c.range),
				y(c.selectionRange),
				c.data,
			);
			return (c.tags !== void 0 && (R.tags = yn(c.tags)), R);
		}
		async function S(c, R) {
			if (c !== null) return be.map(c, we, R);
		}
		async function h(c, R) {
			return new W.CallHierarchyIncomingCall(we(c.from), await P(c.fromRanges, R));
		}
		async function _(c, R) {
			if (c !== null) return be.mapAsync(c, h, R);
		}
		async function w(c, R) {
			return new W.CallHierarchyOutgoingCall(we(c.to), await P(c.fromRanges, R));
		}
		async function v(c, R) {
			if (c !== null) return be.mapAsync(c, w, R);
		}
		async function d(c, R) {
			if (c != null) return new W.SemanticTokens(new Uint32Array(c.data), c.resultId);
		}
		function T(c) {
			return new W.SemanticTokensEdit(
				c.start,
				c.deleteCount,
				c.data !== void 0 ? new Uint32Array(c.data) : void 0,
			);
		}
		async function O(c, R) {
			if (c != null) return new W.SemanticTokensEdits(c.edits.map(T), c.resultId);
		}
		function te(c) {
			return c;
		}
		async function $e(c, R) {
			if (c != null) return new W.LinkedEditingRanges(await P(c.ranges, R), Ie(c.wordPattern));
		}
		function Ie(c) {
			if (c != null) return new RegExp(c);
		}
		function Mt(c) {
			if (c === null) return;
			let R = new f_.default(
				it(c.kind),
				c.name,
				c.detail || '',
				s(c.uri),
				y(c.range),
				y(c.selectionRange),
				c.data,
			);
			return (c.tags !== void 0 && (R.tags = yn(c.tags)), R);
		}
		async function Bt(c, R) {
			if (c !== null) return be.map(c, Mt, R);
		}
		function bn(c) {
			if (un.string(c)) return c;
			if (Y.RelativePattern.is(c)) {
				if (Y.URI.is(c.baseUri)) return new W.RelativePattern(s(c.baseUri), c.pattern);
				if (Y.WorkspaceFolder.is(c.baseUri)) {
					let R = W.workspace.getWorkspaceFolder(s(c.baseUri.uri));
					return R !== void 0 ? new W.RelativePattern(R, c.pattern) : void 0;
				}
			}
		}
		async function le(c, R) {
			if (!c) return;
			if (Array.isArray(c)) return be.map(c, (ut) => Mn(ut), R);
			let F = c,
				G = await be.map(F.items, (ut) => Mn(ut), R);
			return new W.InlineCompletionList(G);
		}
		function Mn(c) {
			let R;
			typeof c.insertText == 'string'
				? (R = c.insertText)
				: (R = new W.SnippetString(c.insertText.value));
			let F;
			c.command && (F = tt(c.command));
			let G = new W.InlineCompletionItem(R, y(c.range), F);
			return (c.filterText && (G.filterText = c.filterText), G);
		}
		return {
			asUri: s,
			asDocumentSelector: o,
			asDiagnostics: a,
			asDiagnostic: l,
			asRange: y,
			asRanges: P,
			asPosition: D,
			asDiagnosticSeverity: q,
			asDiagnosticTag: g,
			asHover: H,
			asCompletionResult: X,
			asCompletionItem: et,
			asTextEdit: qt,
			asTextEdits: pt,
			asSignatureHelp: gn,
			asSignatureInformations: En,
			asSignatureInformation: Me,
			asParameterInformations: Ft,
			asParameterInformation: Et,
			asDeclarationResult: cr,
			asDefinitionResult: kn,
			asLocation: mt,
			asReferences: ur,
			asDocumentHighlights: In,
			asDocumentHighlight: mn,
			asDocumentHighlightKind: vn,
			asSymbolKind: it,
			asSymbolTag: Bn,
			asSymbolTags: yn,
			asSymbolInformations: On,
			asSymbolInformation: nn,
			asDocumentSymbols: lr,
			asDocumentSymbol: rn,
			asCommand: tt,
			asCommands: bt,
			asCodeAction: Nn,
			asCodeActionKind: Vt,
			asCodeActionKinds: Nt,
			asCodeActionResult: Gn,
			asCodeLens: Cn,
			asCodeLenses: Xn,
			asWorkspaceEdit: kt,
			asDocumentLink: I,
			asDocumentLinks: $,
			asFoldingRangeKind: oe,
			asFoldingRange: _e,
			asFoldingRanges: fe,
			asColor: U,
			asColorInformation: Ce,
			asColorInformations: ve,
			asColorPresentation: Pe,
			asColorPresentations: ke,
			asSelectionRange: xe,
			asSelectionRanges: Je,
			asInlineValue: ct,
			asInlineValues: dr,
			asInlayHint: fr,
			asInlayHints: V,
			asSemanticTokensLegend: te,
			asSemanticTokens: d,
			asSemanticTokensEdit: T,
			asSemanticTokensEdits: O,
			asCallHierarchyItem: we,
			asCallHierarchyItems: S,
			asCallHierarchyIncomingCall: h,
			asCallHierarchyIncomingCalls: _,
			asCallHierarchyOutgoingCall: w,
			asCallHierarchyOutgoingCalls: v,
			asLinkedEditingRanges: $e,
			asTypeHierarchyItem: Mt,
			asTypeHierarchyItems: Bt,
			asGlobPattern: bn,
			asInlineCompletionResult: le,
			asInlineCompletionItem: Mn,
		};
	}
	uo.createConverter = g_;
});
var We = E((ln) => {
	'use strict';
	Object.defineProperty(ln, '__esModule', { value: !0 });
	ln.generateUuid = ln.parse = ln.isUUID = ln.v4 = ln.empty = void 0;
	var Vi = class {
			constructor(e) {
				this._value = e;
			}
			asHex() {
				return this._value;
			}
			equals(e) {
				return this.asHex() === e.asHex();
			}
		},
		ae = class extends Vi {
			static _oneOf(e) {
				return e[Math.floor(e.length * Math.random())];
			}
			static _randomHex() {
				return ae._oneOf(ae._chars);
			}
			constructor() {
				super(
					[
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						'-',
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						'-',
						'4',
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						'-',
						ae._oneOf(ae._timeHighBits),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						'-',
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
						ae._randomHex(),
					].join(''),
				);
			}
		};
	ae._chars = ['0', '1', '2', '3', '4', '5', '6', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
	ae._timeHighBits = ['8', '9', 'a', 'b'];
	ln.empty = new Vi('00000000-0000-0000-0000-000000000000');
	function hm() {
		return new ae();
	}
	ln.v4 = hm;
	var m_ = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	function pm(n) {
		return m_.test(n);
	}
	ln.isUUID = pm;
	function v_(n) {
		if (!pm(n)) throw new Error('invalid uuid');
		return new Vi(n);
	}
	ln.parse = v_;
	function y_() {
		return hm().asHex();
	}
	ln.generateUuid = y_;
});
var yu = E((lo) => {
	'use strict';
	Object.defineProperty(lo, '__esModule', { value: !0 });
	lo.ProgressPart = void 0;
	var gm = require('vscode'),
		mm = ee(),
		vm = cn(),
		vu = class {
			constructor(e, t, r) {
				((this._client = e),
					(this._token = t),
					(this._reported = 0),
					(this._infinite = !1),
					(this._lspProgressDisposable = this._client.onProgress(
						mm.WorkDoneProgress.type,
						this._token,
						(i) => {
							switch (i.kind) {
								case 'begin':
									this.begin(i);
									break;
								case 'report':
									this.report(i);
									break;
								case 'end':
									(this.done(), r && r(this));
									break;
							}
						},
					)));
			}
			begin(e) {
				((this._infinite = e.percentage === void 0),
					this._lspProgressDisposable !== void 0 &&
						gm.window.withProgress(
							{ location: gm.ProgressLocation.Window, cancellable: e.cancellable, title: e.title },
							async (t, r) => {
								if (this._lspProgressDisposable !== void 0)
									return (
										(this._progress = t),
										(this._cancellationToken = r),
										(this._tokenDisposable = this._cancellationToken.onCancellationRequested(() => {
											this._client.sendNotification(mm.WorkDoneProgressCancelNotification.type, {
												token: this._token,
											});
										})),
										this.report(e),
										new Promise((i, s) => {
											((this._resolve = i), (this._reject = s));
										})
									);
							},
						));
			}
			report(e) {
				if (this._infinite && vm.string(e.message))
					this._progress !== void 0 && this._progress.report({ message: e.message });
				else if (vm.number(e.percentage)) {
					let t = Math.max(0, Math.min(e.percentage, 100)),
						r = Math.max(0, t - this._reported);
					((this._reported += r),
						this._progress !== void 0 &&
							this._progress.report({ message: e.message, increment: r }));
				}
			}
			cancel() {
				(this.cleanup(),
					this._reject !== void 0 &&
						(this._reject(), (this._resolve = void 0), (this._reject = void 0)));
			}
			done() {
				(this.cleanup(),
					this._resolve !== void 0 &&
						(this._resolve(), (this._resolve = void 0), (this._reject = void 0)));
			}
			cleanup() {
				(this._lspProgressDisposable !== void 0 &&
					(this._lspProgressDisposable.dispose(), (this._lspProgressDisposable = void 0)),
					this._tokenDisposable !== void 0 &&
						(this._tokenDisposable.dispose(), (this._tokenDisposable = void 0)),
					(this._progress = void 0),
					(this._cancellationToken = void 0));
			}
		};
	lo.ProgressPart = vu;
});
var ye = E((ft) => {
	'use strict';
	Object.defineProperty(ft, '__esModule', { value: !0 });
	ft.WorkspaceFeature =
		ft.TextDocumentLanguageFeature =
		ft.TextDocumentEventFeature =
		ft.DynamicDocumentFeature =
		ft.DynamicFeature =
		ft.StaticFeature =
		ft.ensure =
		ft.LSPCancellationError =
			void 0;
	var Lr = require('vscode'),
		Cu = ee(),
		xt = cn(),
		ym = We(),
		bu = class extends Lr.CancellationError {
			constructor(e) {
				(super(), (this.data = e));
			}
		};
	ft.LSPCancellationError = bu;
	function C_(n, e) {
		return (n[e] === void 0 && (n[e] = {}), n[e]);
	}
	ft.ensure = C_;
	var Cm;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r != null &&
				xt.func(r.fillClientCapabilities) &&
				xt.func(r.initialize) &&
				xt.func(r.getState) &&
				xt.func(r.clear) &&
				(r.fillInitializeParams === void 0 || xt.func(r.fillInitializeParams))
			);
		}
		n.is = e;
	})(Cm || (ft.StaticFeature = Cm = {}));
	var bm;
	(function (n) {
		function e(t) {
			let r = t;
			return (
				r != null &&
				xt.func(r.fillClientCapabilities) &&
				xt.func(r.initialize) &&
				xt.func(r.getState) &&
				xt.func(r.clear) &&
				(r.fillInitializeParams === void 0 || xt.func(r.fillInitializeParams)) &&
				xt.func(r.register) &&
				xt.func(r.unregister) &&
				r.registrationType !== void 0
			);
		}
		n.is = e;
	})(bm || (ft.DynamicFeature = bm = {}));
	var Bi = class {
		constructor(e) {
			this._client = e;
		}
		getState() {
			let e = this.getDocumentSelectors(),
				t = 0;
			for (let i of e) {
				t++;
				for (let s of Lr.workspace.textDocuments)
					if (Lr.languages.match(i, s) > 0)
						return {
							kind: 'document',
							id: this.registrationType.method,
							registrations: !0,
							matches: !0,
						};
			}
			let r = t > 0;
			return { kind: 'document', id: this.registrationType.method, registrations: r, matches: !1 };
		}
	};
	ft.DynamicDocumentFeature = Bi;
	var _u = class extends Bi {
		static textDocumentFilter(e, t) {
			for (let r of e) if (Lr.languages.match(r, t) > 0) return !0;
			return !1;
		}
		constructor(e, t, r, i, s, o, a) {
			(super(e),
				(this._event = t),
				(this._type = r),
				(this._middleware = i),
				(this._createParams = s),
				(this._textDocument = o),
				(this._selectorFilter = a),
				(this._selectors = new Map()),
				(this._onNotificationSent = new Lr.EventEmitter()));
		}
		getStateInfo() {
			return [this._selectors.values(), !1];
		}
		getDocumentSelectors() {
			return this._selectors.values();
		}
		register(e) {
			e.registerOptions.documentSelector &&
				(this._listener ||
					(this._listener = this._event((t) => {
						this.callback(t).catch((r) => {
							this._client.error(`Sending document notification ${this._type.method} failed.`, r);
						});
					})),
				this._selectors.set(
					e.id,
					this._client.protocol2CodeConverter.asDocumentSelector(
						e.registerOptions.documentSelector,
					),
				));
		}
		async callback(e) {
			let t = async (r) => {
				let i = this._createParams(r);
				(await this._client.sendNotification(this._type, i),
					this.notificationSent(this.getTextDocument(r), this._type, i));
			};
			if (this.matches(e)) {
				let r = this._middleware();
				return r ? r(e, (i) => t(i)) : t(e);
			}
		}
		matches(e) {
			return this._client.hasDedicatedTextSynchronizationFeature(this._textDocument(e))
				? !1
				: !this._selectorFilter || this._selectorFilter(this._selectors.values(), e);
		}
		get onNotificationSent() {
			return this._onNotificationSent.event;
		}
		notificationSent(e, t, r) {
			this._onNotificationSent.fire({ textDocument: e, type: t, params: r });
		}
		unregister(e) {
			(this._selectors.delete(e),
				this._selectors.size === 0 &&
					this._listener &&
					(this._listener.dispose(), (this._listener = void 0)));
		}
		clear() {
			(this._selectors.clear(),
				this._onNotificationSent.dispose(),
				this._listener && (this._listener.dispose(), (this._listener = void 0)));
		}
		getProvider(e) {
			for (let t of this._selectors.values())
				if (Lr.languages.match(t, e) > 0) return { send: (r) => this.callback(r) };
		}
	};
	ft.TextDocumentEventFeature = _u;
	var wu = class extends Bi {
		constructor(e, t) {
			(super(e), (this._registrationType = t), (this._registrations = new Map()));
		}
		*getDocumentSelectors() {
			for (let e of this._registrations.values()) {
				let t = e.data.registerOptions.documentSelector;
				t !== null && (yield this._client.protocol2CodeConverter.asDocumentSelector(t));
			}
		}
		get registrationType() {
			return this._registrationType;
		}
		register(e) {
			if (!e.registerOptions.documentSelector) return;
			let t = this.registerLanguageProvider(e.registerOptions, e.id);
			this._registrations.set(e.id, { disposable: t[0], data: e, provider: t[1] });
		}
		unregister(e) {
			let t = this._registrations.get(e);
			t !== void 0 && t.disposable.dispose();
		}
		clear() {
			(this._registrations.forEach((e) => {
				e.disposable.dispose();
			}),
				this._registrations.clear());
		}
		getRegistration(e, t) {
			if (t) {
				if (Cu.TextDocumentRegistrationOptions.is(t)) {
					let r = Cu.StaticRegistrationOptions.hasId(t) ? t.id : ym.generateUuid(),
						i = t.documentSelector ?? e;
					if (i) return [r, Object.assign({}, t, { documentSelector: i })];
				} else if ((xt.boolean(t) && t === !0) || Cu.WorkDoneProgressOptions.is(t)) {
					if (!e) return [void 0, void 0];
					let r =
						xt.boolean(t) && t === !0
							? { documentSelector: e }
							: Object.assign({}, t, { documentSelector: e });
					return [ym.generateUuid(), r];
				}
			} else return [void 0, void 0];
			return [void 0, void 0];
		}
		getRegistrationOptions(e, t) {
			if (!(!e || !t))
				return xt.boolean(t) && t === !0
					? { documentSelector: e }
					: Object.assign({}, t, { documentSelector: e });
		}
		getProvider(e) {
			for (let t of this._registrations.values()) {
				let r = t.data.registerOptions.documentSelector;
				if (
					r !== null &&
					Lr.languages.match(this._client.protocol2CodeConverter.asDocumentSelector(r), e) > 0
				)
					return t.provider;
			}
		}
		getAllProviders() {
			let e = [];
			for (let t of this._registrations.values()) e.push(t.provider);
			return e;
		}
	};
	ft.TextDocumentLanguageFeature = wu;
	var Du = class {
		constructor(e, t) {
			((this._client = e), (this._registrationType = t), (this._registrations = new Map()));
		}
		getState() {
			let e = this._registrations.size > 0;
			return { kind: 'workspace', id: this._registrationType.method, registrations: e };
		}
		get registrationType() {
			return this._registrationType;
		}
		register(e) {
			let t = this.registerLanguageProvider(e.registerOptions);
			this._registrations.set(e.id, { disposable: t[0], provider: t[1] });
		}
		unregister(e) {
			let t = this._registrations.get(e);
			t !== void 0 && t.disposable.dispose();
		}
		clear() {
			(this._registrations.forEach((e) => {
				e.disposable.dispose();
			}),
				this._registrations.clear());
		}
		getProviders() {
			let e = [];
			for (let t of this._registrations.values()) e.push(t.provider);
			return e;
		}
	};
	ft.WorkspaceFeature = Du;
});
var wm = E((WT, _m) => {
	var b_ = typeof process == 'object' && process && process.platform === 'win32';
	_m.exports = b_ ? { sep: '\\' } : { sep: '/' };
});
var Pm = E((UT, Tm) => {
	'use strict';
	Tm.exports = Rm;
	function Rm(n, e, t) {
		(n instanceof RegExp && (n = Dm(n, t)), e instanceof RegExp && (e = Dm(e, t)));
		var r = Sm(n, e, t);
		return (
			r && {
				start: r[0],
				end: r[1],
				pre: t.slice(0, r[0]),
				body: t.slice(r[0] + n.length, r[1]),
				post: t.slice(r[1] + e.length),
			}
		);
	}
	function Dm(n, e) {
		var t = e.match(n);
		return t ? t[0] : null;
	}
	Rm.range = Sm;
	function Sm(n, e, t) {
		var r,
			i,
			s,
			o,
			a,
			u = t.indexOf(n),
			l = t.indexOf(e, u + 1),
			p = u;
		if (u >= 0 && l > 0) {
			if (n === e) return [u, l];
			for (r = [], s = t.length; p >= 0 && !a; )
				(p == u
					? (r.push(p), (u = t.indexOf(n, p + 1)))
					: r.length == 1
						? (a = [r.pop(), l])
						: ((i = r.pop()), i < s && ((s = i), (o = l)), (l = t.indexOf(e, p + 1))),
					(p = u < l && u >= 0 ? u : l));
			r.length && (a = [s, o]);
		}
		return a;
	}
});
var Nm = E((KT, Fm) => {
	var qm = Pm();
	Fm.exports = D_;
	var Em = '\0SLASH' + Math.random() + '\0',
		km = '\0OPEN' + Math.random() + '\0',
		Su = '\0CLOSE' + Math.random() + '\0',
		xm = '\0COMMA' + Math.random() + '\0',
		Im = '\0PERIOD' + Math.random() + '\0';
	function Ru(n) {
		return parseInt(n, 10) == n ? parseInt(n, 10) : n.charCodeAt(0);
	}
	function __(n) {
		return n
			.split('\\\\')
			.join(Em)
			.split('\\{')
			.join(km)
			.split('\\}')
			.join(Su)
			.split('\\,')
			.join(xm)
			.split('\\.')
			.join(Im);
	}
	function w_(n) {
		return n
			.split(Em)
			.join('\\')
			.split(km)
			.join('{')
			.split(Su)
			.join('}')
			.split(xm)
			.join(',')
			.split(Im)
			.join('.');
	}
	function Om(n) {
		if (!n) return [''];
		var e = [],
			t = qm('{', '}', n);
		if (!t) return n.split(',');
		var r = t.pre,
			i = t.body,
			s = t.post,
			o = r.split(',');
		o[o.length - 1] += '{' + i + '}';
		var a = Om(s);
		return (
			s.length && ((o[o.length - 1] += a.shift()), o.push.apply(o, a)),
			e.push.apply(e, o),
			e
		);
	}
	function D_(n) {
		return n
			? (n.substr(0, 2) === '{}' && (n = '\\{\\}' + n.substr(2)), Gi(__(n), !0).map(w_))
			: [];
	}
	function R_(n) {
		return '{' + n + '}';
	}
	function S_(n) {
		return /^-?0\d/.test(n);
	}
	function T_(n, e) {
		return n <= e;
	}
	function P_(n, e) {
		return n >= e;
	}
	function Gi(n, e) {
		var t = [],
			r = qm('{', '}', n);
		if (!r) return [n];
		var i = r.pre,
			s = r.post.length ? Gi(r.post, !1) : [''];
		if (/\$$/.test(r.pre))
			for (var o = 0; o < s.length; o++) {
				var a = i + '{' + r.body + '}' + s[o];
				t.push(a);
			}
		else {
			var u = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(r.body),
				l = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(r.body),
				p = u || l,
				m = r.body.indexOf(',') >= 0;
			if (!p && !m)
				return r.post.match(/,(?!,).*\}/) ? ((n = r.pre + '{' + r.body + Su + r.post), Gi(n)) : [n];
			var g;
			if (p) g = r.body.split(/\.\./);
			else if (((g = Om(r.body)), g.length === 1 && ((g = Gi(g[0], !1).map(R_)), g.length === 1)))
				return s.map(function (et) {
					return r.pre + g[0] + et;
				});
			var D;
			if (p) {
				var y = Ru(g[0]),
					P = Ru(g[1]),
					q = Math.max(g[0].length, g[1].length),
					N = g.length == 3 ? Math.abs(Ru(g[2])) : 1,
					L = T_,
					M = P < y;
				M && ((N *= -1), (L = P_));
				var H = g.some(S_);
				D = [];
				for (var X = y; L(X, P); X += N) {
					var de;
					if (l) ((de = String.fromCharCode(X)), de === '\\' && (de = ''));
					else if (((de = String(X)), H)) {
						var B = q - de.length;
						if (B > 0) {
							var Z = new Array(B + 1).join('0');
							X < 0 ? (de = '-' + Z + de.slice(1)) : (de = Z + de);
						}
					}
					D.push(de);
				}
			} else {
				D = [];
				for (var ce = 0; ce < g.length; ce++) D.push.apply(D, Gi(g[ce], !1));
			}
			for (var ce = 0; ce < D.length; ce++)
				for (var o = 0; o < s.length; o++) {
					var a = i + D[ce] + s[o];
					(!e || p || a) && t.push(a);
				}
		}
		return t;
	}
});
var ho = E((VT, ku) => {
	var Jt = (ku.exports = (n, e, t = {}) => (
		fo(e),
		!t.nocomment && e.charAt(0) === '#' ? !1 : new vi(e, t).match(n)
	));
	ku.exports = Jt;
	var qu = wm();
	Jt.sep = qu.sep;
	var Dn = Symbol('globstar **');
	Jt.GLOBSTAR = Dn;
	var q_ = Nm(),
		Mm = {
			'!': { open: '(?:(?!(?:', close: '))[^/]*?)' },
			'?': { open: '(?:', close: ')?' },
			'+': { open: '(?:', close: ')+' },
			'*': { open: '(?:', close: ')*' },
			'@': { open: '(?:', close: ')' },
		},
		Eu = '[^/]',
		Tu = Eu + '*?',
		E_ = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?',
		k_ = '(?:(?!(?:\\/|^)\\.).)*?',
		jm = (n) => n.split('').reduce((e, t) => ((e[t] = !0), e), {}),
		Lm = jm('().*{}+?[]^$\\!'),
		x_ = jm('[.('),
		Am = /\/+/;
	Jt.filter =
		(n, e = {}) =>
		(t, r, i) =>
			Jt(t, n, e);
	var Dr = (n, e = {}) => {
		let t = {};
		return (
			Object.keys(n).forEach((r) => (t[r] = n[r])),
			Object.keys(e).forEach((r) => (t[r] = e[r])),
			t
		);
	};
	Jt.defaults = (n) => {
		if (!n || typeof n != 'object' || !Object.keys(n).length) return Jt;
		let e = Jt,
			t = (r, i, s) => e(r, i, Dr(n, s));
		return (
			(t.Minimatch = class extends e.Minimatch {
				constructor(i, s) {
					super(i, Dr(n, s));
				}
			}),
			(t.Minimatch.defaults = (r) => e.defaults(Dr(n, r)).Minimatch),
			(t.filter = (r, i) => e.filter(r, Dr(n, i))),
			(t.defaults = (r) => e.defaults(Dr(n, r))),
			(t.makeRe = (r, i) => e.makeRe(r, Dr(n, i))),
			(t.braceExpand = (r, i) => e.braceExpand(r, Dr(n, i))),
			(t.match = (r, i, s) => e.match(r, i, Dr(n, s))),
			t
		);
	};
	Jt.braceExpand = (n, e) => $m(n, e);
	var $m = (n, e = {}) => (fo(n), e.nobrace || !/\{(?:(?!\{).)*\}/.test(n) ? [n] : q_(n)),
		I_ = 1024 * 64,
		fo = (n) => {
			if (typeof n != 'string') throw new TypeError('invalid pattern');
			if (n.length > I_) throw new TypeError('pattern is too long');
		},
		Pu = Symbol('subparse');
	Jt.makeRe = (n, e) => new vi(n, e || {}).makeRe();
	Jt.match = (n, e, t = {}) => {
		let r = new vi(e, t);
		return ((n = n.filter((i) => r.match(i))), r.options.nonull && !n.length && n.push(e), n);
	};
	var O_ = (n) => n.replace(/\\(.)/g, '$1'),
		F_ = (n) => n.replace(/\\([^-\]])/g, '$1'),
		N_ = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
		M_ = (n) => n.replace(/[[\]\\]/g, '\\$&'),
		vi = class {
			constructor(e, t) {
				(fo(e),
					t || (t = {}),
					(this.options = t),
					(this.set = []),
					(this.pattern = e),
					(this.windowsPathsNoEscape = !!t.windowsPathsNoEscape || t.allowWindowsEscape === !1),
					this.windowsPathsNoEscape && (this.pattern = this.pattern.replace(/\\/g, '/')),
					(this.regexp = null),
					(this.negate = !1),
					(this.comment = !1),
					(this.empty = !1),
					(this.partial = !!t.partial),
					this.make());
			}
			debug() {}
			make() {
				let e = this.pattern,
					t = this.options;
				if (!t.nocomment && e.charAt(0) === '#') {
					this.comment = !0;
					return;
				}
				if (!e) {
					this.empty = !0;
					return;
				}
				this.parseNegate();
				let r = (this.globSet = this.braceExpand());
				(t.debug && (this.debug = (...i) => console.error(...i)),
					this.debug(this.pattern, r),
					(r = this.globParts = r.map((i) => i.split(Am))),
					this.debug(this.pattern, r),
					(r = r.map((i, s, o) => i.map(this.parse, this))),
					this.debug(this.pattern, r),
					(r = r.filter((i) => i.indexOf(!1) === -1)),
					this.debug(this.pattern, r),
					(this.set = r));
			}
			parseNegate() {
				if (this.options.nonegate) return;
				let e = this.pattern,
					t = !1,
					r = 0;
				for (let i = 0; i < e.length && e.charAt(i) === '!'; i++) ((t = !t), r++);
				(r && (this.pattern = e.slice(r)), (this.negate = t));
			}
			matchOne(e, t, r) {
				var i = this.options;
				(this.debug('matchOne', { this: this, file: e, pattern: t }),
					this.debug('matchOne', e.length, t.length));
				for (var s = 0, o = 0, a = e.length, u = t.length; s < a && o < u; s++, o++) {
					this.debug('matchOne loop');
					var l = t[o],
						p = e[s];
					if ((this.debug(t, l, p), l === !1)) return !1;
					if (l === Dn) {
						this.debug('GLOBSTAR', [t, l, p]);
						var m = s,
							g = o + 1;
						if (g === u) {
							for (this.debug('** at the end'); s < a; s++)
								if (e[s] === '.' || e[s] === '..' || (!i.dot && e[s].charAt(0) === '.')) return !1;
							return !0;
						}
						for (; m < a; ) {
							var D = e[m];
							if (
								(this.debug(
									`
globstar while`,
									e,
									m,
									t,
									g,
									D,
								),
								this.matchOne(e.slice(m), t.slice(g), r))
							)
								return (this.debug('globstar found match!', m, a, D), !0);
							if (D === '.' || D === '..' || (!i.dot && D.charAt(0) === '.')) {
								this.debug('dot detected!', e, m, t, g);
								break;
							}
							(this.debug('globstar swallow a segment, and continue'), m++);
						}
						return !!(
							r &&
							(this.debug(
								`
>>> no match, partial?`,
								e,
								m,
								t,
								g,
							),
							m === a)
						);
					}
					var y;
					if (
						(typeof l == 'string'
							? ((y = p === l), this.debug('string match', l, p, y))
							: ((y = p.match(l)), this.debug('pattern match', l, p, y)),
						!y)
					)
						return !1;
				}
				if (s === a && o === u) return !0;
				if (s === a) return r;
				if (o === u) return s === a - 1 && e[s] === '';
				throw new Error('wtf?');
			}
			braceExpand() {
				return $m(this.pattern, this.options);
			}
			parse(e, t) {
				fo(e);
				let r = this.options;
				if (e === '**')
					if (r.noglobstar) e = '*';
					else return Dn;
				if (e === '') return '';
				let i = '',
					s = !1,
					o = !1,
					a = [],
					u = [],
					l,
					p = !1,
					m = -1,
					g = -1,
					D,
					y,
					P,
					q = e.charAt(0) === '.',
					N = r.dot || q,
					L = () => (q ? '' : N ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)'),
					M = (B) =>
						B.charAt(0) === '.' ? '' : r.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)',
					H = () => {
						if (l) {
							switch (l) {
								case '*':
									((i += Tu), (s = !0));
									break;
								case '?':
									((i += Eu), (s = !0));
									break;
								default:
									i += '\\' + l;
									break;
							}
							(this.debug('clearStateChar %j %j', l, i), (l = !1));
						}
					};
				for (let B = 0, Z; B < e.length && (Z = e.charAt(B)); B++) {
					if ((this.debug('%s	%s %s %j', e, B, i, Z), o)) {
						if (Z === '/') return !1;
						(Lm[Z] && (i += '\\'), (i += Z), (o = !1));
						continue;
					}
					switch (Z) {
						case '/':
							return !1;
						case '\\':
							if (p && e.charAt(B + 1) === '-') {
								i += Z;
								continue;
							}
							(H(), (o = !0));
							continue;
						case '?':
						case '*':
						case '+':
						case '@':
						case '!':
							if ((this.debug('%s	%s %s %j <-- stateChar', e, B, i, Z), p)) {
								(this.debug('  in class'), Z === '!' && B === g + 1 && (Z = '^'), (i += Z));
								continue;
							}
							(this.debug('call clearStateChar %j', l), H(), (l = Z), r.noext && H());
							continue;
						case '(': {
							if (p) {
								i += '(';
								continue;
							}
							if (!l) {
								i += '\\(';
								continue;
							}
							let ce = {
								type: l,
								start: B - 1,
								reStart: i.length,
								open: Mm[l].open,
								close: Mm[l].close,
							};
							(this.debug(this.pattern, '	', ce),
								a.push(ce),
								(i += ce.open),
								ce.start === 0 && ce.type !== '!' && ((q = !0), (i += M(e.slice(B + 1)))),
								this.debug('plType %j %j', l, i),
								(l = !1));
							continue;
						}
						case ')': {
							let ce = a[a.length - 1];
							if (p || !ce) {
								i += '\\)';
								continue;
							}
							(a.pop(),
								H(),
								(s = !0),
								(y = ce),
								(i += y.close),
								y.type === '!' && u.push(Object.assign(y, { reEnd: i.length })));
							continue;
						}
						case '|': {
							let ce = a[a.length - 1];
							if (p || !ce) {
								i += '\\|';
								continue;
							}
							(H(),
								(i += '|'),
								ce.start === 0 && ce.type !== '!' && ((q = !0), (i += M(e.slice(B + 1)))));
							continue;
						}
						case '[':
							if ((H(), p)) {
								i += '\\' + Z;
								continue;
							}
							((p = !0), (g = B), (m = i.length), (i += Z));
							continue;
						case ']':
							if (B === g + 1 || !p) {
								i += '\\' + Z;
								continue;
							}
							D = e.substring(g + 1, B);
							try {
								(RegExp('[' + M_(F_(D)) + ']'), (i += Z));
							} catch {
								i = i.substring(0, m) + '(?:$.)';
							}
							((s = !0), (p = !1));
							continue;
						default:
							(H(), Lm[Z] && !(Z === '^' && p) && (i += '\\'), (i += Z));
							break;
					}
				}
				for (
					p &&
						((D = e.slice(g + 1)),
						(P = this.parse(D, Pu)),
						(i = i.substring(0, m) + '\\[' + P[0]),
						(s = s || P[1])),
						y = a.pop();
					y;
					y = a.pop()
				) {
					let B;
					((B = i.slice(y.reStart + y.open.length)),
						this.debug('setting tail', i, y),
						(B = B.replace(
							/((?:\\{2}){0,64})(\\?)\|/g,
							(ce, et, Xe) => (Xe || (Xe = '\\'), et + et + Xe + '|'),
						)),
						this.debug(
							`tail=%j
   %s`,
							B,
							B,
							y,
							i,
						));
					let Z = y.type === '*' ? Tu : y.type === '?' ? Eu : '\\' + y.type;
					((s = !0), (i = i.slice(0, y.reStart) + Z + '\\(' + B));
				}
				(H(), o && (i += '\\\\'));
				let X = x_[i.charAt(0)];
				for (let B = u.length - 1; B > -1; B--) {
					let Z = u[B],
						ce = i.slice(0, Z.reStart),
						et = i.slice(Z.reStart, Z.reEnd - 8),
						Xe = i.slice(Z.reEnd),
						rt = i.slice(Z.reEnd - 8, Z.reEnd) + Xe,
						tn = ce.split(')').length,
						qt = ce.split('(').length - tn,
						pt = Xe;
					for (let gn = 0; gn < qt; gn++) pt = pt.replace(/\)[+*?]?/, '');
					Xe = pt;
					let gt = Xe === '' && t !== Pu ? '(?:$|\\/)' : '';
					i = ce + et + Xe + gt + rt;
				}
				if ((i !== '' && s && (i = '(?=.)' + i), X && (i = L() + i), t === Pu)) return [i, s];
				if ((r.nocase && !s && (s = e.toUpperCase() !== e.toLowerCase()), !s)) return O_(e);
				let de = r.nocase ? 'i' : '';
				try {
					return Object.assign(new RegExp('^' + i + '$', de), { _glob: e, _src: i });
				} catch {
					return new RegExp('$.');
				}
			}
			makeRe() {
				if (this.regexp || this.regexp === !1) return this.regexp;
				let e = this.set;
				if (!e.length) return ((this.regexp = !1), this.regexp);
				let t = this.options,
					r = t.noglobstar ? Tu : t.dot ? E_ : k_,
					i = t.nocase ? 'i' : '',
					s = e
						.map(
							(o) => (
								(o = o
									.map((a) => (typeof a == 'string' ? N_(a) : a === Dn ? Dn : a._src))
									.reduce((a, u) => ((a[a.length - 1] === Dn && u === Dn) || a.push(u), a), [])),
								o.forEach((a, u) => {
									a !== Dn ||
										o[u - 1] === Dn ||
										(u === 0
											? o.length > 1
												? (o[u + 1] = '(?:\\/|' + r + '\\/)?' + o[u + 1])
												: (o[u] = r)
											: u === o.length - 1
												? (o[u - 1] += '(?:\\/|' + r + ')?')
												: ((o[u - 1] += '(?:\\/|\\/' + r + '\\/)' + o[u + 1]), (o[u + 1] = Dn)));
								}),
								o.filter((a) => a !== Dn).join('/')
							),
						)
						.join('|');
				((s = '^(?:' + s + ')$'), this.negate && (s = '^(?!' + s + ').*$'));
				try {
					this.regexp = new RegExp(s, i);
				} catch {
					this.regexp = !1;
				}
				return this.regexp;
			}
			match(e, t = this.partial) {
				if ((this.debug('match', e, this.pattern), this.comment)) return !1;
				if (this.empty) return e === '';
				if (e === '/' && t) return !0;
				let r = this.options;
				(qu.sep !== '/' && (e = e.split(qu.sep).join('/')),
					(e = e.split(Am)),
					this.debug(this.pattern, 'split', e));
				let i = this.set;
				this.debug(this.pattern, 'set', i);
				let s;
				for (let o = e.length - 1; o >= 0 && ((s = e[o]), !s); o--);
				for (let o = 0; o < i.length; o++) {
					let a = i[o],
						u = e;
					if ((r.matchBase && a.length === 1 && (u = [s]), this.matchOne(u, a, t)))
						return r.flipNegate ? !0 : !this.negate;
				}
				return r.flipNegate ? !1 : this.negate;
			}
			static defaults(e) {
				return Jt.defaults(e).Minimatch;
			}
		};
	Jt.Minimatch = vi;
});
var Lu = E((Rr) => {
	'use strict';
	Object.defineProperty(Rr, '__esModule', { value: !0 });
	Rr.DiagnosticFeature = Rr.DiagnosticPullMode = Rr.vsdiag = void 0;
	var L_ = ho(),
		he = require('vscode'),
		Ze = ee(),
		A_ = We(),
		xu = ye();
	function po(n, e) {
		return (n[e] === void 0 && (n[e] = {}), n[e]);
	}
	var dn;
	(function (n) {
		let e;
		(function (t) {
			((t.full = 'full'), (t.unChanged = 'unChanged'));
		})((e = n.DocumentDiagnosticReportKind || (n.DocumentDiagnosticReportKind = {})));
	})(dn || (Rr.vsdiag = dn = {}));
	var go;
	(function (n) {
		((n.onType = 'onType'), (n.onSave = 'onSave'));
	})(go || (Rr.DiagnosticPullMode = go = {}));
	var St;
	(function (n) {
		((n.active = 'open'), (n.reschedule = 'reschedule'), (n.outDated = 'drop'));
	})(St || (St = {}));
	var Ar = class {
			constructor() {
				((this.open = new Set()),
					(this._onOpen = new he.EventEmitter()),
					(this._onClose = new he.EventEmitter()),
					Ar.fillTabResources(this.open));
				let e = (t) => {
					if (t.closed.length === 0 && t.opened.length === 0) return;
					let r = this.open,
						i = new Set();
					Ar.fillTabResources(i);
					let s = new Set(),
						o = new Set(i);
					for (let a of r.values()) i.has(a) ? o.delete(a) : s.add(a);
					if (((this.open = i), s.size > 0)) {
						let a = new Set();
						for (let u of s) a.add(he.Uri.parse(u));
						this._onClose.fire(a);
					}
					if (o.size > 0) {
						let a = new Set();
						for (let u of o) a.add(he.Uri.parse(u));
						this._onOpen.fire(a);
					}
				};
				he.window.tabGroups.onDidChangeTabs !== void 0
					? (this.disposable = he.window.tabGroups.onDidChangeTabs(e))
					: (this.disposable = { dispose: () => {} });
			}
			get onClose() {
				return this._onClose.event;
			}
			get onOpen() {
				return this._onOpen.event;
			}
			dispose() {
				this.disposable.dispose();
			}
			isActive(e) {
				return e instanceof he.Uri
					? he.window.activeTextEditor?.document.uri === e
					: he.window.activeTextEditor?.document === e;
			}
			isVisible(e) {
				let t = e instanceof he.Uri ? e : e.uri;
				return this.open.has(t.toString());
			}
			getTabResources() {
				let e = new Set();
				return (Ar.fillTabResources(new Set(), e), e);
			}
			static fillTabResources(e, t) {
				let r = e ?? new Set();
				for (let i of he.window.tabGroups.all)
					for (let s of i.tabs) {
						let o = s.input,
							a;
						(o instanceof he.TabInputText
							? (a = o.uri)
							: o instanceof he.TabInputTextDiff
								? (a = o.modified)
								: o instanceof he.TabInputCustom && (a = o.uri),
							a !== void 0 &&
								!r.has(a.toString()) &&
								(r.add(a.toString()), t !== void 0 && t.add(a)));
					}
			}
		},
		at;
	(function (n) {
		((n[(n.document = 1)] = 'document'), (n[(n.workspace = 2)] = 'workspace'));
	})(at || (at = {}));
	var Yn;
	(function (n) {
		function e(t) {
			return t instanceof he.Uri ? t.toString() : t.uri.toString();
		}
		n.asKey = e;
	})(Yn || (Yn = {}));
	var Iu = class {
			constructor() {
				((this.documentPullStates = new Map()), (this.workspacePullStates = new Map()));
			}
			track(e, t, r) {
				let i = e === at.document ? this.documentPullStates : this.workspacePullStates,
					[s, o, a] =
						t instanceof he.Uri ? [t.toString(), t, r] : [t.uri.toString(), t.uri, t.version],
					u = i.get(s);
				return (
					u === void 0 && ((u = { document: o, pulledVersion: a, resultId: void 0 }), i.set(s, u)),
					u
				);
			}
			update(e, t, r, i) {
				let s = e === at.document ? this.documentPullStates : this.workspacePullStates,
					[o, a, u, l] =
						t instanceof he.Uri ? [t.toString(), t, r, i] : [t.uri.toString(), t.uri, t.version, r],
					p = s.get(o);
				p === void 0
					? ((p = { document: a, pulledVersion: u, resultId: l }), s.set(o, p))
					: ((p.pulledVersion = u), (p.resultId = l));
			}
			unTrack(e, t) {
				let r = Yn.asKey(t);
				(e === at.document ? this.documentPullStates : this.workspacePullStates).delete(r);
			}
			tracks(e, t) {
				let r = Yn.asKey(t);
				return (e === at.document ? this.documentPullStates : this.workspacePullStates).has(r);
			}
			getResultId(e, t) {
				let r = Yn.asKey(t);
				return (e === at.document ? this.documentPullStates : this.workspacePullStates).get(r)
					?.resultId;
			}
			getAllResultIds() {
				let e = [];
				for (let [t, r] of this.workspacePullStates)
					(this.documentPullStates.has(t) && (r = this.documentPullStates.get(t)),
						r.resultId !== void 0 && e.push({ uri: t, value: r.resultId }));
				return e;
			}
		},
		Ou = class {
			constructor(e, t, r) {
				((this.client = e),
					(this.tabs = t),
					(this.options = r),
					(this.isDisposed = !1),
					(this.onDidChangeDiagnosticsEmitter = new he.EventEmitter()),
					(this.provider = this.createProvider()),
					(this.diagnostics = he.languages.createDiagnosticCollection(r.identifier)),
					(this.openRequests = new Map()),
					(this.documentStates = new Iu()),
					(this.workspaceErrorCounter = 0));
			}
			knows(e, t) {
				let r = t instanceof he.Uri ? t : t.uri;
				return this.documentStates.tracks(e, t) || this.openRequests.has(r.toString());
			}
			forget(e, t) {
				this.documentStates.unTrack(e, t);
			}
			pull(e, t) {
				if (this.isDisposed) return;
				let r = e instanceof he.Uri ? e : e.uri;
				this.pullAsync(e).then(
					() => {
						t && t();
					},
					(i) => {
						this.client.error(`Document pull failed for text document ${r.toString()}`, i, !1);
					},
				);
			}
			async pullAsync(e, t) {
				if (this.isDisposed) return;
				let r = e instanceof he.Uri,
					i = r ? e : e.uri,
					s = i.toString();
				t = r ? t : e.version;
				let o = this.openRequests.get(s),
					a = r
						? this.documentStates.track(at.document, e, t)
						: this.documentStates.track(at.document, e);
				if (o === void 0) {
					let u = new he.CancellationTokenSource();
					this.openRequests.set(s, { state: St.active, document: e, version: t, tokenSource: u });
					let l, p;
					try {
						l = (await this.provider.provideDiagnostics(e, a.resultId, u.token)) ?? {
							kind: dn.DocumentDiagnosticReportKind.full,
							items: [],
						};
					} catch (m) {
						if (
							(m instanceof xu.LSPCancellationError &&
								Ze.DiagnosticServerCancellationData.is(m.data) &&
								m.data.retriggerRequest === !1 &&
								(p = { state: St.outDated, document: e }),
							p === void 0 && m instanceof he.CancellationError)
						)
							p = { state: St.reschedule, document: e };
						else throw m;
					}
					if (((p = p ?? this.openRequests.get(s)), p === void 0)) {
						(this.client.error(
							`Lost request state in diagnostic pull model. Clearing diagnostics for ${s}`,
						),
							this.diagnostics.delete(i));
						return;
					}
					if ((this.openRequests.delete(s), !this.tabs.isVisible(e))) {
						this.documentStates.unTrack(at.document, e);
						return;
					}
					if (p.state === St.outDated) return;
					(l !== void 0 &&
						(l.kind === dn.DocumentDiagnosticReportKind.full && this.diagnostics.set(i, l.items),
						(a.pulledVersion = t),
						(a.resultId = l.resultId)),
						p.state === St.reschedule && this.pull(e));
				} else
					o.state === St.active
						? (o.tokenSource.cancel(),
							this.openRequests.set(s, { state: St.reschedule, document: o.document }))
						: o.state === St.outDated &&
							this.openRequests.set(s, { state: St.reschedule, document: o.document });
			}
			forgetDocument(e) {
				let t = e instanceof he.Uri ? e : e.uri,
					r = t.toString(),
					i = this.openRequests.get(r);
				this.options.workspaceDiagnostics
					? i !== void 0
						? this.openRequests.set(r, { state: St.reschedule, document: e })
						: this.pull(e, () => {
								this.forget(at.document, e);
							})
					: (i !== void 0 &&
							(i.state === St.active && i.tokenSource.cancel(),
							this.openRequests.set(r, { state: St.outDated, document: e })),
						this.diagnostics.delete(t),
						this.forget(at.document, e));
			}
			pullWorkspace() {
				this.isDisposed ||
					this.pullWorkspaceAsync().then(
						() => {
							this.workspaceTimeout = (0, Ze.RAL)().timer.setTimeout(() => {
								this.pullWorkspace();
							}, 2e3);
						},
						(e) => {
							(!(e instanceof xu.LSPCancellationError) &&
								!Ze.DiagnosticServerCancellationData.is(e.data) &&
								(this.client.error('Workspace diagnostic pull failed.', e, !1),
								this.workspaceErrorCounter++),
								this.workspaceErrorCounter <= 5 &&
									(this.workspaceTimeout = (0, Ze.RAL)().timer.setTimeout(() => {
										this.pullWorkspace();
									}, 2e3)));
						},
					);
			}
			async pullWorkspaceAsync() {
				if (!this.provider.provideWorkspaceDiagnostics || this.isDisposed) return;
				(this.workspaceCancellation !== void 0 &&
					(this.workspaceCancellation.cancel(), (this.workspaceCancellation = void 0)),
					(this.workspaceCancellation = new he.CancellationTokenSource()));
				let e = this.documentStates
					.getAllResultIds()
					.map((t) => ({ uri: this.client.protocol2CodeConverter.asUri(t.uri), value: t.value }));
				await this.provider.provideWorkspaceDiagnostics(
					e,
					this.workspaceCancellation.token,
					(t) => {
						if (!(!t || this.isDisposed))
							for (let r of t.items)
								(r.kind === dn.DocumentDiagnosticReportKind.full &&
									(this.documentStates.tracks(at.document, r.uri) ||
										this.diagnostics.set(r.uri, r.items)),
									this.documentStates.update(at.workspace, r.uri, r.version ?? void 0, r.resultId));
					},
				);
			}
			createProvider() {
				let e = {
					onDidChangeDiagnostics: this.onDidChangeDiagnosticsEmitter.event,
					provideDiagnostics: (t, r, i) => {
						let s = (a, u, l) => {
								let p = {
									identifier: this.options.identifier,
									textDocument: {
										uri: this.client.code2ProtocolConverter.asUri(a instanceof he.Uri ? a : a.uri),
									},
									previousResultId: u,
								};
								return this.isDisposed === !0 || !this.client.isRunning()
									? { kind: dn.DocumentDiagnosticReportKind.full, items: [] }
									: this.client.sendRequest(Ze.DocumentDiagnosticRequest.type, p, l).then(
											async (m) =>
												m == null || this.isDisposed || l.isCancellationRequested
													? { kind: dn.DocumentDiagnosticReportKind.full, items: [] }
													: m.kind === Ze.DocumentDiagnosticReportKind.Full
														? {
																kind: dn.DocumentDiagnosticReportKind.full,
																resultId: m.resultId,
																items: await this.client.protocol2CodeConverter.asDiagnostics(
																	m.items,
																	l,
																),
															}
														: {
																kind: dn.DocumentDiagnosticReportKind.unChanged,
																resultId: m.resultId,
															},
											(m) =>
												this.client.handleFailedRequest(Ze.DocumentDiagnosticRequest.type, l, m, {
													kind: dn.DocumentDiagnosticReportKind.full,
													items: [],
												}),
										);
							},
							o = this.client.middleware;
						return o.provideDiagnostics ? o.provideDiagnostics(t, r, i, s) : s(t, r, i);
					},
				};
				return (
					this.options.workspaceDiagnostics &&
						(e.provideWorkspaceDiagnostics = (t, r, i) => {
							let s = async (l) =>
									l.kind === Ze.DocumentDiagnosticReportKind.Full
										? {
												kind: dn.DocumentDiagnosticReportKind.full,
												uri: this.client.protocol2CodeConverter.asUri(l.uri),
												resultId: l.resultId,
												version: l.version,
												items: await this.client.protocol2CodeConverter.asDiagnostics(l.items, r),
											}
										: {
												kind: dn.DocumentDiagnosticReportKind.unChanged,
												uri: this.client.protocol2CodeConverter.asUri(l.uri),
												resultId: l.resultId,
												version: l.version,
											},
								o = (l) => {
									let p = [];
									for (let m of l)
										p.push({
											uri: this.client.code2ProtocolConverter.asUri(m.uri),
											value: m.value,
										});
									return p;
								},
								a = (l, p) => {
									let m = (0, A_.generateUuid)(),
										g = this.client.onProgress(
											Ze.WorkspaceDiagnosticRequest.partialResult,
											m,
											async (y) => {
												if (y == null) {
													i(null);
													return;
												}
												let P = { items: [] };
												for (let q of y.items)
													try {
														P.items.push(await s(q));
													} catch (N) {
														this.client.error('Converting workspace diagnostics failed.', N);
													}
												i(P);
											},
										),
										D = {
											identifier: this.options.identifier,
											previousResultIds: o(l),
											partialResultToken: m,
										};
									return this.isDisposed === !0 || !this.client.isRunning()
										? { items: [] }
										: this.client.sendRequest(Ze.WorkspaceDiagnosticRequest.type, D, p).then(
												async (y) => {
													if (p.isCancellationRequested) return { items: [] };
													let P = { items: [] };
													for (let q of y.items) P.items.push(await s(q));
													return (g.dispose(), i(P), { items: [] });
												},
												(y) => (
													g.dispose(),
													this.client.handleFailedRequest(Ze.DocumentDiagnosticRequest.type, p, y, {
														items: [],
													})
												),
											);
								},
								u = this.client.middleware;
							return u.provideWorkspaceDiagnostics
								? u.provideWorkspaceDiagnostics(t, r, i, a)
								: a(t, r, i);
						}),
					e
				);
			}
			dispose() {
				((this.isDisposed = !0),
					this.workspaceCancellation?.cancel(),
					this.workspaceTimeout?.dispose());
				for (let [e, t] of this.openRequests)
					(t.state === St.active && t.tokenSource.cancel(),
						this.openRequests.set(e, { state: St.outDated, document: t.document }));
				this.diagnostics.dispose();
			}
		},
		Fu = class {
			constructor(e) {
				((this.diagnosticRequestor = e),
					(this.documents = new Ze.LinkedMap()),
					(this.isDisposed = !1));
			}
			add(e) {
				if (this.isDisposed === !0) return;
				let t = Yn.asKey(e);
				this.documents.has(t) || (this.documents.set(t, e, Ze.Touch.Last), this.trigger());
			}
			remove(e) {
				let t = Yn.asKey(e);
				(this.documents.delete(t),
					this.documents.size === 0
						? this.stop()
						: t === this.endDocumentKey() && (this.endDocument = this.documents.last));
			}
			trigger() {
				if (this.isDisposed !== !0) {
					if (this.intervalHandle !== void 0) {
						this.endDocument = this.documents.last;
						return;
					}
					((this.endDocument = this.documents.last),
						(this.intervalHandle = (0, Ze.RAL)().timer.setInterval(() => {
							let e = this.documents.first;
							if (e !== void 0) {
								let t = Yn.asKey(e);
								(this.diagnosticRequestor.pull(e),
									this.documents.set(t, e, Ze.Touch.Last),
									t === this.endDocumentKey() && this.stop());
							}
						}, 200)));
				}
			}
			dispose() {
				((this.isDisposed = !0), this.stop(), this.documents.clear());
			}
			stop() {
				(this.intervalHandle?.dispose(),
					(this.intervalHandle = void 0),
					(this.endDocument = void 0));
			}
			endDocumentKey() {
				return this.endDocument !== void 0 ? Yn.asKey(this.endDocument) : void 0;
			}
		},
		Nu = class {
			constructor(e, t, r) {
				let i = e.clientOptions.diagnosticPullOptions ?? { onChange: !0, onSave: !1 },
					s = e.protocol2CodeConverter.asDocumentSelector(r.documentSelector),
					o = [],
					a = (y) => {
						let P = r.documentSelector;
						if (i.match !== void 0) return i.match(P, y);
						for (let q of P)
							if (Ze.TextDocumentFilter.is(q)) {
								if (
									typeof q == 'string' ||
									(q.language !== void 0 && q.language !== '*') ||
									(q.scheme !== void 0 && q.scheme !== '*' && q.scheme !== y.scheme)
								)
									return !1;
								if (q.pattern !== void 0) {
									let N = new L_.Minimatch(q.pattern, { noext: !0 });
									if (!N.makeRe() || !N.match(y.fsPath)) return !1;
								}
							}
						return !0;
					},
					u = (y) => (y instanceof he.Uri ? a(y) : he.languages.match(s, y) > 0 && t.isVisible(y)),
					l = (y) =>
						y instanceof he.Uri
							? this.activeTextDocument?.uri.toString() === y.toString()
							: this.activeTextDocument === y;
				((this.diagnosticRequestor = new Ou(e, t, r)),
					(this.backgroundScheduler = new Fu(this.diagnosticRequestor)));
				let p = (y) => {
					!u(y) || !r.interFileDependencies || l(y) || this.backgroundScheduler.add(y);
				};
				((this.activeTextDocument = he.window.activeTextEditor?.document),
					he.window.onDidChangeActiveTextEditor((y) => {
						let P = this.activeTextDocument;
						((this.activeTextDocument = y?.document),
							P !== void 0 && p(P),
							this.activeTextDocument !== void 0 &&
								this.backgroundScheduler.remove(this.activeTextDocument));
					}));
				let m = e.getFeature(Ze.DidOpenTextDocumentNotification.method);
				(o.push(
					m.onNotificationSent((y) => {
						let P = y.textDocument;
						this.diagnosticRequestor.knows(at.document, P) ||
							(u(P) &&
								this.diagnosticRequestor.pull(P, () => {
									p(P);
								}));
					}),
				),
					o.push(
						t.onOpen((y) => {
							for (let P of y) {
								if (this.diagnosticRequestor.knows(at.document, P)) continue;
								let q = P.toString(),
									N;
								for (let L of he.workspace.textDocuments)
									if (q === L.uri.toString()) {
										N = L;
										break;
									}
								N !== void 0 &&
									u(N) &&
									this.diagnosticRequestor.pull(N, () => {
										p(N);
									});
							}
						}),
					));
				let g = new Set();
				for (let y of he.workspace.textDocuments)
					u(y) &&
						(this.diagnosticRequestor.pull(y, () => {
							p(y);
						}),
						g.add(y.uri.toString()));
				if (i.onTabs === !0)
					for (let y of t.getTabResources())
						!g.has(y.toString()) &&
							u(y) &&
							this.diagnosticRequestor.pull(y, () => {
								p(y);
							});
				if (i.onChange === !0) {
					let y = e.getFeature(Ze.DidChangeTextDocumentNotification.method);
					o.push(
						y.onNotificationSent(async (P) => {
							let q = P.textDocument;
							(i.filter === void 0 || !i.filter(q, go.onType)) &&
								this.diagnosticRequestor.knows(at.document, q) &&
								this.diagnosticRequestor.pull(q, () => {
									this.backgroundScheduler.trigger();
								});
						}),
					);
				}
				if (i.onSave === !0) {
					let y = e.getFeature(Ze.DidSaveTextDocumentNotification.method);
					o.push(
						y.onNotificationSent((P) => {
							let q = P.textDocument;
							(i.filter === void 0 || !i.filter(q, go.onSave)) &&
								this.diagnosticRequestor.knows(at.document, q) &&
								this.diagnosticRequestor.pull(P.textDocument, () => {
									this.backgroundScheduler.trigger();
								});
						}),
					);
				}
				let D = e.getFeature(Ze.DidCloseTextDocumentNotification.method);
				(o.push(
					D.onNotificationSent((y) => {
						this.cleanUpDocument(y.textDocument);
					}),
				),
					t.onClose((y) => {
						for (let P of y) this.cleanUpDocument(P);
					}),
					this.diagnosticRequestor.onDidChangeDiagnosticsEmitter.event(() => {
						for (let y of he.workspace.textDocuments) u(y) && this.diagnosticRequestor.pull(y);
					}),
					r.workspaceDiagnostics === !0 &&
						r.identifier !== 'da348dc5-c30a-4515-9d98-31ff3be38d14' &&
						this.diagnosticRequestor.pullWorkspace(),
					(this.disposable = he.Disposable.from(
						...o,
						this.backgroundScheduler,
						this.diagnosticRequestor,
					)));
			}
			get onDidChangeDiagnosticsEmitter() {
				return this.diagnosticRequestor.onDidChangeDiagnosticsEmitter;
			}
			get diagnostics() {
				return this.diagnosticRequestor.provider;
			}
			cleanUpDocument(e) {
				this.diagnosticRequestor.knows(at.document, e) &&
					(this.diagnosticRequestor.forgetDocument(e), this.backgroundScheduler.remove(e));
			}
		},
		Mu = class extends xu.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Ze.DocumentDiagnosticRequest.type);
			}
			fillClientCapabilities(e) {
				let t = po(po(e, 'textDocument'), 'diagnostic');
				((t.dynamicRegistration = !0),
					(t.relatedDocumentSupport = !1),
					(po(po(e, 'workspace'), 'diagnostics').refreshSupport = !0));
			}
			initialize(e, t) {
				this._client.onRequest(Ze.DiagnosticRefreshRequest.type, async () => {
					for (let o of this.getAllProviders()) o.onDidChangeDiagnosticsEmitter.fire();
				});
				let [i, s] = this.getRegistration(t, e.diagnosticProvider);
				!i || !s || this.register({ id: i, registerOptions: s });
			}
			clear() {
				(this.tabs !== void 0 && (this.tabs.dispose(), (this.tabs = void 0)), super.clear());
			}
			registerLanguageProvider(e) {
				this.tabs === void 0 && (this.tabs = new Ar());
				let t = new Nu(this._client, this.tabs, e);
				return [t.disposable, t];
			}
		};
	Rr.DiagnosticFeature = Mu;
});
var Um = E((yo) => {
	'use strict';
	Object.defineProperty(yo, '__esModule', { value: !0 });
	yo.NotebookDocumentSyncFeature = void 0;
	var Tt = require('vscode'),
		j_ = ho(),
		Zn = ee(),
		$_ = We(),
		Hm = cn();
	function Wm(n, e) {
		return (n[e] === void 0 && (n[e] = {}), n[e]);
	}
	var yi;
	(function (n) {
		let e;
		(function (t) {
			function r(g, D) {
				return { version: g.version, uri: D.asUri(g.uri) };
			}
			t.asVersionedNotebookDocumentIdentifier = r;
			function i(g, D, y) {
				let P = Zn.NotebookDocument.create(y.asUri(g.uri), g.notebookType, g.version, s(D, y));
				return (Object.keys(g.metadata).length > 0 && (P.metadata = o(g.metadata)), P);
			}
			t.asNotebookDocument = i;
			function s(g, D) {
				return g.map((y) => a(y, D));
			}
			t.asNotebookCells = s;
			function o(g) {
				return l(new Set(), g);
			}
			t.asMetadata = o;
			function a(g, D) {
				let y = Zn.NotebookCell.create(u(g.kind), D.asUri(g.document.uri));
				return (
					Object.keys(g.metadata).length > 0 && (y.metadata = o(g.metadata)),
					g.executionSummary !== void 0 &&
						Hm.number(g.executionSummary.executionOrder) &&
						Hm.boolean(g.executionSummary.success) &&
						(y.executionSummary = {
							executionOrder: g.executionSummary.executionOrder,
							success: g.executionSummary.success,
						}),
					y
				);
			}
			t.asNotebookCell = a;
			function u(g) {
				switch (g) {
					case Tt.NotebookCellKind.Markup:
						return Zn.NotebookCellKind.Markup;
					case Tt.NotebookCellKind.Code:
						return Zn.NotebookCellKind.Code;
				}
			}
			function l(g, D) {
				if (g.has(D)) throw new Error("Can't deep copy cyclic structures.");
				if (Array.isArray(D)) {
					let y = [];
					for (let P of D)
						if ((P !== null && typeof P == 'object') || Array.isArray(P)) y.push(l(g, P));
						else {
							if (P instanceof RegExp)
								throw new Error("Can't transfer regular expressions to the server");
							y.push(P);
						}
					return y;
				} else {
					let y = Object.keys(D),
						P = Object.create(null);
					for (let q of y) {
						let N = D[q];
						if ((N !== null && typeof N == 'object') || Array.isArray(N)) P[q] = l(g, N);
						else {
							if (N instanceof RegExp)
								throw new Error("Can't transfer regular expressions to the server");
							P[q] = N;
						}
					}
					return P;
				}
			}
			function p(g, D) {
				let y = D.asChangeTextDocumentParams(g, g.document.uri, g.document.version);
				return { document: y.textDocument, changes: y.contentChanges };
			}
			t.asTextContentChange = p;
			function m(g, D) {
				let y = Object.create(null);
				if ((g.metadata && (y.metadata = n.c2p.asMetadata(g.metadata)), g.cells !== void 0)) {
					let P = Object.create(null),
						q = g.cells;
					(q.structure &&
						(P.structure = {
							array: {
								start: q.structure.array.start,
								deleteCount: q.structure.array.deleteCount,
								cells:
									q.structure.array.cells !== void 0
										? q.structure.array.cells.map((N) => n.c2p.asNotebookCell(N, D))
										: void 0,
							},
							didOpen:
								q.structure.didOpen !== void 0
									? q.structure.didOpen.map(
											(N) => D.asOpenTextDocumentParams(N.document).textDocument,
										)
									: void 0,
							didClose:
								q.structure.didClose !== void 0
									? q.structure.didClose.map(
											(N) => D.asCloseTextDocumentParams(N.document).textDocument,
										)
									: void 0,
						}),
						q.data !== void 0 && (P.data = q.data.map((N) => n.c2p.asNotebookCell(N, D))),
						q.textContent !== void 0 &&
							(P.textContent = q.textContent.map((N) => n.c2p.asTextContentChange(N, D))),
						Object.keys(P).length > 0 && (y.cells = P));
				}
				return y;
			}
			t.asNotebookDocumentChangeEvent = m;
		})((e = n.c2p || (n.c2p = {})));
	})(yi || (yi = {}));
	var Au;
	(function (n) {
		function e(a, u, l) {
			let p = a.length,
				m = u.length,
				g = 0;
			for (; g < m && g < p && t(a[g], u[g], l); ) g++;
			if (g < m && g < p) {
				let D = p - 1,
					y = m - 1;
				for (; D >= 0 && y >= 0 && t(a[D], u[y], l); ) (D--, y--);
				let P = D + 1 - g,
					q = g === y + 1 ? void 0 : u.slice(g, y + 1);
				return q !== void 0 ? { start: g, deleteCount: P, cells: q } : { start: g, deleteCount: P };
			} else
				return g < m
					? { start: g, deleteCount: 0, cells: u.slice(g) }
					: g < p
						? { start: g, deleteCount: p - g }
						: void 0;
		}
		n.computeDiff = e;
		function t(a, u, l = !0) {
			return a.kind !== u.kind ||
				a.document.uri.toString() !== u.document.uri.toString() ||
				a.document.languageId !== u.document.languageId ||
				!r(a.executionSummary, u.executionSummary)
				? !1
				: !l || (l && s(a.metadata, u.metadata));
		}
		function r(a, u) {
			return a === u
				? !0
				: a === void 0 || u === void 0
					? !1
					: a.executionOrder === u.executionOrder &&
						a.success === u.success &&
						i(a.timing, u.timing);
		}
		function i(a, u) {
			return a === u
				? !0
				: a === void 0 || u === void 0
					? !1
					: a.startTime === u.startTime && a.endTime === u.endTime;
		}
		function s(a, u) {
			if (a === u) return !0;
			if (a == null || u === null || u === void 0 || typeof a != typeof u || typeof a != 'object')
				return !1;
			let l = Array.isArray(a),
				p = Array.isArray(u);
			if (l !== p) return !1;
			if (l && p) {
				if (a.length !== u.length) return !1;
				for (let m = 0; m < a.length; m++) if (!s(a[m], u[m])) return !1;
			}
			if (o(a) && o(u)) {
				let m = Object.keys(a),
					g = Object.keys(u);
				if (m.length !== g.length || (m.sort(), g.sort(), !s(m, g))) return !1;
				for (let D = 0; D < m.length; D++) {
					let y = m[D];
					if (!s(a[y], u[y])) return !1;
				}
				return !0;
			}
			return !1;
		}
		function o(a) {
			return a !== null && typeof a == 'object';
		}
		n.isObjectLiteral = o;
	})(Au || (Au = {}));
	var ju;
	(function (n) {
		function e(t, r) {
			if (typeof t == 'string') return t === '*' || r.notebookType === t;
			if (t.notebookType !== void 0 && t.notebookType !== '*' && r.notebookType !== t.notebookType)
				return !1;
			let i = r.uri;
			if (t.scheme !== void 0 && t.scheme !== '*' && i.scheme !== t.scheme) return !1;
			if (t.pattern !== void 0) {
				let s = new j_.Minimatch(t.pattern, { noext: !0 });
				if (!s.makeRe() || !s.match(i.fsPath)) return !1;
			}
			return !0;
		}
		n.matchNotebook = e;
	})(ju || (ju = {}));
	var mo;
	(function (n) {
		function e(r) {
			let i = r.notebookSelector,
				s = [];
			for (let o of i) {
				let a = (typeof o.notebook == 'string' ? o.notebook : o.notebook?.notebookType) ?? '*',
					u = typeof o.notebook == 'string' ? void 0 : o.notebook?.scheme,
					l = typeof o.notebook == 'string' ? void 0 : o.notebook?.pattern;
				if (o.cells !== void 0) for (let p of o.cells) s.push(t(a, u, l, p.language));
				else s.push(t(a, u, l, void 0));
			}
			return s;
		}
		n.asDocumentSelector = e;
		function t(r, i, s, o) {
			return i === void 0 && s === void 0
				? { notebook: r, language: o }
				: { notebook: { notebookType: r, scheme: i, pattern: s }, language: o };
		}
	})(mo || (mo = {}));
	var vo;
	(function (n) {
		function e(t) {
			return { cells: t, uris: new Set(t.map((r) => r.document.uri.toString())) };
		}
		n.create = e;
	})(vo || (vo = {}));
	var Ci = class {
			constructor(e, t) {
				((this.client = e),
					(this.options = t),
					(this.notebookSyncInfo = new Map()),
					(this.notebookDidOpen = new Set()),
					(this.disposables = []),
					(this.selector = e.protocol2CodeConverter.asDocumentSelector(mo.asDocumentSelector(t))),
					Tt.workspace.onDidOpenNotebookDocument(
						(r) => {
							(this.notebookDidOpen.add(r.uri.toString()), this.didOpen(r));
						},
						void 0,
						this.disposables,
					));
				for (let r of Tt.workspace.notebookDocuments)
					(this.notebookDidOpen.add(r.uri.toString()), this.didOpen(r));
				(Tt.workspace.onDidChangeNotebookDocument(
					(r) => this.didChangeNotebookDocument(r),
					void 0,
					this.disposables,
				),
					this.options.save === !0 &&
						Tt.workspace.onDidSaveNotebookDocument(
							(r) => this.didSave(r),
							void 0,
							this.disposables,
						),
					Tt.workspace.onDidCloseNotebookDocument(
						(r) => {
							(this.didClose(r), this.notebookDidOpen.delete(r.uri.toString()));
						},
						void 0,
						this.disposables,
					));
			}
			getState() {
				for (let e of Tt.workspace.notebookDocuments)
					if (this.getMatchingCells(e) !== void 0)
						return { kind: 'document', id: '$internal', registrations: !0, matches: !0 };
				return { kind: 'document', id: '$internal', registrations: !0, matches: !1 };
			}
			get mode() {
				return 'notebook';
			}
			handles(e) {
				return Tt.languages.match(this.selector, e) > 0;
			}
			didOpenNotebookCellTextDocument(e, t) {
				if (
					Tt.languages.match(this.selector, t.document) === 0 ||
					!this.notebookDidOpen.has(e.uri.toString())
				)
					return;
				let r = this.notebookSyncInfo.get(e.uri.toString()),
					i = this.cellMatches(e, t);
				if (r !== void 0) {
					let s = r.uris.has(t.document.uri.toString());
					if ((i && s) || (!i && !s)) return;
					if (i) {
						let o = this.getMatchingCells(e);
						if (o !== void 0) {
							let a = this.asNotebookDocumentChangeEvent(e, void 0, r, o);
							a !== void 0 && this.doSendChange(a, o).catch(() => {});
						}
					}
				} else i && this.doSendOpen(e, [t]).catch(() => {});
			}
			didChangeNotebookCellTextDocument(e, t) {
				Tt.languages.match(this.selector, t.document) !== 0 &&
					this.doSendChange({ notebook: e, cells: { textContent: [t] } }, void 0).catch(() => {});
			}
			didCloseNotebookCellTextDocument(e, t) {
				let r = this.notebookSyncInfo.get(e.uri.toString());
				if (r === void 0) return;
				let i = t.document.uri,
					s = r.cells.findIndex((o) => o.document.uri.toString() === i.toString());
				if (s !== -1)
					if (s === 0 && r.cells.length === 1) this.doSendClose(e, r.cells).catch(() => {});
					else {
						let o = r.cells.slice(),
							a = o.splice(s, 1);
						this.doSendChange(
							{
								notebook: e,
								cells: { structure: { array: { start: s, deleteCount: 1 }, didClose: a } },
							},
							o,
						).catch(() => {});
					}
			}
			dispose() {
				for (let e of this.disposables) e.dispose();
			}
			didOpen(e, t = this.getMatchingCells(e), r = this.notebookSyncInfo.get(e.uri.toString())) {
				if (r !== void 0)
					if (t !== void 0) {
						let i = this.asNotebookDocumentChangeEvent(e, void 0, r, t);
						i !== void 0 && this.doSendChange(i, t).catch(() => {});
					} else this.doSendClose(e, []).catch(() => {});
				else {
					if (t === void 0) return;
					this.doSendOpen(e, t).catch(() => {});
				}
			}
			didChangeNotebookDocument(e) {
				let t = e.notebook,
					r = this.notebookSyncInfo.get(t.uri.toString());
				if (r === void 0) {
					if (e.contentChanges.length === 0) return;
					let i = this.getMatchingCells(t);
					if (i === void 0) return;
					this.didOpen(t, i, r);
				} else {
					let i = this.getMatchingCells(t);
					if (i === void 0) {
						this.didClose(t, r);
						return;
					}
					let s = this.asNotebookDocumentChangeEvent(e.notebook, e, r, i);
					s !== void 0 && this.doSendChange(s, i).catch(() => {});
				}
			}
			didSave(e) {
				this.notebookSyncInfo.get(e.uri.toString()) !== void 0 &&
					this.doSendSave(e).catch(() => {});
			}
			didClose(e, t = this.notebookSyncInfo.get(e.uri.toString())) {
				if (t === void 0) return;
				let r = e.getCells().filter((i) => t.uris.has(i.document.uri.toString()));
				this.doSendClose(e, r).catch(() => {});
			}
			async sendDidOpenNotebookDocument(e) {
				let t = this.getMatchingCells(e);
				if (t !== void 0) return this.doSendOpen(e, t);
			}
			async doSendOpen(e, t) {
				let r = async (s, o) => {
						let a = yi.c2p.asNotebookDocument(s, o, this.client.code2ProtocolConverter),
							u = o.map((l) => this.client.code2ProtocolConverter.asTextDocumentItem(l.document));
						try {
							await this.client.sendNotification(Zn.DidOpenNotebookDocumentNotification.type, {
								notebookDocument: a,
								cellTextDocuments: u,
							});
						} catch (l) {
							throw (this.client.error('Sending DidOpenNotebookDocumentNotification failed', l), l);
						}
					},
					i = this.client.middleware?.notebooks;
				return (
					this.notebookSyncInfo.set(e.uri.toString(), vo.create(t)),
					i?.didOpen !== void 0 ? i.didOpen(e, t, r) : r(e, t)
				);
			}
			async sendDidChangeNotebookDocument(e) {
				return this.doSendChange(e, void 0);
			}
			async doSendChange(e, t = this.getMatchingCells(e.notebook)) {
				let r = async (s) => {
						try {
							await this.client.sendNotification(Zn.DidChangeNotebookDocumentNotification.type, {
								notebookDocument: yi.c2p.asVersionedNotebookDocumentIdentifier(
									s.notebook,
									this.client.code2ProtocolConverter,
								),
								change: yi.c2p.asNotebookDocumentChangeEvent(s, this.client.code2ProtocolConverter),
							});
						} catch (o) {
							throw (
								this.client.error('Sending DidChangeNotebookDocumentNotification failed', o),
								o
							);
						}
					},
					i = this.client.middleware?.notebooks;
				return (
					e.cells?.structure !== void 0 &&
						this.notebookSyncInfo.set(e.notebook.uri.toString(), vo.create(t ?? [])),
					i?.didChange !== void 0 ? i?.didChange(e, r) : r(e)
				);
			}
			async sendDidSaveNotebookDocument(e) {
				return this.doSendSave(e);
			}
			async doSendSave(e) {
				let t = async (i) => {
						try {
							await this.client.sendNotification(Zn.DidSaveNotebookDocumentNotification.type, {
								notebookDocument: { uri: this.client.code2ProtocolConverter.asUri(i.uri) },
							});
						} catch (s) {
							throw (this.client.error('Sending DidSaveNotebookDocumentNotification failed', s), s);
						}
					},
					r = this.client.middleware?.notebooks;
				return r?.didSave !== void 0 ? r.didSave(e, t) : t(e);
			}
			async sendDidCloseNotebookDocument(e) {
				return this.doSendClose(e, this.getMatchingCells(e) ?? []);
			}
			async doSendClose(e, t) {
				let r = async (s, o) => {
						try {
							await this.client.sendNotification(Zn.DidCloseNotebookDocumentNotification.type, {
								notebookDocument: { uri: this.client.code2ProtocolConverter.asUri(s.uri) },
								cellTextDocuments: o.map((a) =>
									this.client.code2ProtocolConverter.asTextDocumentIdentifier(a.document),
								),
							});
						} catch (a) {
							throw (
								this.client.error('Sending DidCloseNotebookDocumentNotification failed', a),
								a
							);
						}
					},
					i = this.client.middleware?.notebooks;
				return (
					this.notebookSyncInfo.delete(e.uri.toString()),
					i?.didClose !== void 0 ? i.didClose(e, t, r) : r(e, t)
				);
			}
			asNotebookDocumentChangeEvent(e, t, r, i) {
				if (t !== void 0 && t.notebook !== e) throw new Error('Notebook must be identical');
				let s = { notebook: e };
				t?.metadata !== void 0 && (s.metadata = yi.c2p.asMetadata(t.metadata));
				let o;
				if (t?.cellChanges !== void 0 && t.cellChanges.length > 0) {
					let a = [];
					o = new Set(i.map((u) => u.document.uri.toString()));
					for (let u of t.cellChanges)
						o.has(u.cell.document.uri.toString()) &&
							(u.executionSummary !== void 0 || u.metadata !== void 0) &&
							a.push(u.cell);
					a.length > 0 && ((s.cells = s.cells ?? {}), (s.cells.data = a));
				}
				if (
					((t?.contentChanges !== void 0 && t.contentChanges.length > 0) || t === void 0) &&
					r !== void 0 &&
					i !== void 0
				) {
					let a = r.cells,
						u = i,
						l = Au.computeDiff(a, u, !1),
						p,
						m;
					if (l !== void 0) {
						((p =
							l.cells === void 0
								? new Map()
								: new Map(l.cells.map((y) => [y.document.uri.toString(), y]))),
							(m =
								l.deleteCount === 0
									? new Map()
									: new Map(
											a
												.slice(l.start, l.start + l.deleteCount)
												.map((y) => [y.document.uri.toString(), y]),
										)));
						for (let y of Array.from(m.keys())) p.has(y) && (m.delete(y), p.delete(y));
						s.cells = s.cells ?? {};
						let g = [],
							D = [];
						if (p.size > 0 || m.size > 0) {
							for (let y of p.values()) g.push(y);
							for (let y of m.values()) D.push(y);
						}
						s.cells.structure = { array: l, didOpen: g, didClose: D };
					}
				}
				return Object.keys(s).length > 1 ? s : void 0;
			}
			getMatchingCells(e, t = e.getCells()) {
				if (this.options.notebookSelector !== void 0) {
					for (let r of this.options.notebookSelector)
						if (r.notebook === void 0 || ju.matchNotebook(r.notebook, e)) {
							let i = this.filterCells(e, t, r.cells);
							return i.length === 0 ? void 0 : i;
						}
				}
			}
			cellMatches(e, t) {
				let r = this.getMatchingCells(e, [t]);
				return r !== void 0 && r[0] === t;
			}
			filterCells(e, t, r) {
				let i =
					r !== void 0
						? t.filter((s) => {
								let o = s.document.languageId;
								return r.some((a) => a.language === '*' || o === a.language);
							})
						: t;
				return typeof this.client.clientOptions.notebookDocumentOptions?.filterCells == 'function'
					? this.client.clientOptions.notebookDocumentOptions.filterCells(e, i)
					: i;
			}
		},
		er = class {
			constructor(e) {
				((this.client = e),
					(this.registrations = new Map()),
					(this.registrationType = Zn.NotebookDocumentSyncRegistrationType.type),
					Tt.workspace.onDidOpenTextDocument((t) => {
						if (t.uri.scheme !== er.CellScheme) return;
						let [r, i] = this.findNotebookDocumentAndCell(t);
						if (!(r === void 0 || i === void 0))
							for (let s of this.registrations.values())
								s instanceof Ci && s.didOpenNotebookCellTextDocument(r, i);
					}),
					Tt.workspace.onDidChangeTextDocument((t) => {
						if (t.contentChanges.length === 0) return;
						let r = t.document;
						if (r.uri.scheme !== er.CellScheme) return;
						let [i] = this.findNotebookDocumentAndCell(r);
						if (i !== void 0)
							for (let s of this.registrations.values())
								s instanceof Ci && s.didChangeNotebookCellTextDocument(i, t);
					}),
					Tt.workspace.onDidCloseTextDocument((t) => {
						if (t.uri.scheme !== er.CellScheme) return;
						let [r, i] = this.findNotebookDocumentAndCell(t);
						if (!(r === void 0 || i === void 0))
							for (let s of this.registrations.values())
								s instanceof Ci && s.didCloseNotebookCellTextDocument(r, i);
					}));
			}
			getState() {
				if (this.registrations.size === 0)
					return {
						kind: 'document',
						id: this.registrationType.method,
						registrations: !1,
						matches: !1,
					};
				for (let e of this.registrations.values()) {
					let t = e.getState();
					if (t.kind === 'document' && t.registrations === !0 && t.matches === !0)
						return {
							kind: 'document',
							id: this.registrationType.method,
							registrations: !0,
							matches: !0,
						};
				}
				return {
					kind: 'document',
					id: this.registrationType.method,
					registrations: !0,
					matches: !1,
				};
			}
			fillClientCapabilities(e) {
				let t = Wm(Wm(e, 'notebookDocument'), 'synchronization');
				((t.dynamicRegistration = !0), (t.executionSummarySupport = !0));
			}
			preInitialize(e) {
				let t = e.notebookDocumentSync;
				t !== void 0 &&
					(this.dedicatedChannel = this.client.protocol2CodeConverter.asDocumentSelector(
						mo.asDocumentSelector(t),
					));
			}
			initialize(e) {
				let t = e.notebookDocumentSync;
				if (t === void 0) return;
				let r = t.id ?? $_.generateUuid();
				this.register({ id: r, registerOptions: t });
			}
			register(e) {
				let t = new Ci(this.client, e.registerOptions);
				this.registrations.set(e.id, t);
			}
			unregister(e) {
				let t = this.registrations.get(e);
				t && t.dispose();
			}
			clear() {
				for (let e of this.registrations.values()) e.dispose();
				this.registrations.clear();
			}
			handles(e) {
				if (e.uri.scheme !== er.CellScheme) return !1;
				if (this.dedicatedChannel !== void 0 && Tt.languages.match(this.dedicatedChannel, e) > 0)
					return !0;
				for (let t of this.registrations.values()) if (t.handles(e)) return !0;
				return !1;
			}
			getProvider(e) {
				for (let t of this.registrations.values()) if (t.handles(e.document)) return t;
			}
			findNotebookDocumentAndCell(e) {
				let t = e.uri.toString();
				for (let r of Tt.workspace.notebookDocuments)
					for (let i of r.getCells()) if (i.document.uri.toString() === t) return [r, i];
				return [void 0, void 0];
			}
		};
	yo.NotebookDocumentSyncFeature = er;
	er.CellScheme = 'vscode-notebook-cell';
});
var zm = E((Sr) => {
	'use strict';
	Object.defineProperty(Sr, '__esModule', { value: !0 });
	Sr.SyncConfigurationFeature = Sr.toJSONObject = Sr.ConfigurationFeature = void 0;
	var bi = require('vscode'),
		Xi = ee(),
		H_ = cn(),
		W_ = We(),
		Km = ye(),
		$u = class {
			constructor(e) {
				this._client = e;
			}
			getState() {
				return { kind: 'static' };
			}
			fillClientCapabilities(e) {
				((e.workspace = e.workspace || {}), (e.workspace.configuration = !0));
			}
			initialize() {
				let e = this._client;
				e.onRequest(Xi.ConfigurationRequest.type, (t, r) => {
					let i = (o) => {
							let a = [];
							for (let u of o.items) {
								let l =
									u.scopeUri !== void 0 && u.scopeUri !== null
										? this._client.protocol2CodeConverter.asUri(u.scopeUri)
										: void 0;
								a.push(this.getConfiguration(l, u.section !== null ? u.section : void 0));
							}
							return a;
						},
						s = e.middleware.workspace;
					return s && s.configuration ? s.configuration(t, r, i) : i(t, r);
				});
			}
			getConfiguration(e, t) {
				let r = null;
				if (t) {
					let i = t.lastIndexOf('.');
					if (i === -1) r = jr(bi.workspace.getConfiguration(void 0, e).get(t));
					else {
						let s = bi.workspace.getConfiguration(t.substr(0, i), e);
						s && (r = jr(s.get(t.substr(i + 1))));
					}
				} else {
					let i = bi.workspace.getConfiguration(void 0, e);
					r = {};
					for (let s of Object.keys(i)) i.has(s) && (r[s] = jr(i.get(s)));
				}
				return (r === void 0 && (r = null), r);
			}
			clear() {}
		};
	Sr.ConfigurationFeature = $u;
	function jr(n) {
		if (n) {
			if (Array.isArray(n)) return n.map(jr);
			if (typeof n == 'object') {
				let e = Object.create(null);
				for (let t in n) Object.prototype.hasOwnProperty.call(n, t) && (e[t] = jr(n[t]));
				return e;
			}
		}
		return n;
	}
	Sr.toJSONObject = jr;
	var Hu = class {
		constructor(e) {
			((this._client = e), (this.isCleared = !1), (this._listeners = new Map()));
		}
		getState() {
			return {
				kind: 'workspace',
				id: this.registrationType.method,
				registrations: this._listeners.size > 0,
			};
		}
		get registrationType() {
			return Xi.DidChangeConfigurationNotification.type;
		}
		fillClientCapabilities(e) {
			(0, Km.ensure)((0, Km.ensure)(e, 'workspace'), 'didChangeConfiguration').dynamicRegistration =
				!0;
		}
		initialize() {
			this.isCleared = !1;
			let e = this._client.clientOptions.synchronize?.configurationSection;
			e !== void 0 && this.register({ id: W_.generateUuid(), registerOptions: { section: e } });
		}
		register(e) {
			let t = bi.workspace.onDidChangeConfiguration((r) => {
				this.onDidChangeConfiguration(e.registerOptions.section, r);
			});
			(this._listeners.set(e.id, t),
				e.registerOptions.section !== void 0 &&
					this.onDidChangeConfiguration(e.registerOptions.section, void 0));
		}
		unregister(e) {
			let t = this._listeners.get(e);
			t && (this._listeners.delete(e), t.dispose());
		}
		clear() {
			for (let e of this._listeners.values()) e.dispose();
			(this._listeners.clear(), (this.isCleared = !0));
		}
		onDidChangeConfiguration(e, t) {
			if (this.isCleared) return;
			let r;
			if (
				(H_.string(e) ? (r = [e]) : (r = e),
				r !== void 0 && t !== void 0 && !r.some((a) => t.affectsConfiguration(a)))
			)
				return;
			let i = async (o) =>
					o === void 0
						? this._client.sendNotification(Xi.DidChangeConfigurationNotification.type, {
								settings: null,
							})
						: this._client.sendNotification(Xi.DidChangeConfigurationNotification.type, {
								settings: this.extractSettingsInformation(o),
							}),
				s = this._client.middleware.workspace?.didChangeConfiguration;
			(s ? s(r, i) : i(r)).catch((o) => {
				this._client.error(
					`Sending notification ${Xi.DidChangeConfigurationNotification.type.method} failed`,
					o,
				);
			});
		}
		extractSettingsInformation(e) {
			function t(s, o) {
				let a = s;
				for (let u = 0; u < o.length - 1; u++) {
					let l = a[o[u]];
					(l || ((l = Object.create(null)), (a[o[u]] = l)), (a = l));
				}
				return a;
			}
			let r = this._client.clientOptions.workspaceFolder
					? this._client.clientOptions.workspaceFolder.uri
					: void 0,
				i = Object.create(null);
			for (let s = 0; s < e.length; s++) {
				let o = e[s],
					a = o.indexOf('.'),
					u = null;
				if (
					(a >= 0
						? (u = bi.workspace.getConfiguration(o.substr(0, a), r).get(o.substr(a + 1)))
						: (u = bi.workspace.getConfiguration(void 0, r).get(o)),
					u)
				) {
					let l = e[s].split('.');
					t(i, l)[l[l.length - 1]] = jr(u);
				}
			}
			return i;
		}
	};
	Sr.SyncConfigurationFeature = Hu;
});
var Vm = E(($t) => {
	'use strict';
	Object.defineProperty($t, '__esModule', { value: !0 });
	$t.DidSaveTextDocumentFeature =
		$t.WillSaveWaitUntilFeature =
		$t.WillSaveFeature =
		$t.DidChangeTextDocumentFeature =
		$t.DidCloseTextDocumentFeature =
		$t.DidOpenTextDocumentFeature =
			void 0;
	var Qt = require('vscode'),
		Ne = ee(),
		Ve = ye(),
		_i = We(),
		Wu = class extends Ve.TextDocumentEventFeature {
			constructor(e, t) {
				(super(
					e,
					Qt.workspace.onDidOpenTextDocument,
					Ne.DidOpenTextDocumentNotification.type,
					() => e.middleware.didOpen,
					(r) => e.code2ProtocolConverter.asOpenTextDocumentParams(r),
					(r) => r,
					Ve.TextDocumentEventFeature.textDocumentFilter,
				),
					(this._syncedDocuments = t));
			}
			get openDocuments() {
				return this._syncedDocuments.values();
			}
			fillClientCapabilities(e) {
				(0, Ve.ensure)((0, Ve.ensure)(e, 'textDocument'), 'synchronization').dynamicRegistration =
					!0;
			}
			initialize(e, t) {
				let r = e.resolvedTextDocumentSync;
				t &&
					r &&
					r.openClose &&
					this.register({ id: _i.generateUuid(), registerOptions: { documentSelector: t } });
			}
			get registrationType() {
				return Ne.DidOpenTextDocumentNotification.type;
			}
			register(e) {
				if ((super.register(e), !e.registerOptions.documentSelector)) return;
				let t = this._client.protocol2CodeConverter.asDocumentSelector(
					e.registerOptions.documentSelector,
				);
				Qt.workspace.textDocuments.forEach((r) => {
					let i = r.uri.toString();
					if (
						!this._syncedDocuments.has(i) &&
						Qt.languages.match(t, r) > 0 &&
						!this._client.hasDedicatedTextSynchronizationFeature(r)
					) {
						let s = this._client.middleware,
							o = (a) => this._client.sendNotification(this._type, this._createParams(a));
						((s.didOpen ? s.didOpen(r, o) : o(r)).catch((a) => {
							this._client.error(`Sending document notification ${this._type.method} failed`, a);
						}),
							this._syncedDocuments.set(i, r));
					}
				});
			}
			getTextDocument(e) {
				return e;
			}
			notificationSent(e, t, r) {
				(this._syncedDocuments.set(e.uri.toString(), e), super.notificationSent(e, t, r));
			}
		};
	$t.DidOpenTextDocumentFeature = Wu;
	var Uu = class extends Ve.TextDocumentEventFeature {
		constructor(e, t, r) {
			(super(
				e,
				Qt.workspace.onDidCloseTextDocument,
				Ne.DidCloseTextDocumentNotification.type,
				() => e.middleware.didClose,
				(i) => e.code2ProtocolConverter.asCloseTextDocumentParams(i),
				(i) => i,
				Ve.TextDocumentEventFeature.textDocumentFilter,
			),
				(this._syncedDocuments = t),
				(this._pendingTextDocumentChanges = r));
		}
		get registrationType() {
			return Ne.DidCloseTextDocumentNotification.type;
		}
		fillClientCapabilities(e) {
			(0, Ve.ensure)((0, Ve.ensure)(e, 'textDocument'), 'synchronization').dynamicRegistration = !0;
		}
		initialize(e, t) {
			let r = e.resolvedTextDocumentSync;
			t &&
				r &&
				r.openClose &&
				this.register({ id: _i.generateUuid(), registerOptions: { documentSelector: t } });
		}
		async callback(e) {
			(await super.callback(e), this._pendingTextDocumentChanges.delete(e.uri.toString()));
		}
		getTextDocument(e) {
			return e;
		}
		notificationSent(e, t, r) {
			(this._syncedDocuments.delete(e.uri.toString()), super.notificationSent(e, t, r));
		}
		unregister(e) {
			let t = this._selectors.get(e);
			super.unregister(e);
			let r = this._selectors.values();
			this._syncedDocuments.forEach((i) => {
				if (
					Qt.languages.match(t, i) > 0 &&
					!this._selectorFilter(r, i) &&
					!this._client.hasDedicatedTextSynchronizationFeature(i)
				) {
					let s = this._client.middleware,
						o = (a) => this._client.sendNotification(this._type, this._createParams(a));
					(this._syncedDocuments.delete(i.uri.toString()),
						(s.didClose ? s.didClose(i, o) : o(i)).catch((a) => {
							this._client.error(`Sending document notification ${this._type.method} failed`, a);
						}));
				}
			});
		}
	};
	$t.DidCloseTextDocumentFeature = Uu;
	var Ku = class extends Ve.DynamicDocumentFeature {
		constructor(e, t) {
			(super(e),
				(this._changeData = new Map()),
				(this._onNotificationSent = new Qt.EventEmitter()),
				(this._onPendingChangeAdded = new Qt.EventEmitter()),
				(this._pendingTextDocumentChanges = t),
				(this._syncKind = Ne.TextDocumentSyncKind.None));
		}
		get onNotificationSent() {
			return this._onNotificationSent.event;
		}
		get onPendingChangeAdded() {
			return this._onPendingChangeAdded.event;
		}
		get syncKind() {
			return this._syncKind;
		}
		get registrationType() {
			return Ne.DidChangeTextDocumentNotification.type;
		}
		fillClientCapabilities(e) {
			(0, Ve.ensure)((0, Ve.ensure)(e, 'textDocument'), 'synchronization').dynamicRegistration = !0;
		}
		initialize(e, t) {
			let r = e.resolvedTextDocumentSync;
			t &&
				r &&
				r.change !== void 0 &&
				r.change !== Ne.TextDocumentSyncKind.None &&
				this.register({
					id: _i.generateUuid(),
					registerOptions: Object.assign({}, { documentSelector: t }, { syncKind: r.change }),
				});
		}
		register(e) {
			e.registerOptions.documentSelector &&
				(this._listener ||
					(this._listener = Qt.workspace.onDidChangeTextDocument(this.callback, this)),
				this._changeData.set(e.id, {
					syncKind: e.registerOptions.syncKind,
					documentSelector: this._client.protocol2CodeConverter.asDocumentSelector(
						e.registerOptions.documentSelector,
					),
				}),
				this.updateSyncKind(e.registerOptions.syncKind));
		}
		*getDocumentSelectors() {
			for (let e of this._changeData.values()) yield e.documentSelector;
		}
		async callback(e) {
			if (e.contentChanges.length === 0) return;
			let t = e.document.uri,
				r = e.document.version,
				i = [];
			for (let s of this._changeData.values())
				if (
					Qt.languages.match(s.documentSelector, e.document) > 0 &&
					!this._client.hasDedicatedTextSynchronizationFeature(e.document)
				) {
					let o = this._client.middleware;
					if (s.syncKind === Ne.TextDocumentSyncKind.Incremental) {
						let a = async (u) => {
							let l = this._client.code2ProtocolConverter.asChangeTextDocumentParams(u, t, r);
							(await this._client.sendNotification(Ne.DidChangeTextDocumentNotification.type, l),
								this.notificationSent(u.document, Ne.DidChangeTextDocumentNotification.type, l));
						};
						i.push(o.didChange ? o.didChange(e, (u) => a(u)) : a(e));
					} else if (s.syncKind === Ne.TextDocumentSyncKind.Full) {
						let a = async (u) => {
							let l = u.document.uri.toString();
							(this._pendingTextDocumentChanges.set(l, u.document),
								this._onPendingChangeAdded.fire());
						};
						i.push(o.didChange ? o.didChange(e, (u) => a(u)) : a(e));
					}
				}
			return Promise.all(i).then(void 0, (s) => {
				throw (
					this._client.error(
						`Sending document notification ${Ne.DidChangeTextDocumentNotification.type.method} failed`,
						s,
					),
					s
				);
			});
		}
		notificationSent(e, t, r) {
			this._onNotificationSent.fire({ textDocument: e, type: t, params: r });
		}
		unregister(e) {
			if ((this._changeData.delete(e), this._changeData.size === 0))
				(this._listener && (this._listener.dispose(), (this._listener = void 0)),
					(this._syncKind = Ne.TextDocumentSyncKind.None));
			else {
				this._syncKind = Ne.TextDocumentSyncKind.None;
				for (let t of this._changeData.values())
					if ((this.updateSyncKind(t.syncKind), this._syncKind === Ne.TextDocumentSyncKind.Full))
						break;
			}
		}
		clear() {
			(this._pendingTextDocumentChanges.clear(),
				this._changeData.clear(),
				(this._syncKind = Ne.TextDocumentSyncKind.None),
				this._listener && (this._listener.dispose(), (this._listener = void 0)));
		}
		getPendingDocumentChanges(e) {
			if (this._pendingTextDocumentChanges.size === 0) return [];
			let t;
			if (e.size === 0)
				((t = Array.from(this._pendingTextDocumentChanges.values())),
					this._pendingTextDocumentChanges.clear());
			else {
				t = [];
				for (let r of this._pendingTextDocumentChanges)
					e.has(r[0]) || (t.push(r[1]), this._pendingTextDocumentChanges.delete(r[0]));
			}
			return t;
		}
		getProvider(e) {
			for (let t of this._changeData.values())
				if (Qt.languages.match(t.documentSelector, e) > 0) return { send: (r) => this.callback(r) };
		}
		updateSyncKind(e) {
			if (this._syncKind !== Ne.TextDocumentSyncKind.Full)
				switch (e) {
					case Ne.TextDocumentSyncKind.Full:
						this._syncKind = e;
						break;
					case Ne.TextDocumentSyncKind.Incremental:
						this._syncKind === Ne.TextDocumentSyncKind.None &&
							(this._syncKind = Ne.TextDocumentSyncKind.Incremental);
						break;
				}
		}
	};
	$t.DidChangeTextDocumentFeature = Ku;
	var zu = class extends Ve.TextDocumentEventFeature {
		constructor(e) {
			super(
				e,
				Qt.workspace.onWillSaveTextDocument,
				Ne.WillSaveTextDocumentNotification.type,
				() => e.middleware.willSave,
				(t) => e.code2ProtocolConverter.asWillSaveTextDocumentParams(t),
				(t) => t.document,
				(t, r) => Ve.TextDocumentEventFeature.textDocumentFilter(t, r.document),
			);
		}
		get registrationType() {
			return Ne.WillSaveTextDocumentNotification.type;
		}
		fillClientCapabilities(e) {
			let t = (0, Ve.ensure)((0, Ve.ensure)(e, 'textDocument'), 'synchronization');
			t.willSave = !0;
		}
		initialize(e, t) {
			let r = e.resolvedTextDocumentSync;
			t &&
				r &&
				r.willSave &&
				this.register({ id: _i.generateUuid(), registerOptions: { documentSelector: t } });
		}
		getTextDocument(e) {
			return e.document;
		}
	};
	$t.WillSaveFeature = zu;
	var Vu = class extends Ve.DynamicDocumentFeature {
		constructor(e) {
			(super(e), (this._selectors = new Map()));
		}
		getDocumentSelectors() {
			return this._selectors.values();
		}
		get registrationType() {
			return Ne.WillSaveTextDocumentWaitUntilRequest.type;
		}
		fillClientCapabilities(e) {
			let t = (0, Ve.ensure)((0, Ve.ensure)(e, 'textDocument'), 'synchronization');
			t.willSaveWaitUntil = !0;
		}
		initialize(e, t) {
			let r = e.resolvedTextDocumentSync;
			t &&
				r &&
				r.willSaveWaitUntil &&
				this.register({ id: _i.generateUuid(), registerOptions: { documentSelector: t } });
		}
		register(e) {
			e.registerOptions.documentSelector &&
				(this._listener ||
					(this._listener = Qt.workspace.onWillSaveTextDocument(this.callback, this)),
				this._selectors.set(
					e.id,
					this._client.protocol2CodeConverter.asDocumentSelector(
						e.registerOptions.documentSelector,
					),
				));
		}
		callback(e) {
			if (
				Ve.TextDocumentEventFeature.textDocumentFilter(this._selectors.values(), e.document) &&
				!this._client.hasDedicatedTextSynchronizationFeature(e.document)
			) {
				let t = this._client.middleware,
					r = (i) =>
						this._client
							.sendRequest(
								Ne.WillSaveTextDocumentWaitUntilRequest.type,
								this._client.code2ProtocolConverter.asWillSaveTextDocumentParams(i),
							)
							.then(async (s) => {
								let o = await this._client.protocol2CodeConverter.asTextEdits(s);
								return o === void 0 ? [] : o;
							});
				e.waitUntil(t.willSaveWaitUntil ? t.willSaveWaitUntil(e, r) : r(e));
			}
		}
		unregister(e) {
			(this._selectors.delete(e),
				this._selectors.size === 0 &&
					this._listener &&
					(this._listener.dispose(), (this._listener = void 0)));
		}
		clear() {
			(this._selectors.clear(),
				this._listener && (this._listener.dispose(), (this._listener = void 0)));
		}
	};
	$t.WillSaveWaitUntilFeature = Vu;
	var Bu = class extends Ve.TextDocumentEventFeature {
		constructor(e) {
			(super(
				e,
				Qt.workspace.onDidSaveTextDocument,
				Ne.DidSaveTextDocumentNotification.type,
				() => e.middleware.didSave,
				(t) => e.code2ProtocolConverter.asSaveTextDocumentParams(t, this._includeText),
				(t) => t,
				Ve.TextDocumentEventFeature.textDocumentFilter,
			),
				(this._includeText = !1));
		}
		get registrationType() {
			return Ne.DidSaveTextDocumentNotification.type;
		}
		fillClientCapabilities(e) {
			(0, Ve.ensure)((0, Ve.ensure)(e, 'textDocument'), 'synchronization').didSave = !0;
		}
		initialize(e, t) {
			let r = e.resolvedTextDocumentSync;
			if (t && r && r.save) {
				let i =
					typeof r.save == 'boolean' ? { includeText: !1 } : { includeText: !!r.save.includeText };
				this.register({
					id: _i.generateUuid(),
					registerOptions: Object.assign({}, { documentSelector: t }, i),
				});
			}
		}
		register(e) {
			((this._includeText = !!e.registerOptions.includeText), super.register(e));
		}
		getTextDocument(e) {
			return e;
		}
	};
	$t.DidSaveTextDocumentFeature = Bu;
});
var Bm = E((Co) => {
	'use strict';
	Object.defineProperty(Co, '__esModule', { value: !0 });
	Co.CompletionItemFeature = void 0;
	var U_ = require('vscode'),
		pe = ee(),
		Gu = ye(),
		K_ = We(),
		z_ = [
			pe.CompletionItemKind.Text,
			pe.CompletionItemKind.Method,
			pe.CompletionItemKind.Function,
			pe.CompletionItemKind.Constructor,
			pe.CompletionItemKind.Field,
			pe.CompletionItemKind.Variable,
			pe.CompletionItemKind.Class,
			pe.CompletionItemKind.Interface,
			pe.CompletionItemKind.Module,
			pe.CompletionItemKind.Property,
			pe.CompletionItemKind.Unit,
			pe.CompletionItemKind.Value,
			pe.CompletionItemKind.Enum,
			pe.CompletionItemKind.Keyword,
			pe.CompletionItemKind.Snippet,
			pe.CompletionItemKind.Color,
			pe.CompletionItemKind.File,
			pe.CompletionItemKind.Reference,
			pe.CompletionItemKind.Folder,
			pe.CompletionItemKind.EnumMember,
			pe.CompletionItemKind.Constant,
			pe.CompletionItemKind.Struct,
			pe.CompletionItemKind.Event,
			pe.CompletionItemKind.Operator,
			pe.CompletionItemKind.TypeParameter,
		],
		Xu = class extends Gu.TextDocumentLanguageFeature {
			constructor(e) {
				(super(e, pe.CompletionRequest.type), (this.labelDetailsSupport = new Map()));
			}
			fillClientCapabilities(e) {
				let t = (0, Gu.ensure)((0, Gu.ensure)(e, 'textDocument'), 'completion');
				((t.dynamicRegistration = !0),
					(t.contextSupport = !0),
					(t.completionItem = {
						snippetSupport: !0,
						commitCharactersSupport: !0,
						documentationFormat: [pe.MarkupKind.Markdown, pe.MarkupKind.PlainText],
						deprecatedSupport: !0,
						preselectSupport: !0,
						tagSupport: { valueSet: [pe.CompletionItemTag.Deprecated] },
						insertReplaceSupport: !0,
						resolveSupport: { properties: ['documentation', 'detail', 'additionalTextEdits'] },
						insertTextModeSupport: {
							valueSet: [pe.InsertTextMode.asIs, pe.InsertTextMode.adjustIndentation],
						},
						labelDetailsSupport: !0,
					}),
					(t.insertTextMode = pe.InsertTextMode.adjustIndentation),
					(t.completionItemKind = { valueSet: z_ }),
					(t.completionList = {
						itemDefaults: [
							'commitCharacters',
							'editRange',
							'insertTextFormat',
							'insertTextMode',
							'data',
						],
					}));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.completionProvider);
				r && this.register({ id: K_.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e, t) {
				this.labelDetailsSupport.set(t, !!e.completionItem?.labelDetailsSupport);
				let r = e.triggerCharacters ?? [],
					i = e.allCommitCharacters,
					s = e.documentSelector,
					o = {
						provideCompletionItems: (a, u, l, p) => {
							let m = this._client,
								g = this._client.middleware,
								D = (y, P, q, N) =>
									m
										.sendRequest(
											pe.CompletionRequest.type,
											m.code2ProtocolConverter.asCompletionParams(y, P, q),
											N,
										)
										.then(
											(L) =>
												N.isCancellationRequested
													? null
													: m.protocol2CodeConverter.asCompletionResult(L, i, N),
											(L) => m.handleFailedRequest(pe.CompletionRequest.type, N, L, null),
										);
							return g.provideCompletionItem
								? g.provideCompletionItem(a, u, p, l, D)
								: D(a, u, p, l);
						},
						resolveCompletionItem: e.resolveProvider
							? (a, u) => {
									let l = this._client,
										p = this._client.middleware,
										m = (g, D) =>
											l
												.sendRequest(
													pe.CompletionResolveRequest.type,
													l.code2ProtocolConverter.asCompletionItem(
														g,
														!!this.labelDetailsSupport.get(t),
													),
													D,
												)
												.then(
													(y) =>
														D.isCancellationRequested
															? null
															: l.protocol2CodeConverter.asCompletionItem(y),
													(y) => l.handleFailedRequest(pe.CompletionResolveRequest.type, D, y, g),
												);
									return p.resolveCompletionItem ? p.resolveCompletionItem(a, u, m) : m(a, u);
								}
							: void 0,
					};
				return [
					U_.languages.registerCompletionItemProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(s),
						o,
						...r,
					),
					o,
				];
			}
		};
	Co.CompletionItemFeature = Xu;
});
var Gm = E((bo) => {
	'use strict';
	Object.defineProperty(bo, '__esModule', { value: !0 });
	bo.HoverFeature = void 0;
	var V_ = require('vscode'),
		Ji = ee(),
		Ju = ye(),
		B_ = We(),
		Qu = class extends Ju.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Ji.HoverRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, Ju.ensure)((0, Ju.ensure)(e, 'textDocument'), 'hover');
				((t.dynamicRegistration = !0),
					(t.contentFormat = [Ji.MarkupKind.Markdown, Ji.MarkupKind.PlainText]));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.hoverProvider);
				r && this.register({ id: B_.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideHover: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											Ji.HoverRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested ? null : a.protocol2CodeConverter.asHover(D),
											(D) => a.handleFailedRequest(Ji.HoverRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideHover ? l.provideHover(i, s, o, u) : u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return V_.languages.registerHoverProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	bo.HoverFeature = Qu;
});
var Xm = E((_o) => {
	'use strict';
	Object.defineProperty(_o, '__esModule', { value: !0 });
	_o.DefinitionFeature = void 0;
	var G_ = require('vscode'),
		Yu = ee(),
		Zu = ye(),
		X_ = We(),
		el = class extends Zu.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Yu.DefinitionRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, Zu.ensure)((0, Zu.ensure)(e, 'textDocument'), 'definition');
				((t.dynamicRegistration = !0), (t.linkSupport = !0));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.definitionProvider);
				r && this.register({ id: X_.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideDefinition: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											Yu.DefinitionRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asDefinitionResult(D, g),
											(D) => a.handleFailedRequest(Yu.DefinitionRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideDefinition ? l.provideDefinition(i, s, o, u) : u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return G_.languages.registerDefinitionProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	_o.DefinitionFeature = el;
});
var Qm = E((wo) => {
	'use strict';
	Object.defineProperty(wo, '__esModule', { value: !0 });
	wo.SignatureHelpFeature = void 0;
	var Jm = require('vscode'),
		Qi = ee(),
		tl = ye(),
		J_ = We(),
		nl = class extends tl.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Qi.SignatureHelpRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, tl.ensure)((0, tl.ensure)(e, 'textDocument'), 'signatureHelp');
				((t.dynamicRegistration = !0),
					(t.signatureInformation = {
						documentationFormat: [Qi.MarkupKind.Markdown, Qi.MarkupKind.PlainText],
					}),
					(t.signatureInformation.parameterInformation = { labelOffsetSupport: !0 }),
					(t.signatureInformation.activeParameterSupport = !0),
					(t.contextSupport = !0));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.signatureHelpProvider);
				r && this.register({ id: J_.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = {
					provideSignatureHelp: (r, i, s, o) => {
						let a = this._client,
							u = (p, m, g, D) =>
								a
									.sendRequest(
										Qi.SignatureHelpRequest.type,
										a.code2ProtocolConverter.asSignatureHelpParams(p, m, g),
										D,
									)
									.then(
										(y) =>
											D.isCancellationRequested
												? null
												: a.protocol2CodeConverter.asSignatureHelp(y, D),
										(y) => a.handleFailedRequest(Qi.SignatureHelpRequest.type, D, y, null),
									),
							l = a.middleware;
						return l.provideSignatureHelp ? l.provideSignatureHelp(r, i, o, s, u) : u(r, i, o, s);
					},
				};
				return [this.registerProvider(e, t), t];
			}
			registerProvider(e, t) {
				let r = this._client.protocol2CodeConverter.asDocumentSelector(e.documentSelector);
				if (e.retriggerCharacters === void 0) {
					let i = e.triggerCharacters || [];
					return Jm.languages.registerSignatureHelpProvider(r, t, ...i);
				} else {
					let i = {
						triggerCharacters: e.triggerCharacters || [],
						retriggerCharacters: e.retriggerCharacters || [],
					};
					return Jm.languages.registerSignatureHelpProvider(r, t, i);
				}
			}
		};
	wo.SignatureHelpFeature = nl;
});
var Ym = E((Do) => {
	'use strict';
	Object.defineProperty(Do, '__esModule', { value: !0 });
	Do.DocumentHighlightFeature = void 0;
	var Q_ = require('vscode'),
		rl = ee(),
		il = ye(),
		Y_ = We(),
		sl = class extends il.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, rl.DocumentHighlightRequest.type);
			}
			fillClientCapabilities(e) {
				(0, il.ensure)((0, il.ensure)(e, 'textDocument'), 'documentHighlight').dynamicRegistration =
					!0;
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.documentHighlightProvider);
				r && this.register({ id: Y_.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideDocumentHighlights: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											rl.DocumentHighlightRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asDocumentHighlights(D, g),
											(D) => a.handleFailedRequest(rl.DocumentHighlightRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideDocumentHighlights
								? l.provideDocumentHighlights(i, s, o, u)
								: u(i, s, o);
						},
					};
				return [
					Q_.languages.registerDocumentHighlightProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						r,
					),
					r,
				];
			}
		};
	Do.DocumentHighlightFeature = sl;
});
var cl = E((Hn) => {
	'use strict';
	Object.defineProperty(Hn, '__esModule', { value: !0 });
	Hn.DocumentSymbolFeature = Hn.SupportedSymbolTags = Hn.SupportedSymbolKinds = void 0;
	var Z_ = require('vscode'),
		Se = ee(),
		ol = ye(),
		ew = We();
	Hn.SupportedSymbolKinds = [
		Se.SymbolKind.File,
		Se.SymbolKind.Module,
		Se.SymbolKind.Namespace,
		Se.SymbolKind.Package,
		Se.SymbolKind.Class,
		Se.SymbolKind.Method,
		Se.SymbolKind.Property,
		Se.SymbolKind.Field,
		Se.SymbolKind.Constructor,
		Se.SymbolKind.Enum,
		Se.SymbolKind.Interface,
		Se.SymbolKind.Function,
		Se.SymbolKind.Variable,
		Se.SymbolKind.Constant,
		Se.SymbolKind.String,
		Se.SymbolKind.Number,
		Se.SymbolKind.Boolean,
		Se.SymbolKind.Array,
		Se.SymbolKind.Object,
		Se.SymbolKind.Key,
		Se.SymbolKind.Null,
		Se.SymbolKind.EnumMember,
		Se.SymbolKind.Struct,
		Se.SymbolKind.Event,
		Se.SymbolKind.Operator,
		Se.SymbolKind.TypeParameter,
	];
	Hn.SupportedSymbolTags = [Se.SymbolTag.Deprecated];
	var al = class extends ol.TextDocumentLanguageFeature {
		constructor(e) {
			super(e, Se.DocumentSymbolRequest.type);
		}
		fillClientCapabilities(e) {
			let t = (0, ol.ensure)((0, ol.ensure)(e, 'textDocument'), 'documentSymbol');
			((t.dynamicRegistration = !0),
				(t.symbolKind = { valueSet: Hn.SupportedSymbolKinds }),
				(t.hierarchicalDocumentSymbolSupport = !0),
				(t.tagSupport = { valueSet: Hn.SupportedSymbolTags }),
				(t.labelSupport = !0));
		}
		initialize(e, t) {
			let r = this.getRegistrationOptions(t, e.documentSymbolProvider);
			r && this.register({ id: ew.generateUuid(), registerOptions: r });
		}
		registerLanguageProvider(e) {
			let t = e.documentSelector,
				r = {
					provideDocumentSymbols: (s, o) => {
						let a = this._client,
							u = async (p, m) => {
								try {
									let g = await a.sendRequest(
										Se.DocumentSymbolRequest.type,
										a.code2ProtocolConverter.asDocumentSymbolParams(p),
										m,
									);
									if (m.isCancellationRequested || g === void 0 || g === null) return null;
									if (g.length === 0) return [];
									{
										let D = g[0];
										return Se.DocumentSymbol.is(D)
											? await a.protocol2CodeConverter.asDocumentSymbols(g, m)
											: await a.protocol2CodeConverter.asSymbolInformations(g, m);
									}
								} catch (g) {
									return a.handleFailedRequest(Se.DocumentSymbolRequest.type, m, g, null);
								}
							},
							l = a.middleware;
						return l.provideDocumentSymbols ? l.provideDocumentSymbols(s, o, u) : u(s, o);
					},
				},
				i = e.label !== void 0 ? { label: e.label } : void 0;
			return [
				Z_.languages.registerDocumentSymbolProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(t),
					r,
					i,
				),
				r,
			];
		}
	};
	Hn.DocumentSymbolFeature = al;
});
var ev = E((Ro) => {
	'use strict';
	Object.defineProperty(Ro, '__esModule', { value: !0 });
	Ro.WorkspaceSymbolFeature = void 0;
	var tw = require('vscode'),
		Yi = ee(),
		ul = ye(),
		Zm = cl(),
		nw = We(),
		ll = class extends ul.WorkspaceFeature {
			constructor(e) {
				super(e, Yi.WorkspaceSymbolRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, ul.ensure)((0, ul.ensure)(e, 'workspace'), 'symbol');
				((t.dynamicRegistration = !0),
					(t.symbolKind = { valueSet: Zm.SupportedSymbolKinds }),
					(t.tagSupport = { valueSet: Zm.SupportedSymbolTags }),
					(t.resolveSupport = { properties: ['location.range'] }));
			}
			initialize(e) {
				e.workspaceSymbolProvider &&
					this.register({
						id: nw.generateUuid(),
						registerOptions:
							e.workspaceSymbolProvider === !0
								? { workDoneProgress: !1 }
								: e.workspaceSymbolProvider,
					});
			}
			registerLanguageProvider(e) {
				let t = {
					provideWorkspaceSymbols: (r, i) => {
						let s = this._client,
							o = (u, l) =>
								s.sendRequest(Yi.WorkspaceSymbolRequest.type, { query: u }, l).then(
									(p) =>
										l.isCancellationRequested
											? null
											: s.protocol2CodeConverter.asSymbolInformations(p, l),
									(p) => s.handleFailedRequest(Yi.WorkspaceSymbolRequest.type, l, p, null),
								),
							a = s.middleware;
						return a.provideWorkspaceSymbols ? a.provideWorkspaceSymbols(r, i, o) : o(r, i);
					},
					resolveWorkspaceSymbol:
						e.resolveProvider === !0
							? (r, i) => {
									let s = this._client,
										o = (u, l) =>
											s
												.sendRequest(
													Yi.WorkspaceSymbolResolveRequest.type,
													s.code2ProtocolConverter.asWorkspaceSymbol(u),
													l,
												)
												.then(
													(p) =>
														l.isCancellationRequested
															? null
															: s.protocol2CodeConverter.asSymbolInformation(p),
													(p) =>
														s.handleFailedRequest(
															Yi.WorkspaceSymbolResolveRequest.type,
															l,
															p,
															null,
														),
												),
										a = s.middleware;
									return a.resolveWorkspaceSymbol ? a.resolveWorkspaceSymbol(r, i, o) : o(r, i);
								}
							: void 0,
				};
				return [tw.languages.registerWorkspaceSymbolProvider(t), t];
			}
		};
	Ro.WorkspaceSymbolFeature = ll;
});
var tv = E((So) => {
	'use strict';
	Object.defineProperty(So, '__esModule', { value: !0 });
	So.ReferencesFeature = void 0;
	var rw = require('vscode'),
		dl = ee(),
		fl = ye(),
		iw = We(),
		hl = class extends fl.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, dl.ReferencesRequest.type);
			}
			fillClientCapabilities(e) {
				(0, fl.ensure)((0, fl.ensure)(e, 'textDocument'), 'references').dynamicRegistration = !0;
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.referencesProvider);
				r && this.register({ id: iw.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideReferences: (i, s, o, a) => {
							let u = this._client,
								l = (m, g, D, y) =>
									u
										.sendRequest(
											dl.ReferencesRequest.type,
											u.code2ProtocolConverter.asReferenceParams(m, g, D),
											y,
										)
										.then(
											(P) =>
												y.isCancellationRequested
													? null
													: u.protocol2CodeConverter.asReferences(P, y),
											(P) => u.handleFailedRequest(dl.ReferencesRequest.type, y, P, null),
										),
								p = u.middleware;
							return p.provideReferences ? p.provideReferences(i, s, o, a, l) : l(i, s, o, a);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return rw.languages.registerReferenceProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	So.ReferencesFeature = hl;
});
var nv = E((To) => {
	'use strict';
	Object.defineProperty(To, '__esModule', { value: !0 });
	To.CodeActionFeature = void 0;
	var sw = require('vscode'),
		Yt = ee(),
		ow = We(),
		pl = ye(),
		gl = class extends pl.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Yt.CodeActionRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, pl.ensure)((0, pl.ensure)(e, 'textDocument'), 'codeAction');
				((t.dynamicRegistration = !0),
					(t.isPreferredSupport = !0),
					(t.disabledSupport = !0),
					(t.dataSupport = !0),
					(t.resolveSupport = { properties: ['edit'] }),
					(t.codeActionLiteralSupport = {
						codeActionKind: {
							valueSet: [
								Yt.CodeActionKind.Empty,
								Yt.CodeActionKind.QuickFix,
								Yt.CodeActionKind.Refactor,
								Yt.CodeActionKind.RefactorExtract,
								Yt.CodeActionKind.RefactorInline,
								Yt.CodeActionKind.RefactorRewrite,
								Yt.CodeActionKind.Source,
								Yt.CodeActionKind.SourceOrganizeImports,
							],
						},
					}),
					(t.honorsChangeAnnotations = !0));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.codeActionProvider);
				r && this.register({ id: ow.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideCodeActions: (i, s, o, a) => {
							let u = this._client,
								l = async (m, g, D, y) => {
									let P = {
										textDocument: u.code2ProtocolConverter.asTextDocumentIdentifier(m),
										range: u.code2ProtocolConverter.asRange(g),
										context: u.code2ProtocolConverter.asCodeActionContextSync(D),
									};
									return u.sendRequest(Yt.CodeActionRequest.type, P, y).then(
										(q) =>
											y.isCancellationRequested || q === null || q === void 0
												? null
												: u.protocol2CodeConverter.asCodeActionResult(q, y),
										(q) => u.handleFailedRequest(Yt.CodeActionRequest.type, y, q, null),
									);
								},
								p = u.middleware;
							return p.provideCodeActions ? p.provideCodeActions(i, s, o, a, l) : l(i, s, o, a);
						},
						resolveCodeAction: e.resolveProvider
							? (i, s) => {
									let o = this._client,
										a = this._client.middleware,
										u = async (l, p) =>
											o
												.sendRequest(
													Yt.CodeActionResolveRequest.type,
													o.code2ProtocolConverter.asCodeActionSync(l),
													p,
												)
												.then(
													(m) =>
														p.isCancellationRequested
															? l
															: o.protocol2CodeConverter.asCodeAction(m, p),
													(m) => o.handleFailedRequest(Yt.CodeActionResolveRequest.type, p, m, l),
												);
									return a.resolveCodeAction ? a.resolveCodeAction(i, s, u) : u(i, s);
								}
							: void 0,
					};
				return [
					sw.languages.registerCodeActionsProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						r,
						e.codeActionKinds
							? {
									providedCodeActionKinds: this._client.protocol2CodeConverter.asCodeActionKinds(
										e.codeActionKinds,
									),
								}
							: void 0,
					),
					r,
				];
			}
		};
	To.CodeActionFeature = gl;
});
var iv = E((Po) => {
	'use strict';
	Object.defineProperty(Po, '__esModule', { value: !0 });
	Po.CodeLensFeature = void 0;
	var rv = require('vscode'),
		wi = ee(),
		aw = We(),
		Zi = ye(),
		ml = class extends Zi.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, wi.CodeLensRequest.type);
			}
			fillClientCapabilities(e) {
				(((0, Zi.ensure)((0, Zi.ensure)(e, 'textDocument'), 'codeLens').dynamicRegistration = !0),
					((0, Zi.ensure)((0, Zi.ensure)(e, 'workspace'), 'codeLens').refreshSupport = !0));
			}
			initialize(e, t) {
				this._client.onRequest(wi.CodeLensRefreshRequest.type, async () => {
					for (let s of this.getAllProviders()) s.onDidChangeCodeLensEmitter.fire();
				});
				let i = this.getRegistrationOptions(t, e.codeLensProvider);
				i && this.register({ id: aw.generateUuid(), registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = new rv.EventEmitter(),
					i = {
						onDidChangeCodeLenses: r.event,
						provideCodeLenses: (s, o) => {
							let a = this._client,
								u = (p, m) =>
									a
										.sendRequest(
											wi.CodeLensRequest.type,
											a.code2ProtocolConverter.asCodeLensParams(p),
											m,
										)
										.then(
											(g) =>
												m.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asCodeLenses(g, m),
											(g) => a.handleFailedRequest(wi.CodeLensRequest.type, m, g, null),
										),
								l = a.middleware;
							return l.provideCodeLenses ? l.provideCodeLenses(s, o, u) : u(s, o);
						},
						resolveCodeLens: e.resolveProvider
							? (s, o) => {
									let a = this._client,
										u = (p, m) =>
											a
												.sendRequest(
													wi.CodeLensResolveRequest.type,
													a.code2ProtocolConverter.asCodeLens(p),
													m,
												)
												.then(
													(g) =>
														m.isCancellationRequested ? p : a.protocol2CodeConverter.asCodeLens(g),
													(g) => a.handleFailedRequest(wi.CodeLensResolveRequest.type, m, g, p),
												),
										l = a.middleware;
									return l.resolveCodeLens ? l.resolveCodeLens(s, o, u) : u(s, o);
								}
							: void 0,
					};
				return [
					rv.languages.registerCodeLensProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						i,
					),
					{ provider: i, onDidChangeCodeLensEmitter: r },
				];
			}
		};
	Po.CodeLensFeature = ml;
});
var sv = E((Tr) => {
	'use strict';
	Object.defineProperty(Tr, '__esModule', { value: !0 });
	Tr.DocumentOnTypeFormattingFeature =
		Tr.DocumentRangeFormattingFeature =
		Tr.DocumentFormattingFeature =
			void 0;
	var qo = require('vscode'),
		Rn = ee(),
		bl = We(),
		tr = ye(),
		Di;
	(function (n) {
		function e(t) {
			let r = qo.workspace.getConfiguration('files', t);
			return {
				trimTrailingWhitespace: r.get('trimTrailingWhitespace'),
				trimFinalNewlines: r.get('trimFinalNewlines'),
				insertFinalNewline: r.get('insertFinalNewline'),
			};
		}
		n.fromConfiguration = e;
	})(Di || (Di = {}));
	var vl = class extends tr.TextDocumentLanguageFeature {
		constructor(e) {
			super(e, Rn.DocumentFormattingRequest.type);
		}
		fillClientCapabilities(e) {
			(0, tr.ensure)((0, tr.ensure)(e, 'textDocument'), 'formatting').dynamicRegistration = !0;
		}
		initialize(e, t) {
			let r = this.getRegistrationOptions(t, e.documentFormattingProvider);
			r && this.register({ id: bl.generateUuid(), registerOptions: r });
		}
		registerLanguageProvider(e) {
			let t = e.documentSelector,
				r = {
					provideDocumentFormattingEdits: (i, s, o) => {
						let a = this._client,
							u = (p, m, g) => {
								let D = {
									textDocument: a.code2ProtocolConverter.asTextDocumentIdentifier(p),
									options: a.code2ProtocolConverter.asFormattingOptions(m, Di.fromConfiguration(p)),
								};
								return a.sendRequest(Rn.DocumentFormattingRequest.type, D, g).then(
									(y) =>
										g.isCancellationRequested ? null : a.protocol2CodeConverter.asTextEdits(y, g),
									(y) => a.handleFailedRequest(Rn.DocumentFormattingRequest.type, g, y, null),
								);
							},
							l = a.middleware;
						return l.provideDocumentFormattingEdits
							? l.provideDocumentFormattingEdits(i, s, o, u)
							: u(i, s, o);
					},
				};
			return [
				qo.languages.registerDocumentFormattingEditProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(t),
					r,
				),
				r,
			];
		}
	};
	Tr.DocumentFormattingFeature = vl;
	var yl = class extends tr.TextDocumentLanguageFeature {
		constructor(e) {
			super(e, Rn.DocumentRangeFormattingRequest.type);
		}
		fillClientCapabilities(e) {
			let t = (0, tr.ensure)((0, tr.ensure)(e, 'textDocument'), 'rangeFormatting');
			((t.dynamicRegistration = !0), (t.rangesSupport = !0));
		}
		initialize(e, t) {
			let r = this.getRegistrationOptions(t, e.documentRangeFormattingProvider);
			r && this.register({ id: bl.generateUuid(), registerOptions: r });
		}
		registerLanguageProvider(e) {
			let t = e.documentSelector,
				r = {
					provideDocumentRangeFormattingEdits: (i, s, o, a) => {
						let u = this._client,
							l = (m, g, D, y) => {
								let P = {
									textDocument: u.code2ProtocolConverter.asTextDocumentIdentifier(m),
									range: u.code2ProtocolConverter.asRange(g),
									options: u.code2ProtocolConverter.asFormattingOptions(D, Di.fromConfiguration(m)),
								};
								return u.sendRequest(Rn.DocumentRangeFormattingRequest.type, P, y).then(
									(q) =>
										y.isCancellationRequested ? null : u.protocol2CodeConverter.asTextEdits(q, y),
									(q) => u.handleFailedRequest(Rn.DocumentRangeFormattingRequest.type, y, q, null),
								);
							},
							p = u.middleware;
						return p.provideDocumentRangeFormattingEdits
							? p.provideDocumentRangeFormattingEdits(i, s, o, a, l)
							: l(i, s, o, a);
					},
				};
			return (
				e.rangesSupport &&
					(r.provideDocumentRangesFormattingEdits = (i, s, o, a) => {
						let u = this._client,
							l = (m, g, D, y) => {
								let P = {
									textDocument: u.code2ProtocolConverter.asTextDocumentIdentifier(m),
									ranges: u.code2ProtocolConverter.asRanges(g),
									options: u.code2ProtocolConverter.asFormattingOptions(D, Di.fromConfiguration(m)),
								};
								return u.sendRequest(Rn.DocumentRangesFormattingRequest.type, P, y).then(
									(q) =>
										y.isCancellationRequested ? null : u.protocol2CodeConverter.asTextEdits(q, y),
									(q) => u.handleFailedRequest(Rn.DocumentRangesFormattingRequest.type, y, q, null),
								);
							},
							p = u.middleware;
						return p.provideDocumentRangesFormattingEdits
							? p.provideDocumentRangesFormattingEdits(i, s, o, a, l)
							: l(i, s, o, a);
					}),
				[
					qo.languages.registerDocumentRangeFormattingEditProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						r,
					),
					r,
				]
			);
		}
	};
	Tr.DocumentRangeFormattingFeature = yl;
	var Cl = class extends tr.TextDocumentLanguageFeature {
		constructor(e) {
			super(e, Rn.DocumentOnTypeFormattingRequest.type);
		}
		fillClientCapabilities(e) {
			(0, tr.ensure)((0, tr.ensure)(e, 'textDocument'), 'onTypeFormatting').dynamicRegistration =
				!0;
		}
		initialize(e, t) {
			let r = this.getRegistrationOptions(t, e.documentOnTypeFormattingProvider);
			r && this.register({ id: bl.generateUuid(), registerOptions: r });
		}
		registerLanguageProvider(e) {
			let t = e.documentSelector,
				r = {
					provideOnTypeFormattingEdits: (s, o, a, u, l) => {
						let p = this._client,
							m = (D, y, P, q, N) => {
								let L = {
									textDocument: p.code2ProtocolConverter.asTextDocumentIdentifier(D),
									position: p.code2ProtocolConverter.asPosition(y),
									ch: P,
									options: p.code2ProtocolConverter.asFormattingOptions(q, Di.fromConfiguration(D)),
								};
								return p.sendRequest(Rn.DocumentOnTypeFormattingRequest.type, L, N).then(
									(M) =>
										N.isCancellationRequested ? null : p.protocol2CodeConverter.asTextEdits(M, N),
									(M) => p.handleFailedRequest(Rn.DocumentOnTypeFormattingRequest.type, N, M, null),
								);
							},
							g = p.middleware;
						return g.provideOnTypeFormattingEdits
							? g.provideOnTypeFormattingEdits(s, o, a, u, l, m)
							: m(s, o, a, u, l);
					},
				},
				i = e.moreTriggerCharacter || [];
			return [
				qo.languages.registerOnTypeFormattingEditProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(t),
					r,
					e.firstTriggerCharacter,
					...i,
				),
				r,
			];
		}
	};
	Tr.DocumentOnTypeFormattingFeature = Cl;
});
var av = E((Eo) => {
	'use strict';
	Object.defineProperty(Eo, '__esModule', { value: !0 });
	Eo.RenameFeature = void 0;
	var cw = require('vscode'),
		$r = ee(),
		uw = We(),
		ov = cn(),
		_l = ye(),
		wl = class extends _l.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, $r.RenameRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, _l.ensure)((0, _l.ensure)(e, 'textDocument'), 'rename');
				((t.dynamicRegistration = !0),
					(t.prepareSupport = !0),
					(t.prepareSupportDefaultBehavior = $r.PrepareSupportDefaultBehavior.Identifier),
					(t.honorsChangeAnnotations = !0));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.renameProvider);
				r &&
					(ov.boolean(e.renameProvider) && (r.prepareProvider = !1),
					this.register({ id: uw.generateUuid(), registerOptions: r }));
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideRenameEdits: (i, s, o, a) => {
							let u = this._client,
								l = (m, g, D, y) => {
									let P = {
										textDocument: u.code2ProtocolConverter.asTextDocumentIdentifier(m),
										position: u.code2ProtocolConverter.asPosition(g),
										newName: D,
									};
									return u.sendRequest($r.RenameRequest.type, P, y).then(
										(q) =>
											y.isCancellationRequested
												? null
												: u.protocol2CodeConverter.asWorkspaceEdit(q, y),
										(q) => u.handleFailedRequest($r.RenameRequest.type, y, q, null, !1),
									);
								},
								p = u.middleware;
							return p.provideRenameEdits ? p.provideRenameEdits(i, s, o, a, l) : l(i, s, o, a);
						},
						prepareRename: e.prepareProvider
							? (i, s, o) => {
									let a = this._client,
										u = (p, m, g) => {
											let D = {
												textDocument: a.code2ProtocolConverter.asTextDocumentIdentifier(p),
												position: a.code2ProtocolConverter.asPosition(m),
											};
											return a.sendRequest($r.PrepareRenameRequest.type, D, g).then(
												(y) =>
													g.isCancellationRequested
														? null
														: $r.Range.is(y)
															? a.protocol2CodeConverter.asRange(y)
															: this.isDefaultBehavior(y)
																? y.defaultBehavior === !0
																	? null
																	: Promise.reject(new Error("The element can't be renamed."))
																: y && $r.Range.is(y.range)
																	? {
																			range: a.protocol2CodeConverter.asRange(y.range),
																			placeholder: y.placeholder,
																		}
																	: Promise.reject(new Error("The element can't be renamed.")),
												(y) => {
													throw typeof y.message == 'string'
														? new Error(y.message)
														: new Error("The element can't be renamed.");
												},
											);
										},
										l = a.middleware;
									return l.prepareRename ? l.prepareRename(i, s, o, u) : u(i, s, o);
								}
							: void 0,
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return cw.languages.registerRenameProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
			isDefaultBehavior(e) {
				let t = e;
				return t && ov.boolean(t.defaultBehavior);
			}
		};
	Eo.RenameFeature = wl;
});
var cv = E((ko) => {
	'use strict';
	Object.defineProperty(ko, '__esModule', { value: !0 });
	ko.DocumentLinkFeature = void 0;
	var lw = require('vscode'),
		es = ee(),
		Dl = ye(),
		dw = We(),
		Rl = class extends Dl.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, es.DocumentLinkRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, Dl.ensure)((0, Dl.ensure)(e, 'textDocument'), 'documentLink');
				((t.dynamicRegistration = !0), (t.tooltipSupport = !0));
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.documentLinkProvider);
				r && this.register({ id: dw.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideDocumentLinks: (i, s) => {
							let o = this._client,
								a = (l, p) =>
									o
										.sendRequest(
											es.DocumentLinkRequest.type,
											o.code2ProtocolConverter.asDocumentLinkParams(l),
											p,
										)
										.then(
											(m) =>
												p.isCancellationRequested
													? null
													: o.protocol2CodeConverter.asDocumentLinks(m, p),
											(m) => o.handleFailedRequest(es.DocumentLinkRequest.type, p, m, null),
										),
								u = o.middleware;
							return u.provideDocumentLinks ? u.provideDocumentLinks(i, s, a) : a(i, s);
						},
						resolveDocumentLink: e.resolveProvider
							? (i, s) => {
									let o = this._client,
										a = (l, p) =>
											o
												.sendRequest(
													es.DocumentLinkResolveRequest.type,
													o.code2ProtocolConverter.asDocumentLink(l),
													p,
												)
												.then(
													(m) =>
														p.isCancellationRequested
															? l
															: o.protocol2CodeConverter.asDocumentLink(m),
													(m) => o.handleFailedRequest(es.DocumentLinkResolveRequest.type, p, m, l),
												),
										u = o.middleware;
									return u.resolveDocumentLink ? u.resolveDocumentLink(i, s, a) : a(i, s);
								}
							: void 0,
					};
				return [
					lw.languages.registerDocumentLinkProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						r,
					),
					r,
				];
			}
		};
	ko.DocumentLinkFeature = Rl;
});
var lv = E((xo) => {
	'use strict';
	Object.defineProperty(xo, '__esModule', { value: !0 });
	xo.ExecuteCommandFeature = void 0;
	var fw = require('vscode'),
		Sl = ee(),
		hw = We(),
		uv = ye(),
		Tl = class {
			constructor(e) {
				((this._client = e), (this._commands = new Map()));
			}
			getState() {
				return {
					kind: 'workspace',
					id: this.registrationType.method,
					registrations: this._commands.size > 0,
				};
			}
			get registrationType() {
				return Sl.ExecuteCommandRequest.type;
			}
			fillClientCapabilities(e) {
				(0, uv.ensure)((0, uv.ensure)(e, 'workspace'), 'executeCommand').dynamicRegistration = !0;
			}
			initialize(e) {
				e.executeCommandProvider &&
					this.register({
						id: hw.generateUuid(),
						registerOptions: Object.assign({}, e.executeCommandProvider),
					});
			}
			register(e) {
				let t = this._client,
					r = t.middleware,
					i = (s, o) => {
						let a = { command: s, arguments: o };
						return t
							.sendRequest(Sl.ExecuteCommandRequest.type, a)
							.then(void 0, (u) =>
								t.handleFailedRequest(Sl.ExecuteCommandRequest.type, void 0, u, void 0),
							);
					};
				if (e.registerOptions.commands) {
					let s = [];
					for (let o of e.registerOptions.commands)
						s.push(
							fw.commands.registerCommand(o, (...a) =>
								r.executeCommand ? r.executeCommand(o, a, i) : i(o, a),
							),
						);
					this._commands.set(e.id, s);
				}
			}
			unregister(e) {
				let t = this._commands.get(e);
				t && t.forEach((r) => r.dispose());
			}
			clear() {
				(this._commands.forEach((e) => {
					e.forEach((t) => t.dispose());
				}),
					this._commands.clear());
			}
		};
	xo.ExecuteCommandFeature = Tl;
});
var dv = E((Oo) => {
	'use strict';
	Object.defineProperty(Oo, '__esModule', { value: !0 });
	Oo.FileSystemWatcherFeature = void 0;
	var pw = require('vscode'),
		Hr = ee(),
		Io = ye(),
		Pl = class {
			constructor(e, t) {
				((this._client = e), (this._notifyFileEvent = t), (this._watchers = new Map()));
			}
			getState() {
				return {
					kind: 'workspace',
					id: this.registrationType.method,
					registrations: this._watchers.size > 0,
				};
			}
			get registrationType() {
				return Hr.DidChangeWatchedFilesNotification.type;
			}
			fillClientCapabilities(e) {
				(((0, Io.ensure)(
					(0, Io.ensure)(e, 'workspace'),
					'didChangeWatchedFiles',
				).dynamicRegistration = !0),
					((0, Io.ensure)(
						(0, Io.ensure)(e, 'workspace'),
						'didChangeWatchedFiles',
					).relativePatternSupport = !0));
			}
			initialize(e, t) {}
			register(e) {
				if (!Array.isArray(e.registerOptions.watchers)) return;
				let t = [];
				for (let r of e.registerOptions.watchers) {
					let i = this._client.protocol2CodeConverter.asGlobPattern(r.globPattern);
					if (i === void 0) continue;
					let s = !0,
						o = !0,
						a = !0;
					r.kind !== void 0 &&
						r.kind !== null &&
						((s = (r.kind & Hr.WatchKind.Create) !== 0),
						(o = (r.kind & Hr.WatchKind.Change) !== 0),
						(a = (r.kind & Hr.WatchKind.Delete) !== 0));
					let u = pw.workspace.createFileSystemWatcher(i, !s, !o, !a);
					(this.hookListeners(u, s, o, a, t), t.push(u));
				}
				this._watchers.set(e.id, t);
			}
			registerRaw(e, t) {
				let r = [];
				for (let i of t) this.hookListeners(i, !0, !0, !0, r);
				this._watchers.set(e, r);
			}
			hookListeners(e, t, r, i, s) {
				(t &&
					e.onDidCreate(
						(o) =>
							this._notifyFileEvent({
								uri: this._client.code2ProtocolConverter.asUri(o),
								type: Hr.FileChangeType.Created,
							}),
						null,
						s,
					),
					r &&
						e.onDidChange(
							(o) =>
								this._notifyFileEvent({
									uri: this._client.code2ProtocolConverter.asUri(o),
									type: Hr.FileChangeType.Changed,
								}),
							null,
							s,
						),
					i &&
						e.onDidDelete(
							(o) =>
								this._notifyFileEvent({
									uri: this._client.code2ProtocolConverter.asUri(o),
									type: Hr.FileChangeType.Deleted,
								}),
							null,
							s,
						));
			}
			unregister(e) {
				let t = this._watchers.get(e);
				if (t) for (let r of t) r.dispose();
			}
			clear() {
				(this._watchers.forEach((e) => {
					for (let t of e) t.dispose();
				}),
					this._watchers.clear());
			}
		};
	Oo.FileSystemWatcherFeature = Pl;
});
var fv = E((Fo) => {
	'use strict';
	Object.defineProperty(Fo, '__esModule', { value: !0 });
	Fo.ColorProviderFeature = void 0;
	var gw = require('vscode'),
		ts = ee(),
		ql = ye(),
		El = class extends ql.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, ts.DocumentColorRequest.type);
			}
			fillClientCapabilities(e) {
				(0, ql.ensure)((0, ql.ensure)(e, 'textDocument'), 'colorProvider').dynamicRegistration = !0;
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.colorProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideColorPresentations: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) => {
									let D = {
										color: p,
										textDocument: a.code2ProtocolConverter.asTextDocumentIdentifier(m.document),
										range: a.code2ProtocolConverter.asRange(m.range),
									};
									return a.sendRequest(ts.ColorPresentationRequest.type, D, g).then(
										(y) =>
											g.isCancellationRequested
												? null
												: this._client.protocol2CodeConverter.asColorPresentations(y, g),
										(y) => a.handleFailedRequest(ts.ColorPresentationRequest.type, g, y, null),
									);
								},
								l = a.middleware;
							return l.provideColorPresentations
								? l.provideColorPresentations(i, s, o, u)
								: u(i, s, o);
						},
						provideDocumentColors: (i, s) => {
							let o = this._client,
								a = (l, p) => {
									let m = { textDocument: o.code2ProtocolConverter.asTextDocumentIdentifier(l) };
									return o.sendRequest(ts.DocumentColorRequest.type, m, p).then(
										(g) =>
											p.isCancellationRequested
												? null
												: this._client.protocol2CodeConverter.asColorInformations(g, p),
										(g) => o.handleFailedRequest(ts.DocumentColorRequest.type, p, g, null),
									);
								},
								u = o.middleware;
							return u.provideDocumentColors ? u.provideDocumentColors(i, s, a) : a(i, s);
						},
					};
				return [
					gw.languages.registerColorProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						r,
					),
					r,
				];
			}
		};
	Fo.ColorProviderFeature = El;
});
var hv = E((No) => {
	'use strict';
	Object.defineProperty(No, '__esModule', { value: !0 });
	No.ImplementationFeature = void 0;
	var mw = require('vscode'),
		kl = ee(),
		xl = ye(),
		Il = class extends xl.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, kl.ImplementationRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, xl.ensure)((0, xl.ensure)(e, 'textDocument'), 'implementation');
				((t.dynamicRegistration = !0), (t.linkSupport = !0));
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.implementationProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideImplementation: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											kl.ImplementationRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asDefinitionResult(D, g),
											(D) => a.handleFailedRequest(kl.ImplementationRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideImplementation ? l.provideImplementation(i, s, o, u) : u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return mw.languages.registerImplementationProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	No.ImplementationFeature = Il;
});
var pv = E((Mo) => {
	'use strict';
	Object.defineProperty(Mo, '__esModule', { value: !0 });
	Mo.TypeDefinitionFeature = void 0;
	var vw = require('vscode'),
		Ol = ee(),
		ns = ye(),
		Fl = class extends ns.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Ol.TypeDefinitionRequest.type);
			}
			fillClientCapabilities(e) {
				(0, ns.ensure)((0, ns.ensure)(e, 'textDocument'), 'typeDefinition').dynamicRegistration =
					!0;
				let t = (0, ns.ensure)((0, ns.ensure)(e, 'textDocument'), 'typeDefinition');
				((t.dynamicRegistration = !0), (t.linkSupport = !0));
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.typeDefinitionProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideTypeDefinition: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											Ol.TypeDefinitionRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asDefinitionResult(D, g),
											(D) => a.handleFailedRequest(Ol.TypeDefinitionRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideTypeDefinition ? l.provideTypeDefinition(i, s, o, u) : u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return vw.languages.registerTypeDefinitionProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	Mo.TypeDefinitionFeature = Fl;
});
var gv = E((Ri) => {
	'use strict';
	Object.defineProperty(Ri, '__esModule', { value: !0 });
	Ri.WorkspaceFoldersFeature = Ri.arrayDiff = void 0;
	var yw = We(),
		Lo = require('vscode'),
		rs = ee();
	function Nl(n, e) {
		if (n != null) return n[e];
	}
	function Ml(n, e) {
		return n.filter((t) => e.indexOf(t) < 0);
	}
	Ri.arrayDiff = Ml;
	var Ll = class {
		constructor(e) {
			((this._client = e), (this._listeners = new Map()));
		}
		getState() {
			return {
				kind: 'workspace',
				id: this.registrationType.method,
				registrations: this._listeners.size > 0,
			};
		}
		get registrationType() {
			return rs.DidChangeWorkspaceFoldersNotification.type;
		}
		fillInitializeParams(e) {
			let t = Lo.workspace.workspaceFolders;
			(this.initializeWithFolders(t),
				t === void 0
					? (e.workspaceFolders = null)
					: (e.workspaceFolders = t.map((r) => this.asProtocol(r))));
		}
		initializeWithFolders(e) {
			this._initialFolders = e;
		}
		fillClientCapabilities(e) {
			((e.workspace = e.workspace || {}), (e.workspace.workspaceFolders = !0));
		}
		initialize(e) {
			let t = this._client;
			t.onRequest(rs.WorkspaceFoldersRequest.type, (s) => {
				let o = () => {
						let u = Lo.workspace.workspaceFolders;
						return u === void 0 ? null : u.map((p) => this.asProtocol(p));
					},
					a = t.middleware.workspace;
				return a && a.workspaceFolders ? a.workspaceFolders(s, o) : o(s);
			});
			let r = Nl(Nl(Nl(e, 'workspace'), 'workspaceFolders'), 'changeNotifications'),
				i;
			(typeof r == 'string' ? (i = r) : r === !0 && (i = yw.generateUuid()),
				i && this.register({ id: i, registerOptions: void 0 }));
		}
		sendInitialEvent(e) {
			let t;
			if (this._initialFolders && e) {
				let r = Ml(this._initialFolders, e),
					i = Ml(e, this._initialFolders);
				(i.length > 0 || r.length > 0) && (t = this.doSendEvent(i, r));
			} else
				this._initialFolders
					? (t = this.doSendEvent([], this._initialFolders))
					: e && (t = this.doSendEvent(e, []));
			t !== void 0 &&
				t.catch((r) => {
					this._client.error(
						`Sending notification ${rs.DidChangeWorkspaceFoldersNotification.type.method} failed`,
						r,
					);
				});
		}
		doSendEvent(e, t) {
			let r = {
				event: {
					added: e.map((i) => this.asProtocol(i)),
					removed: t.map((i) => this.asProtocol(i)),
				},
			};
			return this._client.sendNotification(rs.DidChangeWorkspaceFoldersNotification.type, r);
		}
		register(e) {
			let t = e.id,
				r = this._client,
				i = Lo.workspace.onDidChangeWorkspaceFolders((s) => {
					let o = (l) => this.doSendEvent(l.added, l.removed),
						a = r.middleware.workspace;
					(a && a.didChangeWorkspaceFolders ? a.didChangeWorkspaceFolders(s, o) : o(s)).catch(
						(l) => {
							this._client.error(
								`Sending notification ${rs.DidChangeWorkspaceFoldersNotification.type.method} failed`,
								l,
							);
						},
					);
				});
			(this._listeners.set(t, i), this.sendInitialEvent(Lo.workspace.workspaceFolders));
		}
		unregister(e) {
			let t = this._listeners.get(e);
			t !== void 0 && (this._listeners.delete(e), t.dispose());
		}
		clear() {
			for (let e of this._listeners.values()) e.dispose();
			this._listeners.clear();
		}
		asProtocol(e) {
			return e === void 0
				? null
				: { uri: this._client.code2ProtocolConverter.asUri(e.uri), name: e.name };
		}
	};
	Ri.WorkspaceFoldersFeature = Ll;
});
var vv = E((Ao) => {
	'use strict';
	Object.defineProperty(Ao, '__esModule', { value: !0 });
	Ao.FoldingRangeFeature = void 0;
	var mv = require('vscode'),
		Wr = ee(),
		is = ye(),
		Al = class extends is.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Wr.FoldingRangeRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, is.ensure)((0, is.ensure)(e, 'textDocument'), 'foldingRange');
				((t.dynamicRegistration = !0),
					(t.rangeLimit = 5e3),
					(t.lineFoldingOnly = !0),
					(t.foldingRangeKind = {
						valueSet: [
							Wr.FoldingRangeKind.Comment,
							Wr.FoldingRangeKind.Imports,
							Wr.FoldingRangeKind.Region,
						],
					}),
					(t.foldingRange = { collapsedText: !1 }),
					((0, is.ensure)((0, is.ensure)(e, 'workspace'), 'foldingRange').refreshSupport = !0));
			}
			initialize(e, t) {
				this._client.onRequest(Wr.FoldingRangeRefreshRequest.type, async () => {
					for (let s of this.getAllProviders()) s.onDidChangeFoldingRange.fire();
				});
				let [r, i] = this.getRegistration(t, e.foldingRangeProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = new mv.EventEmitter(),
					i = {
						onDidChangeFoldingRanges: r.event,
						provideFoldingRanges: (s, o, a) => {
							let u = this._client,
								l = (m, g, D) => {
									let y = { textDocument: u.code2ProtocolConverter.asTextDocumentIdentifier(m) };
									return u.sendRequest(Wr.FoldingRangeRequest.type, y, D).then(
										(P) =>
											D.isCancellationRequested
												? null
												: u.protocol2CodeConverter.asFoldingRanges(P, D),
										(P) => u.handleFailedRequest(Wr.FoldingRangeRequest.type, D, P, null),
									);
								},
								p = u.middleware;
							return p.provideFoldingRanges ? p.provideFoldingRanges(s, o, a, l) : l(s, o, a);
						},
					};
				return [
					mv.languages.registerFoldingRangeProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						i,
					),
					{ provider: i, onDidChangeFoldingRange: r },
				];
			}
		};
	Ao.FoldingRangeFeature = Al;
});
var yv = E((jo) => {
	'use strict';
	Object.defineProperty(jo, '__esModule', { value: !0 });
	jo.DeclarationFeature = void 0;
	var Cw = require('vscode'),
		jl = ee(),
		$l = ye(),
		Hl = class extends $l.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, jl.DeclarationRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, $l.ensure)((0, $l.ensure)(e, 'textDocument'), 'declaration');
				((t.dynamicRegistration = !0), (t.linkSupport = !0));
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.declarationProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideDeclaration: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											jl.DeclarationRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asDeclarationResult(D, g),
											(D) => a.handleFailedRequest(jl.DeclarationRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideDeclaration ? l.provideDeclaration(i, s, o, u) : u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return Cw.languages.registerDeclarationProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	jo.DeclarationFeature = Hl;
});
var Cv = E(($o) => {
	'use strict';
	Object.defineProperty($o, '__esModule', { value: !0 });
	$o.SelectionRangeFeature = void 0;
	var bw = require('vscode'),
		Wl = ee(),
		Ul = ye(),
		Kl = class extends Ul.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Wl.SelectionRangeRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, Ul.ensure)((0, Ul.ensure)(e, 'textDocument'), 'selectionRange');
				t.dynamicRegistration = !0;
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.selectionRangeProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideSelectionRanges: (i, s, o) => {
							let a = this._client,
								u = async (p, m, g) => {
									let D = {
										textDocument: a.code2ProtocolConverter.asTextDocumentIdentifier(p),
										positions: a.code2ProtocolConverter.asPositionsSync(m, g),
									};
									return a.sendRequest(Wl.SelectionRangeRequest.type, D, g).then(
										(y) =>
											g.isCancellationRequested
												? null
												: a.protocol2CodeConverter.asSelectionRanges(y, g),
										(y) => a.handleFailedRequest(Wl.SelectionRangeRequest.type, g, y, null),
									);
								},
								l = a.middleware;
							return l.provideSelectionRanges ? l.provideSelectionRanges(i, s, o, u) : u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return bw.languages.registerSelectionRangeProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	$o.SelectionRangeFeature = Kl;
});
var _v = E((Ho) => {
	'use strict';
	Object.defineProperty(Ho, '__esModule', { value: !0 });
	Ho.ProgressFeature = void 0;
	var bv = ee(),
		_w = yu();
	function ww(n, e) {
		return (n[e] === void 0 && (n[e] = Object.create(null)), n[e]);
	}
	var zl = class {
		constructor(e) {
			((this._client = e), (this.activeParts = new Set()));
		}
		getState() {
			return {
				kind: 'window',
				id: bv.WorkDoneProgressCreateRequest.method,
				registrations: this.activeParts.size > 0,
			};
		}
		fillClientCapabilities(e) {
			ww(e, 'window').workDoneProgress = !0;
		}
		initialize() {
			let e = this._client,
				t = (i) => {
					this.activeParts.delete(i);
				},
				r = (i) => {
					this.activeParts.add(new _w.ProgressPart(this._client, i.token, t));
				};
			e.onRequest(bv.WorkDoneProgressCreateRequest.type, r);
		}
		clear() {
			for (let e of this.activeParts) e.done();
			this.activeParts.clear();
		}
	};
	Ho.ProgressFeature = zl;
});
var wv = E((Wo) => {
	'use strict';
	Object.defineProperty(Wo, '__esModule', { value: !0 });
	Wo.CallHierarchyFeature = void 0;
	var Dw = require('vscode'),
		Ur = ee(),
		Vl = ye(),
		Bl = class {
			constructor(e) {
				((this.client = e), (this.middleware = e.middleware));
			}
			prepareCallHierarchy(e, t, r) {
				let i = this.client,
					s = this.middleware,
					o = (a, u, l) => {
						let p = i.code2ProtocolConverter.asTextDocumentPositionParams(a, u);
						return i.sendRequest(Ur.CallHierarchyPrepareRequest.type, p, l).then(
							(m) =>
								l.isCancellationRequested
									? null
									: i.protocol2CodeConverter.asCallHierarchyItems(m, l),
							(m) => i.handleFailedRequest(Ur.CallHierarchyPrepareRequest.type, l, m, null),
						);
					};
				return s.prepareCallHierarchy ? s.prepareCallHierarchy(e, t, r, o) : o(e, t, r);
			}
			provideCallHierarchyIncomingCalls(e, t) {
				let r = this.client,
					i = this.middleware,
					s = (o, a) => {
						let u = { item: r.code2ProtocolConverter.asCallHierarchyItem(o) };
						return r.sendRequest(Ur.CallHierarchyIncomingCallsRequest.type, u, a).then(
							(l) =>
								a.isCancellationRequested
									? null
									: r.protocol2CodeConverter.asCallHierarchyIncomingCalls(l, a),
							(l) => r.handleFailedRequest(Ur.CallHierarchyIncomingCallsRequest.type, a, l, null),
						);
					};
				return i.provideCallHierarchyIncomingCalls
					? i.provideCallHierarchyIncomingCalls(e, t, s)
					: s(e, t);
			}
			provideCallHierarchyOutgoingCalls(e, t) {
				let r = this.client,
					i = this.middleware,
					s = (o, a) => {
						let u = { item: r.code2ProtocolConverter.asCallHierarchyItem(o) };
						return r.sendRequest(Ur.CallHierarchyOutgoingCallsRequest.type, u, a).then(
							(l) =>
								a.isCancellationRequested
									? null
									: r.protocol2CodeConverter.asCallHierarchyOutgoingCalls(l, a),
							(l) => r.handleFailedRequest(Ur.CallHierarchyOutgoingCallsRequest.type, a, l, null),
						);
					};
				return i.provideCallHierarchyOutgoingCalls
					? i.provideCallHierarchyOutgoingCalls(e, t, s)
					: s(e, t);
			}
		},
		Gl = class extends Vl.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Ur.CallHierarchyPrepareRequest.type);
			}
			fillClientCapabilities(e) {
				let t = e,
					r = (0, Vl.ensure)((0, Vl.ensure)(t, 'textDocument'), 'callHierarchy');
				r.dynamicRegistration = !0;
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.callHierarchyProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = this._client,
					r = new Bl(t);
				return [
					Dw.languages.registerCallHierarchyProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(e.documentSelector),
						r,
					),
					r,
				];
			}
		};
	Wo.CallHierarchyFeature = Gl;
});
var Dv = E((Ko) => {
	'use strict';
	Object.defineProperty(Ko, '__esModule', { value: !0 });
	Ko.SemanticTokensFeature = void 0;
	var Uo = require('vscode'),
		ie = ee(),
		ss = ye(),
		Rw = cn(),
		Xl = class extends ss.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, ie.SemanticTokensRegistrationType.type);
			}
			fillClientCapabilities(e) {
				let t = (0, ss.ensure)((0, ss.ensure)(e, 'textDocument'), 'semanticTokens');
				((t.dynamicRegistration = !0),
					(t.tokenTypes = [
						ie.SemanticTokenTypes.namespace,
						ie.SemanticTokenTypes.type,
						ie.SemanticTokenTypes.class,
						ie.SemanticTokenTypes.enum,
						ie.SemanticTokenTypes.interface,
						ie.SemanticTokenTypes.struct,
						ie.SemanticTokenTypes.typeParameter,
						ie.SemanticTokenTypes.parameter,
						ie.SemanticTokenTypes.variable,
						ie.SemanticTokenTypes.property,
						ie.SemanticTokenTypes.enumMember,
						ie.SemanticTokenTypes.event,
						ie.SemanticTokenTypes.function,
						ie.SemanticTokenTypes.method,
						ie.SemanticTokenTypes.macro,
						ie.SemanticTokenTypes.keyword,
						ie.SemanticTokenTypes.modifier,
						ie.SemanticTokenTypes.comment,
						ie.SemanticTokenTypes.string,
						ie.SemanticTokenTypes.number,
						ie.SemanticTokenTypes.regexp,
						ie.SemanticTokenTypes.operator,
						ie.SemanticTokenTypes.decorator,
					]),
					(t.tokenModifiers = [
						ie.SemanticTokenModifiers.declaration,
						ie.SemanticTokenModifiers.definition,
						ie.SemanticTokenModifiers.readonly,
						ie.SemanticTokenModifiers.static,
						ie.SemanticTokenModifiers.deprecated,
						ie.SemanticTokenModifiers.abstract,
						ie.SemanticTokenModifiers.async,
						ie.SemanticTokenModifiers.modification,
						ie.SemanticTokenModifiers.documentation,
						ie.SemanticTokenModifiers.defaultLibrary,
					]),
					(t.formats = [ie.TokenFormat.Relative]),
					(t.requests = { range: !0, full: { delta: !0 } }),
					(t.multilineTokenSupport = !1),
					(t.overlappingTokenSupport = !1),
					(t.serverCancelSupport = !0),
					(t.augmentsSyntaxTokens = !0),
					((0, ss.ensure)((0, ss.ensure)(e, 'workspace'), 'semanticTokens').refreshSupport = !0));
			}
			initialize(e, t) {
				this._client.onRequest(ie.SemanticTokensRefreshRequest.type, async () => {
					for (let o of this.getAllProviders()) o.onDidChangeSemanticTokensEmitter.fire();
				});
				let [i, s] = this.getRegistration(t, e.semanticTokensProvider);
				!i || !s || this.register({ id: i, registerOptions: s });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = Rw.boolean(e.full) ? e.full : e.full !== void 0,
					i = e.full !== void 0 && typeof e.full != 'boolean' && e.full.delta === !0,
					s = new Uo.EventEmitter(),
					o = r
						? {
								onDidChangeSemanticTokens: s.event,
								provideDocumentSemanticTokens: (D, y) => {
									let P = this._client,
										q = P.middleware,
										N = (L, M) => {
											let H = {
												textDocument: P.code2ProtocolConverter.asTextDocumentIdentifier(L),
											};
											return P.sendRequest(ie.SemanticTokensRequest.type, H, M).then(
												(X) =>
													M.isCancellationRequested
														? null
														: P.protocol2CodeConverter.asSemanticTokens(X, M),
												(X) => P.handleFailedRequest(ie.SemanticTokensRequest.type, M, X, null),
											);
										};
									return q.provideDocumentSemanticTokens
										? q.provideDocumentSemanticTokens(D, y, N)
										: N(D, y);
								},
								provideDocumentSemanticTokensEdits: i
									? (D, y, P) => {
											let q = this._client,
												N = q.middleware,
												L = (M, H, X) => {
													let de = {
														textDocument: q.code2ProtocolConverter.asTextDocumentIdentifier(M),
														previousResultId: H,
													};
													return q.sendRequest(ie.SemanticTokensDeltaRequest.type, de, X).then(
														async (B) =>
															X.isCancellationRequested
																? null
																: ie.SemanticTokens.is(B)
																	? await q.protocol2CodeConverter.asSemanticTokens(B, X)
																	: await q.protocol2CodeConverter.asSemanticTokensEdits(B, X),
														(B) =>
															q.handleFailedRequest(ie.SemanticTokensDeltaRequest.type, X, B, null),
													);
												};
											return N.provideDocumentSemanticTokensEdits
												? N.provideDocumentSemanticTokensEdits(D, y, P, L)
												: L(D, y, P);
										}
									: void 0,
							}
						: void 0,
					u =
						e.range === !0
							? {
									provideDocumentRangeSemanticTokens: (D, y, P) => {
										let q = this._client,
											N = q.middleware,
											L = (M, H, X) => {
												let de = {
													textDocument: q.code2ProtocolConverter.asTextDocumentIdentifier(M),
													range: q.code2ProtocolConverter.asRange(H),
												};
												return q.sendRequest(ie.SemanticTokensRangeRequest.type, de, X).then(
													(B) =>
														X.isCancellationRequested
															? null
															: q.protocol2CodeConverter.asSemanticTokens(B, X),
													(B) =>
														q.handleFailedRequest(ie.SemanticTokensRangeRequest.type, X, B, null),
												);
											};
										return N.provideDocumentRangeSemanticTokens
											? N.provideDocumentRangeSemanticTokens(D, y, P, L)
											: L(D, y, P);
									},
								}
							: void 0,
					l = [],
					p = this._client,
					m = p.protocol2CodeConverter.asSemanticTokensLegend(e.legend),
					g = p.protocol2CodeConverter.asDocumentSelector(t);
				return (
					o !== void 0 && l.push(Uo.languages.registerDocumentSemanticTokensProvider(g, o, m)),
					u !== void 0 && l.push(Uo.languages.registerDocumentRangeSemanticTokensProvider(g, u, m)),
					[
						new Uo.Disposable(() => l.forEach((D) => D.dispose())),
						{ range: u, full: o, onDidChangeSemanticTokensEmitter: s },
					]
				);
			}
		};
	Ko.SemanticTokensFeature = Xl;
});
var Tv = E((Ht) => {
	'use strict';
	Object.defineProperty(Ht, '__esModule', { value: !0 });
	Ht.WillDeleteFilesFeature =
		Ht.WillRenameFilesFeature =
		Ht.WillCreateFilesFeature =
		Ht.DidDeleteFilesFeature =
		Ht.DidRenameFilesFeature =
		Ht.DidCreateFilesFeature =
			void 0;
	var fn = require('vscode'),
		Sw = ho(),
		nr = ee(),
		Tw = We();
	function Rv(n, e) {
		return (n[e] === void 0 && (n[e] = {}), n[e]);
	}
	function Pw(n, e) {
		return n[e];
	}
	function Sv(n, e, t) {
		n[e] = t;
	}
	var rr = class {
			constructor(e, t, r, i, s) {
				((this._client = e),
					(this._event = t),
					(this._registrationType = r),
					(this._clientCapability = i),
					(this._serverCapability = s),
					(this._filters = new Map()));
			}
			getState() {
				return {
					kind: 'workspace',
					id: this._registrationType.method,
					registrations: this._filters.size > 0,
				};
			}
			filterSize() {
				return this._filters.size;
			}
			get registrationType() {
				return this._registrationType;
			}
			fillClientCapabilities(e) {
				let t = Rv(Rv(e, 'workspace'), 'fileOperations');
				(Sv(t, 'dynamicRegistration', !0), Sv(t, this._clientCapability, !0));
			}
			initialize(e) {
				let t = e.workspace?.fileOperations,
					r = t !== void 0 ? Pw(t, this._serverCapability) : void 0;
				if (r?.filters !== void 0)
					try {
						this.register({ id: Tw.generateUuid(), registerOptions: { filters: r.filters } });
					} catch (i) {
						this._client.warn(
							`Ignoring invalid glob pattern for ${this._serverCapability} registration: ${i}`,
						);
					}
			}
			register(e) {
				this._listener || (this._listener = this._event(this.send, this));
				let t = e.registerOptions.filters.map((r) => {
					let i = new Sw.Minimatch(r.pattern.glob, rr.asMinimatchOptions(r.pattern.options));
					if (!i.makeRe()) throw new Error(`Invalid pattern ${r.pattern.glob}!`);
					return { scheme: r.scheme, matcher: i, kind: r.pattern.matches };
				});
				this._filters.set(e.id, t);
			}
			unregister(e) {
				(this._filters.delete(e),
					this._filters.size === 0 &&
						this._listener &&
						(this._listener.dispose(), (this._listener = void 0)));
			}
			clear() {
				(this._filters.clear(),
					this._listener && (this._listener.dispose(), (this._listener = void 0)));
			}
			getFileType(e) {
				return rr.getFileType(e);
			}
			async filter(e, t) {
				let r = await Promise.all(
						e.files.map(async (s) => {
							let o = t(s),
								a = o.fsPath.replace(/\\/g, '/');
							for (let u of this._filters.values())
								for (let l of u)
									if (!(l.scheme !== void 0 && l.scheme !== o.scheme)) {
										if (l.matcher.match(a)) {
											if (l.kind === void 0) return !0;
											let p = await this.getFileType(o);
											if (p === void 0)
												return (
													this._client.error(`Failed to determine file type for ${o.toString()}.`),
													!0
												);
											if (
												(p === fn.FileType.File && l.kind === nr.FileOperationPatternKind.file) ||
												(p === fn.FileType.Directory &&
													l.kind === nr.FileOperationPatternKind.folder)
											)
												return !0;
										} else if (
											l.kind === nr.FileOperationPatternKind.folder &&
											(await rr.getFileType(o)) === fn.FileType.Directory &&
											l.matcher.match(`${a}/`)
										)
											return !0;
									}
							return !1;
						}),
					),
					i = e.files.filter((s, o) => r[o]);
				return { ...e, files: i };
			}
			static async getFileType(e) {
				try {
					return (await fn.workspace.fs.stat(e)).type;
				} catch {
					return;
				}
			}
			static asMinimatchOptions(e) {
				let t = { dot: !0 };
				return (e?.ignoreCase === !0 && (t.nocase = !0), t);
			}
		},
		zo = class extends rr {
			constructor(e, t, r, i, s, o, a) {
				(super(e, t, r, i, s),
					(this._notificationType = r),
					(this._accessUri = o),
					(this._createParams = a));
			}
			async send(e) {
				let t = await this.filter(e, this._accessUri);
				if (t.files.length) {
					let r = async (i) =>
						this._client.sendNotification(this._notificationType, this._createParams(i));
					return this.doSend(t, r);
				}
			}
		},
		Vo = class extends zo {
			constructor() {
				(super(...arguments), (this._fsPathFileTypes = new Map()));
			}
			async getFileType(e) {
				let t = e.fsPath;
				if (this._fsPathFileTypes.has(t)) return this._fsPathFileTypes.get(t);
				let r = await rr.getFileType(e);
				return (r && this._fsPathFileTypes.set(t, r), r);
			}
			async cacheFileTypes(e, t) {
				await this.filter(e, t);
			}
			clearFileTypeCache() {
				this._fsPathFileTypes.clear();
			}
			unregister(e) {
				(super.unregister(e),
					this.filterSize() === 0 &&
						this._willListener &&
						(this._willListener.dispose(), (this._willListener = void 0)));
			}
			clear() {
				(super.clear(),
					this._willListener && (this._willListener.dispose(), (this._willListener = void 0)));
			}
		},
		Jl = class extends zo {
			constructor(e) {
				super(
					e,
					fn.workspace.onDidCreateFiles,
					nr.DidCreateFilesNotification.type,
					'didCreate',
					'didCreate',
					(t) => t,
					e.code2ProtocolConverter.asDidCreateFilesParams,
				);
			}
			doSend(e, t) {
				let r = this._client.middleware.workspace;
				return r?.didCreateFiles ? r.didCreateFiles(e, t) : t(e);
			}
		};
	Ht.DidCreateFilesFeature = Jl;
	var Ql = class extends Vo {
		constructor(e) {
			super(
				e,
				fn.workspace.onDidRenameFiles,
				nr.DidRenameFilesNotification.type,
				'didRename',
				'didRename',
				(t) => t.oldUri,
				e.code2ProtocolConverter.asDidRenameFilesParams,
			);
		}
		register(e) {
			(this._willListener ||
				(this._willListener = fn.workspace.onWillRenameFiles(this.willRename, this)),
				super.register(e));
		}
		willRename(e) {
			e.waitUntil(this.cacheFileTypes(e, (t) => t.oldUri));
		}
		doSend(e, t) {
			this.clearFileTypeCache();
			let r = this._client.middleware.workspace;
			return r?.didRenameFiles ? r.didRenameFiles(e, t) : t(e);
		}
	};
	Ht.DidRenameFilesFeature = Ql;
	var Yl = class extends Vo {
		constructor(e) {
			super(
				e,
				fn.workspace.onDidDeleteFiles,
				nr.DidDeleteFilesNotification.type,
				'didDelete',
				'didDelete',
				(t) => t,
				e.code2ProtocolConverter.asDidDeleteFilesParams,
			);
		}
		register(e) {
			(this._willListener ||
				(this._willListener = fn.workspace.onWillDeleteFiles(this.willDelete, this)),
				super.register(e));
		}
		willDelete(e) {
			e.waitUntil(this.cacheFileTypes(e, (t) => t));
		}
		doSend(e, t) {
			this.clearFileTypeCache();
			let r = this._client.middleware.workspace;
			return r?.didDeleteFiles ? r.didDeleteFiles(e, t) : t(e);
		}
	};
	Ht.DidDeleteFilesFeature = Yl;
	var os = class extends rr {
			constructor(e, t, r, i, s, o, a) {
				(super(e, t, r, i, s),
					(this._requestType = r),
					(this._accessUri = o),
					(this._createParams = a));
			}
			async send(e) {
				let t = this.waitUntil(e);
				e.waitUntil(t);
			}
			async waitUntil(e) {
				let t = await this.filter(e, this._accessUri);
				if (t.files.length) {
					let r = (i) =>
						this._client
							.sendRequest(this._requestType, this._createParams(i), i.token)
							.then(this._client.protocol2CodeConverter.asWorkspaceEdit);
					return this.doSend(t, r);
				} else return;
			}
		},
		Zl = class extends os {
			constructor(e) {
				super(
					e,
					fn.workspace.onWillCreateFiles,
					nr.WillCreateFilesRequest.type,
					'willCreate',
					'willCreate',
					(t) => t,
					e.code2ProtocolConverter.asWillCreateFilesParams,
				);
			}
			doSend(e, t) {
				let r = this._client.middleware.workspace;
				return r?.willCreateFiles ? r.willCreateFiles(e, t) : t(e);
			}
		};
	Ht.WillCreateFilesFeature = Zl;
	var ed = class extends os {
		constructor(e) {
			super(
				e,
				fn.workspace.onWillRenameFiles,
				nr.WillRenameFilesRequest.type,
				'willRename',
				'willRename',
				(t) => t.oldUri,
				e.code2ProtocolConverter.asWillRenameFilesParams,
			);
		}
		doSend(e, t) {
			let r = this._client.middleware.workspace;
			return r?.willRenameFiles ? r.willRenameFiles(e, t) : t(e);
		}
	};
	Ht.WillRenameFilesFeature = ed;
	var td = class extends os {
		constructor(e) {
			super(
				e,
				fn.workspace.onWillDeleteFiles,
				nr.WillDeleteFilesRequest.type,
				'willDelete',
				'willDelete',
				(t) => t,
				e.code2ProtocolConverter.asWillDeleteFilesParams,
			);
		}
		doSend(e, t) {
			let r = this._client.middleware.workspace;
			return r?.willDeleteFiles ? r.willDeleteFiles(e, t) : t(e);
		}
	};
	Ht.WillDeleteFilesFeature = td;
});
var Pv = E((Bo) => {
	'use strict';
	Object.defineProperty(Bo, '__esModule', { value: !0 });
	Bo.LinkedEditingFeature = void 0;
	var qw = require('vscode'),
		nd = ee(),
		rd = ye(),
		id = class extends rd.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, nd.LinkedEditingRangeRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, rd.ensure)((0, rd.ensure)(e, 'textDocument'), 'linkedEditingRange');
				t.dynamicRegistration = !0;
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.linkedEditingRangeProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideLinkedEditingRanges: (i, s, o) => {
							let a = this._client,
								u = (p, m, g) =>
									a
										.sendRequest(
											nd.LinkedEditingRangeRequest.type,
											a.code2ProtocolConverter.asTextDocumentPositionParams(p, m),
											g,
										)
										.then(
											(D) =>
												g.isCancellationRequested
													? null
													: a.protocol2CodeConverter.asLinkedEditingRanges(D, g),
											(D) => a.handleFailedRequest(nd.LinkedEditingRangeRequest.type, g, D, null),
										),
								l = a.middleware;
							return l.provideLinkedEditingRange
								? l.provideLinkedEditingRange(i, s, o, u)
								: u(i, s, o);
						},
					};
				return [this.registerProvider(t, r), r];
			}
			registerProvider(e, t) {
				return qw.languages.registerLinkedEditingRangeProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	Bo.LinkedEditingFeature = id;
});
var qv = E((Go) => {
	'use strict';
	Object.defineProperty(Go, '__esModule', { value: !0 });
	Go.TypeHierarchyFeature = void 0;
	var Ew = require('vscode'),
		Kr = ee(),
		sd = ye(),
		od = class {
			constructor(e) {
				((this.client = e), (this.middleware = e.middleware));
			}
			prepareTypeHierarchy(e, t, r) {
				let i = this.client,
					s = this.middleware,
					o = (a, u, l) => {
						let p = i.code2ProtocolConverter.asTextDocumentPositionParams(a, u);
						return i.sendRequest(Kr.TypeHierarchyPrepareRequest.type, p, l).then(
							(m) =>
								l.isCancellationRequested
									? null
									: i.protocol2CodeConverter.asTypeHierarchyItems(m, l),
							(m) => i.handleFailedRequest(Kr.TypeHierarchyPrepareRequest.type, l, m, null),
						);
					};
				return s.prepareTypeHierarchy ? s.prepareTypeHierarchy(e, t, r, o) : o(e, t, r);
			}
			provideTypeHierarchySupertypes(e, t) {
				let r = this.client,
					i = this.middleware,
					s = (o, a) => {
						let u = { item: r.code2ProtocolConverter.asTypeHierarchyItem(o) };
						return r.sendRequest(Kr.TypeHierarchySupertypesRequest.type, u, a).then(
							(l) =>
								a.isCancellationRequested
									? null
									: r.protocol2CodeConverter.asTypeHierarchyItems(l, a),
							(l) => r.handleFailedRequest(Kr.TypeHierarchySupertypesRequest.type, a, l, null),
						);
					};
				return i.provideTypeHierarchySupertypes
					? i.provideTypeHierarchySupertypes(e, t, s)
					: s(e, t);
			}
			provideTypeHierarchySubtypes(e, t) {
				let r = this.client,
					i = this.middleware,
					s = (o, a) => {
						let u = { item: r.code2ProtocolConverter.asTypeHierarchyItem(o) };
						return r.sendRequest(Kr.TypeHierarchySubtypesRequest.type, u, a).then(
							(l) =>
								a.isCancellationRequested
									? null
									: r.protocol2CodeConverter.asTypeHierarchyItems(l, a),
							(l) => r.handleFailedRequest(Kr.TypeHierarchySubtypesRequest.type, a, l, null),
						);
					};
				return i.provideTypeHierarchySubtypes ? i.provideTypeHierarchySubtypes(e, t, s) : s(e, t);
			}
		},
		ad = class extends sd.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Kr.TypeHierarchyPrepareRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, sd.ensure)((0, sd.ensure)(e, 'textDocument'), 'typeHierarchy');
				t.dynamicRegistration = !0;
			}
			initialize(e, t) {
				let [r, i] = this.getRegistration(t, e.typeHierarchyProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = this._client,
					r = new od(t);
				return [
					Ew.languages.registerTypeHierarchyProvider(
						t.protocol2CodeConverter.asDocumentSelector(e.documentSelector),
						r,
					),
					r,
				];
			}
		};
	Go.TypeHierarchyFeature = ad;
});
var kv = E((Jo) => {
	'use strict';
	Object.defineProperty(Jo, '__esModule', { value: !0 });
	Jo.InlineValueFeature = void 0;
	var Ev = require('vscode'),
		Xo = ee(),
		as = ye(),
		cd = class extends as.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Xo.InlineValueRequest.type);
			}
			fillClientCapabilities(e) {
				(((0, as.ensure)((0, as.ensure)(e, 'textDocument'), 'inlineValue').dynamicRegistration =
					!0),
					((0, as.ensure)((0, as.ensure)(e, 'workspace'), 'inlineValue').refreshSupport = !0));
			}
			initialize(e, t) {
				this._client.onRequest(Xo.InlineValueRefreshRequest.type, async () => {
					for (let s of this.getAllProviders()) s.onDidChangeInlineValues.fire();
				});
				let [r, i] = this.getRegistration(t, e.inlineValueProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = new Ev.EventEmitter(),
					i = {
						onDidChangeInlineValues: r.event,
						provideInlineValues: (s, o, a, u) => {
							let l = this._client,
								p = (g, D, y, P) => {
									let q = {
										textDocument: l.code2ProtocolConverter.asTextDocumentIdentifier(g),
										range: l.code2ProtocolConverter.asRange(D),
										context: l.code2ProtocolConverter.asInlineValueContext(y),
									};
									return l.sendRequest(Xo.InlineValueRequest.type, q, P).then(
										(N) =>
											P.isCancellationRequested
												? null
												: l.protocol2CodeConverter.asInlineValues(N, P),
										(N) => l.handleFailedRequest(Xo.InlineValueRequest.type, P, N, null),
									);
								},
								m = l.middleware;
							return m.provideInlineValues ? m.provideInlineValues(s, o, a, u, p) : p(s, o, a, u);
						},
					};
				return [this.registerProvider(t, i), { provider: i, onDidChangeInlineValues: r }];
			}
			registerProvider(e, t) {
				return Ev.languages.registerInlineValuesProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	Jo.InlineValueFeature = cd;
});
var Iv = E((Qo) => {
	'use strict';
	Object.defineProperty(Qo, '__esModule', { value: !0 });
	Qo.InlayHintsFeature = void 0;
	var xv = require('vscode'),
		Si = ee(),
		cs = ye(),
		ud = class extends cs.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, Si.InlayHintRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, cs.ensure)((0, cs.ensure)(e, 'textDocument'), 'inlayHint');
				((t.dynamicRegistration = !0),
					(t.resolveSupport = {
						properties: [
							'tooltip',
							'textEdits',
							'label.tooltip',
							'label.location',
							'label.command',
						],
					}),
					((0, cs.ensure)((0, cs.ensure)(e, 'workspace'), 'inlayHint').refreshSupport = !0));
			}
			initialize(e, t) {
				this._client.onRequest(Si.InlayHintRefreshRequest.type, async () => {
					for (let s of this.getAllProviders()) s.onDidChangeInlayHints.fire();
				});
				let [r, i] = this.getRegistration(t, e.inlayHintProvider);
				!r || !i || this.register({ id: r, registerOptions: i });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = new xv.EventEmitter(),
					i = {
						onDidChangeInlayHints: r.event,
						provideInlayHints: (s, o, a) => {
							let u = this._client,
								l = async (m, g, D) => {
									let y = {
										textDocument: u.code2ProtocolConverter.asTextDocumentIdentifier(m),
										range: u.code2ProtocolConverter.asRange(g),
									};
									try {
										let P = await u.sendRequest(Si.InlayHintRequest.type, y, D);
										return D.isCancellationRequested
											? null
											: u.protocol2CodeConverter.asInlayHints(P, D);
									} catch (P) {
										return u.handleFailedRequest(Si.InlayHintRequest.type, D, P, null);
									}
								},
								p = u.middleware;
							return p.provideInlayHints ? p.provideInlayHints(s, o, a, l) : l(s, o, a);
						},
					};
				return (
					(i.resolveInlayHint =
						e.resolveProvider === !0
							? (s, o) => {
									let a = this._client,
										u = async (p, m) => {
											try {
												let g = await a.sendRequest(
													Si.InlayHintResolveRequest.type,
													a.code2ProtocolConverter.asInlayHint(p),
													m,
												);
												if (m.isCancellationRequested) return null;
												let D = a.protocol2CodeConverter.asInlayHint(g, m);
												return m.isCancellationRequested ? null : D;
											} catch (g) {
												return a.handleFailedRequest(Si.InlayHintResolveRequest.type, m, g, null);
											}
										},
										l = a.middleware;
									return l.resolveInlayHint ? l.resolveInlayHint(s, o, u) : u(s, o);
								}
							: void 0),
					[this.registerProvider(t, i), { provider: i, onDidChangeInlayHints: r }]
				);
			}
			registerProvider(e, t) {
				return xv.languages.registerInlayHintsProvider(
					this._client.protocol2CodeConverter.asDocumentSelector(e),
					t,
				);
			}
		};
	Qo.InlayHintsFeature = ud;
});
var Ov = E((Yo) => {
	'use strict';
	Object.defineProperty(Yo, '__esModule', { value: !0 });
	Yo.InlineCompletionItemFeature = void 0;
	var kw = require('vscode'),
		ld = ee(),
		dd = ye(),
		xw = We(),
		fd = class extends dd.TextDocumentLanguageFeature {
			constructor(e) {
				super(e, ld.InlineCompletionRequest.type);
			}
			fillClientCapabilities(e) {
				let t = (0, dd.ensure)((0, dd.ensure)(e, 'textDocument'), 'inlineCompletion');
				t.dynamicRegistration = !0;
			}
			initialize(e, t) {
				let r = this.getRegistrationOptions(t, e.inlineCompletionProvider);
				r && this.register({ id: xw.generateUuid(), registerOptions: r });
			}
			registerLanguageProvider(e) {
				let t = e.documentSelector,
					r = {
						provideInlineCompletionItems: (i, s, o, a) => {
							let u = this._client,
								l = this._client.middleware,
								p = (m, g, D, y) =>
									u
										.sendRequest(
											ld.InlineCompletionRequest.type,
											u.code2ProtocolConverter.asInlineCompletionParams(m, g, D),
											y,
										)
										.then(
											(P) =>
												y.isCancellationRequested
													? null
													: u.protocol2CodeConverter.asInlineCompletionResult(P, y),
											(P) => u.handleFailedRequest(ld.InlineCompletionRequest.type, y, P, null),
										);
							return l.provideInlineCompletionItems
								? l.provideInlineCompletionItems(i, s, o, a, p)
								: p(i, s, o, a);
						},
					};
				return [
					kw.languages.registerInlineCompletionItemProvider(
						this._client.protocol2CodeConverter.asDocumentSelector(t),
						r,
					),
					r,
				];
			}
		};
	Yo.InlineCompletionItemFeature = fd;
});
var yd = E((ht) => {
	'use strict';
	Object.defineProperty(ht, '__esModule', { value: !0 });
	ht.ProposedFeatures =
		ht.BaseLanguageClient =
		ht.MessageTransports =
		ht.SuspendMode =
		ht.State =
		ht.CloseAction =
		ht.ErrorAction =
		ht.RevealOutputChannelOn =
			void 0;
	var qe = require('vscode'),
		A = ee(),
		Iw = um(),
		Ow = fm(),
		Tn = cn(),
		Zo = so(),
		Fv = We(),
		Fw = yu(),
		Sn = ye(),
		Nw = Lu(),
		Nv = Um(),
		Mv = zm(),
		Ti = Vm(),
		Mw = Bm(),
		Lw = Gm(),
		Aw = Xm(),
		jw = Qm(),
		$w = Ym(),
		Hw = cl(),
		Ww = ev(),
		Uw = tv(),
		Kw = nv(),
		zw = iv(),
		hd = sv(),
		Vw = av(),
		Bw = cv(),
		Gw = lv(),
		Xw = dv(),
		Jw = fv(),
		Qw = hv(),
		Yw = pv(),
		Zw = gv(),
		eD = vv(),
		tD = yv(),
		nD = Cv(),
		rD = _v(),
		iD = wv(),
		sD = Dv(),
		Pi = Tv(),
		oD = Pv(),
		aD = qv(),
		cD = kv(),
		uD = Iv(),
		lD = Ov(),
		zr;
	(function (n) {
		((n[(n.Debug = 0)] = 'Debug'),
			(n[(n.Info = 1)] = 'Info'),
			(n[(n.Warn = 2)] = 'Warn'),
			(n[(n.Error = 3)] = 'Error'),
			(n[(n.Never = 4)] = 'Never'));
	})(zr || (ht.RevealOutputChannelOn = zr = {}));
	var ls;
	(function (n) {
		((n[(n.Continue = 1)] = 'Continue'), (n[(n.Shutdown = 2)] = 'Shutdown'));
	})(ls || (ht.ErrorAction = ls = {}));
	var Pr;
	(function (n) {
		((n[(n.DoNotRestart = 1)] = 'DoNotRestart'), (n[(n.Restart = 2)] = 'Restart'));
	})(Pr || (ht.CloseAction = Pr = {}));
	var us;
	(function (n) {
		((n[(n.Stopped = 1)] = 'Stopped'),
			(n[(n.Starting = 3)] = 'Starting'),
			(n[(n.Running = 2)] = 'Running'));
	})(us || (ht.State = us = {}));
	var Lv;
	(function (n) {
		((n.off = 'off'), (n.on = 'on'));
	})(Lv || (ht.SuspendMode = Lv = {}));
	var pd;
	(function (n) {
		function e(t) {
			return t == null
				? !1
				: typeof t == 'boolean' ||
					  (typeof t == 'object' && t !== null && Tn.stringArray(t.enabledCommands))
					? t
					: !1;
		}
		n.sanitizeIsTrusted = e;
	})(pd || (pd = {}));
	var gd = class {
			constructor(e, t) {
				((this.client = e), (this.maxRestartCount = t), (this.restarts = []));
			}
			error(e, t, r) {
				return r && r <= 3 ? { action: ls.Continue } : { action: ls.Shutdown };
			}
			closed() {
				return (
					this.restarts.push(Date.now()),
					this.restarts.length <= this.maxRestartCount
						? { action: Pr.Restart }
						: this.restarts[this.restarts.length - 1] - this.restarts[0] <= 3 * 60 * 1e3
							? {
									action: Pr.DoNotRestart,
									message: `The ${this.client.name} server crashed ${this.maxRestartCount + 1} times in the last 3 minutes. The server will not be restarted. See the output for more information.`,
								}
							: (this.restarts.shift(), { action: Pr.Restart })
				);
			}
		},
		ue;
	(function (n) {
		((n.Initial = 'initial'),
			(n.Starting = 'starting'),
			(n.StartFailed = 'startFailed'),
			(n.Running = 'running'),
			(n.Stopping = 'stopping'),
			(n.Stopped = 'stopped'));
	})(ue || (ue = {}));
	var Av;
	(function (n) {
		function e(t) {
			return t && A.MessageReader.is(t.reader) && A.MessageWriter.is(t.writer);
		}
		n.is = e;
	})(Av || (ht.MessageTransports = Av = {}));
	var ir = class {
		constructor(e, t, r) {
			((this._traceFormat = A.TraceFormat.Text),
				(this._diagnosticQueue = new Map()),
				(this._diagnosticQueueState = { state: 'idle' }),
				(this._features = []),
				(this._dynamicFeatures = new Map()),
				(this.workspaceEditLock = new Zo.Semaphore(1)),
				(this._id = e),
				(this._name = t),
				(r = r || {}));
			let i = { isTrusted: !1, supportHtml: !1 };
			(r.markdown !== void 0 &&
				((i.isTrusted = pd.sanitizeIsTrusted(r.markdown.isTrusted)),
				(i.supportHtml = r.markdown.supportHtml === !0)),
				(this._clientOptions = {
					documentSelector: r.documentSelector ?? [],
					synchronize: r.synchronize ?? {},
					diagnosticCollectionName: r.diagnosticCollectionName,
					outputChannelName: r.outputChannelName ?? this._name,
					revealOutputChannelOn: r.revealOutputChannelOn ?? zr.Error,
					stdioEncoding: r.stdioEncoding ?? 'utf8',
					initializationOptions: r.initializationOptions,
					initializationFailedHandler: r.initializationFailedHandler,
					progressOnInitialization: !!r.progressOnInitialization,
					errorHandler:
						r.errorHandler ?? this.createDefaultErrorHandler(r.connectionOptions?.maxRestartCount),
					middleware: r.middleware ?? {},
					uriConverters: r.uriConverters,
					workspaceFolder: r.workspaceFolder,
					connectionOptions: r.connectionOptions,
					markdown: i,
					diagnosticPullOptions: r.diagnosticPullOptions ?? { onChange: !0, onSave: !1 },
					notebookDocumentOptions: r.notebookDocumentOptions ?? {},
				}),
				(this._clientOptions.synchronize = this._clientOptions.synchronize || {}),
				(this._state = ue.Initial),
				(this._ignoredRegistrations = new Set()),
				(this._listeners = []),
				(this._notificationHandlers = new Map()),
				(this._pendingNotificationHandlers = new Map()),
				(this._notificationDisposables = new Map()),
				(this._requestHandlers = new Map()),
				(this._pendingRequestHandlers = new Map()),
				(this._requestDisposables = new Map()),
				(this._progressHandlers = new Map()),
				(this._pendingProgressHandlers = new Map()),
				(this._progressDisposables = new Map()),
				(this._connection = void 0),
				(this._initializeResult = void 0),
				r.outputChannel
					? ((this._outputChannel = r.outputChannel), (this._disposeOutputChannel = !1))
					: ((this._outputChannel = void 0), (this._disposeOutputChannel = !0)),
				(this._traceOutputChannel = r.traceOutputChannel),
				(this._diagnostics = void 0),
				(this._pendingOpenNotifications = new Set()),
				(this._pendingChangeSemaphore = new Zo.Semaphore(1)),
				(this._pendingChangeDelayer = new Zo.Delayer(250)),
				(this._fileEvents = []),
				(this._fileEventDelayer = new Zo.Delayer(250)),
				(this._onStop = void 0),
				(this._telemetryEmitter = new A.Emitter()),
				(this._stateChangeEmitter = new A.Emitter()),
				(this._trace = A.Trace.Off),
				(this._tracer = {
					log: (s, o) => {
						Tn.string(s) ? this.logTrace(s, o) : this.logObjectTrace(s);
					},
				}),
				(this._c2p = Iw.createConverter(r.uriConverters ? r.uriConverters.code2Protocol : void 0)),
				(this._p2c = Ow.createConverter(
					r.uriConverters ? r.uriConverters.protocol2Code : void 0,
					this._clientOptions.markdown.isTrusted,
					this._clientOptions.markdown.supportHtml,
				)),
				(this._syncedDocuments = new Map()),
				this.registerBuiltinFeatures());
		}
		get name() {
			return this._name;
		}
		get middleware() {
			return this._clientOptions.middleware ?? Object.create(null);
		}
		get clientOptions() {
			return this._clientOptions;
		}
		get protocol2CodeConverter() {
			return this._p2c;
		}
		get code2ProtocolConverter() {
			return this._c2p;
		}
		get onTelemetry() {
			return this._telemetryEmitter.event;
		}
		get onDidChangeState() {
			return this._stateChangeEmitter.event;
		}
		get outputChannel() {
			return (
				this._outputChannel ||
					(this._outputChannel = qe.window.createOutputChannel(
						this._clientOptions.outputChannelName
							? this._clientOptions.outputChannelName
							: this._name,
					)),
				this._outputChannel
			);
		}
		get traceOutputChannel() {
			return this._traceOutputChannel ? this._traceOutputChannel : this.outputChannel;
		}
		get diagnostics() {
			return this._diagnostics;
		}
		get state() {
			return this.getPublicState();
		}
		get $state() {
			return this._state;
		}
		set $state(e) {
			let t = this.getPublicState();
			this._state = e;
			let r = this.getPublicState();
			r !== t && this._stateChangeEmitter.fire({ oldState: t, newState: r });
		}
		getPublicState() {
			switch (this.$state) {
				case ue.Starting:
					return us.Starting;
				case ue.Running:
					return us.Running;
				default:
					return us.Stopped;
			}
		}
		get initializeResult() {
			return this._initializeResult;
		}
		async sendRequest(e, ...t) {
			if (
				this.$state === ue.StartFailed ||
				this.$state === ue.Stopping ||
				this.$state === ue.Stopped
			)
				return Promise.reject(
					new A.ResponseError(A.ErrorCodes.ConnectionInactive, 'Client is not running'),
				);
			let r = await this.$start();
			this._didChangeTextDocumentFeature.syncKind === A.TextDocumentSyncKind.Full &&
				(await this.sendPendingFullTextDocumentChanges(r));
			let i = this._clientOptions.middleware?.sendRequest;
			if (i !== void 0) {
				let s, o;
				return (
					t.length === 1
						? A.CancellationToken.is(t[0])
							? (o = t[0])
							: (s = t[0])
						: t.length === 2 && ((s = t[0]), (o = t[1])),
					i(e, s, o, (a, u, l) => {
						let p = [];
						return (u !== void 0 && p.push(u), l !== void 0 && p.push(l), r.sendRequest(a, ...p));
					})
				);
			} else return r.sendRequest(e, ...t);
		}
		onRequest(e, t) {
			let r = typeof e == 'string' ? e : e.method;
			this._requestHandlers.set(r, t);
			let i = this.activeConnection(),
				s;
			return (
				i !== void 0
					? (this._requestDisposables.set(r, i.onRequest(e, t)),
						(s = {
							dispose: () => {
								let o = this._requestDisposables.get(r);
								o !== void 0 && (o.dispose(), this._requestDisposables.delete(r));
							},
						}))
					: (this._pendingRequestHandlers.set(r, t),
						(s = {
							dispose: () => {
								this._pendingRequestHandlers.delete(r);
								let o = this._requestDisposables.get(r);
								o !== void 0 && (o.dispose(), this._requestDisposables.delete(r));
							},
						})),
				{
					dispose: () => {
						(this._requestHandlers.delete(r), s.dispose());
					},
				}
			);
		}
		async sendNotification(e, t) {
			if (
				this.$state === ue.StartFailed ||
				this.$state === ue.Stopping ||
				this.$state === ue.Stopped
			)
				return Promise.reject(
					new A.ResponseError(A.ErrorCodes.ConnectionInactive, 'Client is not running'),
				);
			let r = this._didChangeTextDocumentFeature.syncKind === A.TextDocumentSyncKind.Full,
				i;
			r &&
				typeof e != 'string' &&
				e.method === A.DidOpenTextDocumentNotification.method &&
				((i = t?.textDocument.uri), this._pendingOpenNotifications.add(i));
			let s = await this.$start();
			(r && (await this.sendPendingFullTextDocumentChanges(s)),
				i !== void 0 && this._pendingOpenNotifications.delete(i));
			let o = this._clientOptions.middleware?.sendNotification;
			return o ? o(e, s.sendNotification.bind(s), t) : s.sendNotification(e, t);
		}
		onNotification(e, t) {
			let r = typeof e == 'string' ? e : e.method;
			this._notificationHandlers.set(r, t);
			let i = this.activeConnection(),
				s;
			return (
				i !== void 0
					? (this._notificationDisposables.set(r, i.onNotification(e, t)),
						(s = {
							dispose: () => {
								let o = this._notificationDisposables.get(r);
								o !== void 0 && (o.dispose(), this._notificationDisposables.delete(r));
							},
						}))
					: (this._pendingNotificationHandlers.set(r, t),
						(s = {
							dispose: () => {
								this._pendingNotificationHandlers.delete(r);
								let o = this._notificationDisposables.get(r);
								o !== void 0 && (o.dispose(), this._notificationDisposables.delete(r));
							},
						})),
				{
					dispose: () => {
						(this._notificationHandlers.delete(r), s.dispose());
					},
				}
			);
		}
		async sendProgress(e, t, r) {
			if (
				this.$state === ue.StartFailed ||
				this.$state === ue.Stopping ||
				this.$state === ue.Stopped
			)
				return Promise.reject(
					new A.ResponseError(A.ErrorCodes.ConnectionInactive, 'Client is not running'),
				);
			try {
				return (await this.$start()).sendProgress(e, t, r);
			} catch (i) {
				throw (this.error(`Sending progress for token ${t} failed.`, i), i);
			}
		}
		onProgress(e, t, r) {
			this._progressHandlers.set(t, { type: e, handler: r });
			let i = this.activeConnection(),
				s,
				o = this._clientOptions.middleware?.handleWorkDoneProgress,
				a =
					A.WorkDoneProgress.is(e) && o !== void 0
						? (u) => {
								o(t, u, () => r(u));
							}
						: r;
			return (
				i !== void 0
					? (this._progressDisposables.set(t, i.onProgress(e, t, a)),
						(s = {
							dispose: () => {
								let u = this._progressDisposables.get(t);
								u !== void 0 && (u.dispose(), this._progressDisposables.delete(t));
							},
						}))
					: (this._pendingProgressHandlers.set(t, { type: e, handler: r }),
						(s = {
							dispose: () => {
								this._pendingProgressHandlers.delete(t);
								let u = this._progressDisposables.get(t);
								u !== void 0 && (u.dispose(), this._progressDisposables.delete(t));
							},
						})),
				{
					dispose: () => {
						(this._progressHandlers.delete(t), s.dispose());
					},
				}
			);
		}
		createDefaultErrorHandler(e) {
			if (e !== void 0 && e < 0) throw new Error(`Invalid maxRestartCount: ${e}`);
			return new gd(this, e ?? 4);
		}
		async setTrace(e) {
			this._trace = e;
			let t = this.activeConnection();
			t !== void 0 &&
				(await t.trace(this._trace, this._tracer, {
					sendNotification: !1,
					traceFormat: this._traceFormat,
				}));
		}
		data2String(e) {
			if (e instanceof A.ResponseError) {
				let t = e;
				return `  Message: ${t.message}
  Code: ${t.code} ${
		t.data
			? `
` + t.data.toString()
			: ''
	}`;
			}
			return e instanceof Error
				? Tn.string(e.stack)
					? e.stack
					: e.message
				: Tn.string(e)
					? e
					: e.toString();
		}
		debug(e, t, r = !0) {
			this.logOutputMessage(A.MessageType.Debug, zr.Debug, 'Debug', e, t, r);
		}
		info(e, t, r = !0) {
			this.logOutputMessage(A.MessageType.Info, zr.Info, 'Info', e, t, r);
		}
		warn(e, t, r = !0) {
			this.logOutputMessage(A.MessageType.Warning, zr.Warn, 'Warn', e, t, r);
		}
		error(e, t, r = !0) {
			this.logOutputMessage(A.MessageType.Error, zr.Error, 'Error', e, t, r);
		}
		logOutputMessage(e, t, r, i, s, o) {
			(this.outputChannel.appendLine(`[${r.padEnd(5)} - ${new Date().toLocaleTimeString()}] ${i}`),
				s != null && this.outputChannel.appendLine(this.data2String(s)),
				(o === 'force' || (o && this._clientOptions.revealOutputChannelOn <= t)) &&
					this.showNotificationMessage(e, i));
		}
		showNotificationMessage(e, t) {
			((t = t ?? 'A request has failed. See the output for more information.'),
				(e === A.MessageType.Error
					? qe.window.showErrorMessage
					: e === A.MessageType.Warning
						? qe.window.showWarningMessage
						: qe.window.showInformationMessage)(t, 'Go to output').then((i) => {
					i !== void 0 && this.outputChannel.show(!0);
				}));
		}
		logTrace(e, t) {
			(this.traceOutputChannel.appendLine(`[Trace - ${new Date().toLocaleTimeString()}] ${e}`),
				t && this.traceOutputChannel.appendLine(this.data2String(t)));
		}
		logObjectTrace(e) {
			(e.isLSPMessage && e.type
				? this.traceOutputChannel.append(`[LSP   - ${new Date().toLocaleTimeString()}] `)
				: this.traceOutputChannel.append(`[Trace - ${new Date().toLocaleTimeString()}] `),
				e && this.traceOutputChannel.appendLine(`${JSON.stringify(e)}`));
		}
		needsStart() {
			return (
				this.$state === ue.Initial || this.$state === ue.Stopping || this.$state === ue.Stopped
			);
		}
		needsStop() {
			return this.$state === ue.Starting || this.$state === ue.Running;
		}
		activeConnection() {
			return this.$state === ue.Running && this._connection !== void 0 ? this._connection : void 0;
		}
		isRunning() {
			return this.$state === ue.Running;
		}
		async start() {
			if (this._disposed === 'disposing' || this._disposed === 'disposed')
				throw new Error("Client got disposed and can't be restarted.");
			if (this.$state === ue.Stopping)
				throw new Error('Client is currently stopping. Can only restart a full stopped client');
			if (this._onStart !== void 0) return this._onStart;
			let [e, t, r] = this.createOnStartPromise();
			((this._onStart = e),
				this._diagnostics === void 0 &&
					(this._diagnostics = this._clientOptions.diagnosticCollectionName
						? qe.languages.createDiagnosticCollection(this._clientOptions.diagnosticCollectionName)
						: qe.languages.createDiagnosticCollection()));
			for (let [i, s] of this._notificationHandlers)
				this._pendingNotificationHandlers.has(i) || this._pendingNotificationHandlers.set(i, s);
			for (let [i, s] of this._requestHandlers)
				this._pendingRequestHandlers.has(i) || this._pendingRequestHandlers.set(i, s);
			for (let [i, s] of this._progressHandlers)
				this._pendingProgressHandlers.has(i) || this._pendingProgressHandlers.set(i, s);
			this.$state = ue.Starting;
			try {
				let i = await this.createConnection();
				(i.onNotification(A.LogMessageNotification.type, (s) => {
					switch (s.type) {
						case A.MessageType.Error:
							this.error(s.message, void 0, !1);
							break;
						case A.MessageType.Warning:
							this.warn(s.message, void 0, !1);
							break;
						case A.MessageType.Info:
							this.info(s.message, void 0, !1);
							break;
						case A.MessageType.Debug:
							this.debug(s.message, void 0, !1);
							break;
						default:
							this.outputChannel.appendLine(s.message);
					}
				}),
					i.onNotification(A.ShowMessageNotification.type, (s) => {
						switch (s.type) {
							case A.MessageType.Error:
								qe.window.showErrorMessage(s.message);
								break;
							case A.MessageType.Warning:
								qe.window.showWarningMessage(s.message);
								break;
							case A.MessageType.Info:
								qe.window.showInformationMessage(s.message);
								break;
							default:
								qe.window.showInformationMessage(s.message);
						}
					}),
					i.onRequest(A.ShowMessageRequest.type, (s) => {
						let o;
						switch (s.type) {
							case A.MessageType.Error:
								o = qe.window.showErrorMessage;
								break;
							case A.MessageType.Warning:
								o = qe.window.showWarningMessage;
								break;
							case A.MessageType.Info:
								o = qe.window.showInformationMessage;
								break;
							default:
								o = qe.window.showInformationMessage;
						}
						let a = s.actions || [];
						return o(s.message, ...a);
					}),
					i.onNotification(A.TelemetryEventNotification.type, (s) => {
						this._telemetryEmitter.fire(s);
					}),
					i.onRequest(A.ShowDocumentRequest.type, async (s) => {
						let o = async (u) => {
								let l = this.protocol2CodeConverter.asUri(u.uri);
								try {
									if (u.external === !0) return { success: await qe.env.openExternal(l) };
									{
										let p = {};
										return (
											u.selection !== void 0 &&
												(p.selection = this.protocol2CodeConverter.asRange(u.selection)),
											u.takeFocus === void 0 || u.takeFocus === !1
												? (p.preserveFocus = !0)
												: u.takeFocus === !0 && (p.preserveFocus = !1),
											await qe.window.showTextDocument(l, p),
											{ success: !0 }
										);
									}
								} catch {
									return { success: !1 };
								}
							},
							a = this._clientOptions.middleware.window?.showDocument;
						return a !== void 0 ? a(s, o) : o(s);
					}),
					i.listen(),
					await this.initialize(i),
					t());
			} catch (i) {
				((this.$state = ue.StartFailed),
					this.error(`${this._name} client: couldn't create connection to server.`, i, 'force'),
					r(i));
			}
			return this._onStart;
		}
		createOnStartPromise() {
			let e, t;
			return [
				new Promise((i, s) => {
					((e = i), (t = s));
				}),
				e,
				t,
			];
		}
		async initialize(e) {
			this.refreshTrace(e, !1);
			let t = this._clientOptions.initializationOptions,
				[r, i] =
					this._clientOptions.workspaceFolder !== void 0
						? [
								this._clientOptions.workspaceFolder.uri.fsPath,
								[
									{
										uri: this._c2p.asUri(this._clientOptions.workspaceFolder.uri),
										name: this._clientOptions.workspaceFolder.name,
									},
								],
							]
						: [this._clientGetRootPath(), null],
				s = {
					processId: null,
					clientInfo: { name: qe.env.appName, version: qe.version },
					locale: this.getLocale(),
					rootPath: r || null,
					rootUri: r ? this._c2p.asUri(qe.Uri.file(r)) : null,
					capabilities: this.computeClientCapabilities(),
					initializationOptions: Tn.func(t) ? t() : t,
					trace: A.Trace.toString(this._trace),
					workspaceFolders: i,
				};
			if ((this.fillInitializeParams(s), this._clientOptions.progressOnInitialization)) {
				let o = Fv.generateUuid(),
					a = new Fw.ProgressPart(e, o);
				s.workDoneToken = o;
				try {
					let u = await this.doInitialize(e, s);
					return (a.done(), u);
				} catch (u) {
					throw (a.cancel(), u);
				}
			} else return this.doInitialize(e, s);
		}
		async doInitialize(e, t) {
			try {
				let r = await e.initialize(t);
				if (
					r.capabilities.positionEncoding !== void 0 &&
					r.capabilities.positionEncoding !== A.PositionEncodingKind.UTF16
				)
					throw new Error(
						`Unsupported position encoding (${r.capabilities.positionEncoding}) received from server ${this.name}`,
					);
				((this._initializeResult = r), (this.$state = ue.Running));
				let i;
				(Tn.number(r.capabilities.textDocumentSync)
					? r.capabilities.textDocumentSync === A.TextDocumentSyncKind.None
						? (i = { openClose: !1, change: A.TextDocumentSyncKind.None, save: void 0 })
						: (i = {
								openClose: !0,
								change: r.capabilities.textDocumentSync,
								save: { includeText: !1 },
							})
					: r.capabilities.textDocumentSync !== void 0 &&
						r.capabilities.textDocumentSync !== null &&
						(i = r.capabilities.textDocumentSync),
					(this._capabilities = Object.assign({}, r.capabilities, { resolvedTextDocumentSync: i })),
					e.onNotification(A.PublishDiagnosticsNotification.type, (s) => this.handleDiagnostics(s)),
					e.onRequest(A.RegistrationRequest.type, (s) => this.handleRegistrationRequest(s)),
					e.onRequest('client/registerFeature', (s) => this.handleRegistrationRequest(s)),
					e.onRequest(A.UnregistrationRequest.type, (s) => this.handleUnregistrationRequest(s)),
					e.onRequest('client/unregisterFeature', (s) => this.handleUnregistrationRequest(s)),
					e.onRequest(A.ApplyWorkspaceEditRequest.type, (s) => this.handleApplyWorkspaceEdit(s)));
				for (let [s, o] of this._pendingNotificationHandlers)
					this._notificationDisposables.set(s, e.onNotification(s, o));
				this._pendingNotificationHandlers.clear();
				for (let [s, o] of this._pendingRequestHandlers)
					this._requestDisposables.set(s, e.onRequest(s, o));
				this._pendingRequestHandlers.clear();
				for (let [s, o] of this._pendingProgressHandlers)
					this._progressDisposables.set(s, e.onProgress(o.type, s, o.handler));
				return (
					this._pendingProgressHandlers.clear(),
					await e.sendNotification(A.InitializedNotification.type, {}),
					this.hookFileEvents(e),
					this.hookConfigurationChanged(e),
					this.initializeFeatures(e),
					r
				);
			} catch (r) {
				throw (
					this._clientOptions.initializationFailedHandler
						? this._clientOptions.initializationFailedHandler(r)
							? this.initialize(e)
							: this.stop()
						: r instanceof A.ResponseError && r.data && r.data.retry
							? qe.window.showErrorMessage(r.message, { title: 'Retry', id: 'retry' }).then((i) => {
									i && i.id === 'retry' ? this.initialize(e) : this.stop();
								})
							: (r && r.message && qe.window.showErrorMessage(r.message),
								this.error('Server initialization failed.', r),
								this.stop()),
					r
				);
			}
		}
		_clientGetRootPath() {
			let e = qe.workspace.workspaceFolders;
			if (!e || e.length === 0) return;
			let t = e[0];
			if (t.uri.scheme === 'file') return t.uri.fsPath;
		}
		stop(e = 2e3) {
			return this.shutdown('stop', e);
		}
		dispose(e = 2e3) {
			try {
				return ((this._disposed = 'disposing'), this.stop(e));
			} finally {
				this._disposed = 'disposed';
			}
		}
		async shutdown(e, t) {
			if (this.$state === ue.Stopped || this.$state === ue.Initial) return;
			if (this.$state === ue.Stopping) {
				if (this._onStop !== void 0) return this._onStop;
				throw new Error('Client is stopping but no stop promise available.');
			}
			let r = this.activeConnection();
			if (r === void 0 || this.$state !== ue.Running)
				throw new Error(
					`Client is not running and can't be stopped. It's current state is: ${this.$state}`,
				);
			((this._initializeResult = void 0), (this.$state = ue.Stopping), this.cleanUp(e));
			let i = new Promise((o) => {
					(0, A.RAL)().timer.setTimeout(o, t);
				}),
				s = (async (o) => (await o.shutdown(), await o.exit(), o))(r);
			return (this._onStop = Promise.race([i, s])
				.then(
					(o) => {
						if (o !== void 0) (o.end(), o.dispose());
						else
							throw (
								this.error('Stopping server timed out', void 0, !1),
								new Error('Stopping the server timed out')
							);
					},
					(o) => {
						throw (this.error('Stopping server failed', o, !1), o);
					},
				)
				.finally(() => {
					((this.$state = ue.Stopped),
						e === 'stop' && this.cleanUpChannel(),
						(this._onStart = void 0),
						(this._onStop = void 0),
						(this._connection = void 0),
						this._ignoredRegistrations.clear());
				}));
		}
		cleanUp(e) {
			((this._fileEvents = []), this._fileEventDelayer.cancel());
			let t = this._listeners.splice(0, this._listeners.length);
			for (let r of t) r.dispose();
			this._syncedDocuments && this._syncedDocuments.clear();
			for (let r of Array.from(this._features.entries())
				.map((i) => i[1])
				.reverse())
				r.clear();
			(e === 'stop' &&
				this._diagnostics !== void 0 &&
				(this._diagnostics.dispose(), (this._diagnostics = void 0)),
				this._idleInterval !== void 0 &&
					(this._idleInterval.dispose(), (this._idleInterval = void 0)));
		}
		cleanUpChannel() {
			this._outputChannel !== void 0 &&
				this._disposeOutputChannel &&
				(this._outputChannel.dispose(), (this._outputChannel = void 0));
		}
		notifyFileEvent(e) {
			let t = this;
			async function r(s) {
				return (
					t._fileEvents.push(s),
					t._fileEventDelayer.trigger(async () => {
						(await t.sendNotification(A.DidChangeWatchedFilesNotification.type, {
							changes: t._fileEvents,
						}),
							(t._fileEvents = []));
					})
				);
			}
			let i = this.clientOptions.middleware?.workspace;
			(i?.didChangeWatchedFile ? i.didChangeWatchedFile(e, r) : r(e)).catch((s) => {
				t.error('Notify file events failed.', s);
			});
		}
		async sendPendingFullTextDocumentChanges(e) {
			return this._pendingChangeSemaphore.lock(async () => {
				try {
					let t = this._didChangeTextDocumentFeature.getPendingDocumentChanges(
						this._pendingOpenNotifications,
					);
					if (t.length === 0) return;
					for (let r of t) {
						let i = this.code2ProtocolConverter.asChangeTextDocumentParams(r);
						(await e.sendNotification(A.DidChangeTextDocumentNotification.type, i),
							this._didChangeTextDocumentFeature.notificationSent(
								r,
								A.DidChangeTextDocumentNotification.type,
								i,
							));
					}
				} catch (t) {
					throw (this.error('Sending pending changes failed', t, !1), t);
				}
			});
		}
		triggerPendingChangeDelivery() {
			this._pendingChangeDelayer
				.trigger(async () => {
					let e = this.activeConnection();
					if (e === void 0) {
						this.triggerPendingChangeDelivery();
						return;
					}
					await this.sendPendingFullTextDocumentChanges(e);
				})
				.catch((e) => this.error('Delivering pending changes failed', e, !1));
		}
		handleDiagnostics(e) {
			if (!this._diagnostics) return;
			let t = e.uri;
			(this._diagnosticQueueState.state === 'busy' &&
				this._diagnosticQueueState.document === t &&
				this._diagnosticQueueState.tokenSource.cancel(),
				this._diagnosticQueue.set(e.uri, e.diagnostics),
				this.triggerDiagnosticQueue());
		}
		triggerDiagnosticQueue() {
			(0, A.RAL)().timer.setImmediate(() => {
				this.workDiagnosticQueue();
			});
		}
		workDiagnosticQueue() {
			if (this._diagnosticQueueState.state === 'busy') return;
			let e = this._diagnosticQueue.entries().next();
			if (e.done === !0) return;
			let [t, r] = e.value;
			this._diagnosticQueue.delete(t);
			let i = new qe.CancellationTokenSource();
			((this._diagnosticQueueState = { state: 'busy', document: t, tokenSource: i }),
				this._p2c
					.asDiagnostics(r, i.token)
					.then((s) => {
						if (!i.token.isCancellationRequested) {
							let o = this._p2c.asUri(t),
								a = this.clientOptions.middleware;
							a.handleDiagnostics
								? a.handleDiagnostics(o, s, (u, l) => this.setDiagnostics(u, l))
								: this.setDiagnostics(o, s);
						}
					})
					.finally(() => {
						((this._diagnosticQueueState = { state: 'idle' }), this.triggerDiagnosticQueue());
					}));
		}
		setDiagnostics(e, t) {
			this._diagnostics && this._diagnostics.set(e, t);
		}
		getLocale() {
			return qe.env.language;
		}
		async $start() {
			if (this.$state === ue.StartFailed)
				throw new Error("Previous start failed. Can't restart server.");
			await this.start();
			let e = this.activeConnection();
			if (e === void 0) throw new Error('Starting server failed');
			return e;
		}
		async createConnection() {
			let e = (i, s, o) => {
					this.handleConnectionError(i, s, o).catch((a) =>
						this.error('Handling connection error failed', a),
					);
				},
				t = () => {
					this.handleConnectionClosed().catch((i) =>
						this.error('Handling connection close failed', i),
					);
				},
				r = await this.createMessageTransports(this._clientOptions.stdioEncoding || 'utf8');
			return (
				(this._connection = dD(r.reader, r.writer, e, t, this._clientOptions.connectionOptions)),
				this._connection
			);
		}
		async handleConnectionClosed() {
			if (this.$state === ue.Stopped) return;
			try {
				this._connection !== void 0 && this._connection.dispose();
			} catch {}
			let e = { action: Pr.DoNotRestart };
			if (this.$state !== ue.Stopping)
				try {
					e = await this._clientOptions.errorHandler.closed();
				} catch {}
			((this._connection = void 0),
				e.action === Pr.DoNotRestart
					? (this.error(
							e.message ?? 'Connection to server got closed. Server will not be restarted.',
							void 0,
							e.handled === !0 ? !1 : 'force',
						),
						this.cleanUp('stop'),
						this.$state === ue.Starting
							? (this.$state = ue.StartFailed)
							: (this.$state = ue.Stopped),
						(this._onStop = Promise.resolve()),
						(this._onStart = void 0))
					: e.action === Pr.Restart &&
						(this.info(
							e.message ?? 'Connection to server got closed. Server will restart.',
							!e.handled,
						),
						this.cleanUp('restart'),
						(this.$state = ue.Initial),
						(this._onStop = Promise.resolve()),
						(this._onStart = void 0),
						this.start().catch((t) => this.error('Restarting server failed', t, 'force'))));
		}
		async handleConnectionError(e, t, r) {
			let i = await this._clientOptions.errorHandler.error(e, t, r);
			i.action === ls.Shutdown
				? (this.error(
						i.message ??
							`Client ${this._name}: connection to server is erroring.
${e.message}
Shutting down server.`,
						void 0,
						i.handled === !0 ? !1 : 'force',
					),
					this.stop().catch((s) => {
						this.error('Stopping server failed', s, !1);
					}))
				: this.error(
						i.message ??
							`Client ${this._name}: connection to server is erroring.
${e.message}`,
						void 0,
						i.handled === !0 ? !1 : 'force',
					);
		}
		hookConfigurationChanged(e) {
			this._listeners.push(
				qe.workspace.onDidChangeConfiguration(() => {
					this.refreshTrace(e, !0);
				}),
			);
		}
		refreshTrace(e, t = !1) {
			let r = qe.workspace.getConfiguration(this._id),
				i = A.Trace.Off,
				s = A.TraceFormat.Text;
			if (r) {
				let o = r.get('trace.server', 'off');
				typeof o == 'string'
					? (i = A.Trace.fromString(o))
					: ((i = A.Trace.fromString(r.get('trace.server.verbosity', 'off'))),
						(s = A.TraceFormat.fromString(r.get('trace.server.format', 'text'))));
			}
			((this._trace = i),
				(this._traceFormat = s),
				e
					.trace(this._trace, this._tracer, { sendNotification: t, traceFormat: this._traceFormat })
					.catch((o) => {
						this.error('Updating trace failed with error', o, !1);
					}));
		}
		hookFileEvents(e) {
			let t = this._clientOptions.synchronize.fileEvents;
			if (!t) return;
			let r;
			(Tn.array(t) ? (r = t) : (r = [t]),
				r &&
					this._dynamicFeatures
						.get(A.DidChangeWatchedFilesNotification.type.method)
						.registerRaw(Fv.generateUuid(), r));
		}
		registerFeatures(e) {
			for (let t of e) this.registerFeature(t);
		}
		registerFeature(e) {
			if ((this._features.push(e), Sn.DynamicFeature.is(e))) {
				let t = e.registrationType;
				this._dynamicFeatures.set(t.method, e);
			}
		}
		getFeature(e) {
			return this._dynamicFeatures.get(e);
		}
		hasDedicatedTextSynchronizationFeature(e) {
			let t = this.getFeature(A.NotebookDocumentSyncRegistrationType.method);
			return t === void 0 || !(t instanceof Nv.NotebookDocumentSyncFeature) ? !1 : t.handles(e);
		}
		registerBuiltinFeatures() {
			let e = new Map();
			(this.registerFeature(new Mv.ConfigurationFeature(this)),
				this.registerFeature(new Ti.DidOpenTextDocumentFeature(this, this._syncedDocuments)),
				(this._didChangeTextDocumentFeature = new Ti.DidChangeTextDocumentFeature(this, e)),
				this._didChangeTextDocumentFeature.onPendingChangeAdded(() => {
					this.triggerPendingChangeDelivery();
				}),
				this.registerFeature(this._didChangeTextDocumentFeature),
				this.registerFeature(new Ti.WillSaveFeature(this)),
				this.registerFeature(new Ti.WillSaveWaitUntilFeature(this)),
				this.registerFeature(new Ti.DidSaveTextDocumentFeature(this)),
				this.registerFeature(new Ti.DidCloseTextDocumentFeature(this, this._syncedDocuments, e)),
				this.registerFeature(new Xw.FileSystemWatcherFeature(this, (t) => this.notifyFileEvent(t))),
				this.registerFeature(new Mw.CompletionItemFeature(this)),
				this.registerFeature(new Lw.HoverFeature(this)),
				this.registerFeature(new jw.SignatureHelpFeature(this)),
				this.registerFeature(new Aw.DefinitionFeature(this)),
				this.registerFeature(new Uw.ReferencesFeature(this)),
				this.registerFeature(new $w.DocumentHighlightFeature(this)),
				this.registerFeature(new Hw.DocumentSymbolFeature(this)),
				this.registerFeature(new Ww.WorkspaceSymbolFeature(this)),
				this.registerFeature(new Kw.CodeActionFeature(this)),
				this.registerFeature(new zw.CodeLensFeature(this)),
				this.registerFeature(new hd.DocumentFormattingFeature(this)),
				this.registerFeature(new hd.DocumentRangeFormattingFeature(this)),
				this.registerFeature(new hd.DocumentOnTypeFormattingFeature(this)),
				this.registerFeature(new Vw.RenameFeature(this)),
				this.registerFeature(new Bw.DocumentLinkFeature(this)),
				this.registerFeature(new Gw.ExecuteCommandFeature(this)),
				this.registerFeature(new Mv.SyncConfigurationFeature(this)),
				this.registerFeature(new Yw.TypeDefinitionFeature(this)),
				this.registerFeature(new Qw.ImplementationFeature(this)),
				this.registerFeature(new Jw.ColorProviderFeature(this)),
				this.clientOptions.workspaceFolder === void 0 &&
					this.registerFeature(new Zw.WorkspaceFoldersFeature(this)),
				this.registerFeature(new eD.FoldingRangeFeature(this)),
				this.registerFeature(new tD.DeclarationFeature(this)),
				this.registerFeature(new nD.SelectionRangeFeature(this)),
				this.registerFeature(new rD.ProgressFeature(this)),
				this.registerFeature(new iD.CallHierarchyFeature(this)),
				this.registerFeature(new sD.SemanticTokensFeature(this)),
				this.registerFeature(new oD.LinkedEditingFeature(this)),
				this.registerFeature(new Pi.DidCreateFilesFeature(this)),
				this.registerFeature(new Pi.DidRenameFilesFeature(this)),
				this.registerFeature(new Pi.DidDeleteFilesFeature(this)),
				this.registerFeature(new Pi.WillCreateFilesFeature(this)),
				this.registerFeature(new Pi.WillRenameFilesFeature(this)),
				this.registerFeature(new Pi.WillDeleteFilesFeature(this)),
				this.registerFeature(new aD.TypeHierarchyFeature(this)),
				this.registerFeature(new cD.InlineValueFeature(this)),
				this.registerFeature(new uD.InlayHintsFeature(this)),
				this.registerFeature(new Nw.DiagnosticFeature(this)),
				this.registerFeature(new Nv.NotebookDocumentSyncFeature(this)));
		}
		registerProposedFeatures() {
			this.registerFeatures(vd.createAll(this));
		}
		fillInitializeParams(e) {
			for (let t of this._features) Tn.func(t.fillInitializeParams) && t.fillInitializeParams(e);
		}
		computeClientCapabilities() {
			let e = {};
			(0, Sn.ensure)(e, 'workspace').applyEdit = !0;
			let t = (0, Sn.ensure)((0, Sn.ensure)(e, 'workspace'), 'workspaceEdit');
			((t.documentChanges = !0),
				(t.resourceOperations = [
					A.ResourceOperationKind.Create,
					A.ResourceOperationKind.Rename,
					A.ResourceOperationKind.Delete,
				]),
				(t.failureHandling = A.FailureHandlingKind.TextOnlyTransactional),
				(t.normalizesLineEndings = !0),
				(t.changeAnnotationSupport = { groupsOnLabel: !0 }));
			let r = (0, Sn.ensure)((0, Sn.ensure)(e, 'textDocument'), 'publishDiagnostics');
			((r.relatedInformation = !0),
				(r.versionSupport = !1),
				(r.tagSupport = { valueSet: [A.DiagnosticTag.Unnecessary, A.DiagnosticTag.Deprecated] }),
				(r.codeDescriptionSupport = !0),
				(r.dataSupport = !0));
			let i = (0, Sn.ensure)(e, 'window'),
				s = (0, Sn.ensure)(i, 'showMessage');
			s.messageActionItem = { additionalPropertiesSupport: !0 };
			let o = (0, Sn.ensure)(i, 'showDocument');
			o.support = !0;
			let a = (0, Sn.ensure)(e, 'general');
			((a.staleRequestSupport = {
				cancel: !0,
				retryOnContentModified: Array.from(ir.RequestsToCancelOnContentModified),
			}),
				(a.regularExpressions = { engine: 'ECMAScript', version: 'ES2020' }),
				(a.markdown = { parser: 'marked', version: '1.1.0' }),
				(a.positionEncodings = ['utf-16']),
				this._clientOptions.markdown.supportHtml &&
					(a.markdown.allowedTags = [
						'ul',
						'li',
						'p',
						'code',
						'blockquote',
						'ol',
						'h1',
						'h2',
						'h3',
						'h4',
						'h5',
						'h6',
						'hr',
						'em',
						'pre',
						'table',
						'thead',
						'tbody',
						'tr',
						'th',
						'td',
						'div',
						'del',
						'a',
						'strong',
						'br',
						'img',
						'span',
					]));
			for (let u of this._features) u.fillClientCapabilities(e);
			return e;
		}
		initializeFeatures(e) {
			let t = this._clientOptions.documentSelector;
			for (let r of this._features)
				Tn.func(r.preInitialize) && r.preInitialize(this._capabilities, t);
			for (let r of this._features) r.initialize(this._capabilities, t);
		}
		async handleRegistrationRequest(e) {
			let t = this.clientOptions.middleware?.handleRegisterCapability;
			return t ? t(e, (r) => this.doRegisterCapability(r)) : this.doRegisterCapability(e);
		}
		async doRegisterCapability(e) {
			if (!this.isRunning()) {
				for (let t of e.registrations) this._ignoredRegistrations.add(t.id);
				return;
			}
			for (let t of e.registrations) {
				let r = this._dynamicFeatures.get(t.method);
				if (r === void 0)
					return Promise.reject(
						new Error(`No feature implementation for ${t.method} found. Registration failed.`),
					);
				let i = t.registerOptions ?? {};
				i.documentSelector = i.documentSelector ?? this._clientOptions.documentSelector;
				let s = { id: t.id, registerOptions: i };
				try {
					r.register(s);
				} catch (o) {
					return Promise.reject(o);
				}
			}
		}
		async handleUnregistrationRequest(e) {
			let t = this.clientOptions.middleware?.handleUnregisterCapability;
			return t ? t(e, (r) => this.doUnregisterCapability(r)) : this.doUnregisterCapability(e);
		}
		async doUnregisterCapability(e) {
			for (let t of e.unregisterations) {
				if (this._ignoredRegistrations.has(t.id)) continue;
				let r = this._dynamicFeatures.get(t.method);
				if (!r)
					return Promise.reject(
						new Error(`No feature implementation for ${t.method} found. Unregistration failed.`),
					);
				r.unregister(t.id);
			}
		}
		async handleApplyWorkspaceEdit(e) {
			let t = e.edit,
				r = await this.workspaceEditLock.lock(() => this._p2c.asWorkspaceEdit(t)),
				i = new Map();
			qe.workspace.textDocuments.forEach((o) => i.set(o.uri.toString(), o));
			let s = !1;
			if (t.documentChanges) {
				for (let o of t.documentChanges)
					if (A.TextDocumentEdit.is(o) && o.textDocument.version && o.textDocument.version >= 0) {
						let a = this._p2c.asUri(o.textDocument.uri).toString(),
							u = i.get(a);
						if (u && u.version !== o.textDocument.version) {
							s = !0;
							break;
						}
					}
			}
			return s
				? Promise.resolve({ applied: !1 })
				: Tn.asPromise(qe.workspace.applyEdit(r).then((o) => ({ applied: o })));
		}
		handleFailedRequest(e, t, r, i, s = !0) {
			if (r instanceof A.ResponseError) {
				if (
					r.code === A.ErrorCodes.PendingResponseRejected ||
					r.code === A.ErrorCodes.ConnectionInactive
				)
					return i;
				if (
					r.code === A.LSPErrorCodes.RequestCancelled ||
					r.code === A.LSPErrorCodes.ServerCancelled
				) {
					if (t !== void 0 && t.isCancellationRequested) return i;
					throw r.data !== void 0
						? new Sn.LSPCancellationError(r.data)
						: new qe.CancellationError();
				} else if (r.code === A.LSPErrorCodes.ContentModified) {
					if (
						ir.RequestsToCancelOnContentModified.has(e.method) ||
						ir.CancellableResolveCalls.has(e.method)
					)
						throw new qe.CancellationError();
					return i;
				}
			}
			throw (this.error(`Request ${e.method} failed.`, r, s), r);
		}
	};
	ht.BaseLanguageClient = ir;
	ir.RequestsToCancelOnContentModified = new Set([
		A.SemanticTokensRequest.method,
		A.SemanticTokensRangeRequest.method,
		A.SemanticTokensDeltaRequest.method,
	]);
	ir.CancellableResolveCalls = new Set([
		A.CompletionResolveRequest.method,
		A.CodeLensResolveRequest.method,
		A.CodeActionResolveRequest.method,
		A.InlayHintResolveRequest.method,
		A.DocumentLinkResolveRequest.method,
		A.WorkspaceSymbolResolveRequest.method,
	]);
	var md = class {
		error(e) {
			(0, A.RAL)().console.error(e);
		}
		warn(e) {
			(0, A.RAL)().console.warn(e);
		}
		info(e) {
			(0, A.RAL)().console.info(e);
		}
		log(e) {
			(0, A.RAL)().console.log(e);
		}
	};
	function dD(n, e, t, r, i) {
		let s = new md(),
			o = (0, A.createProtocolConnection)(n, e, s, i);
		return (
			o.onError((u) => {
				t(u[0], u[1], u[2]);
			}),
			o.onClose(r),
			{
				listen: () => o.listen(),
				sendRequest: o.sendRequest,
				onRequest: o.onRequest,
				hasPendingResponse: o.hasPendingResponse,
				sendNotification: o.sendNotification,
				onNotification: o.onNotification,
				onProgress: o.onProgress,
				sendProgress: o.sendProgress,
				trace: (u, l, p) => {
					let m = { sendNotification: !1, traceFormat: A.TraceFormat.Text };
					return p === void 0 ? o.trace(u, l, m) : (Tn.boolean(p), o.trace(u, l, p));
				},
				initialize: (u) => o.sendRequest(A.InitializeRequest.type, u),
				shutdown: () => o.sendRequest(A.ShutdownRequest.type, void 0),
				exit: () => o.sendNotification(A.ExitNotification.type),
				end: () => o.end(),
				dispose: () => o.dispose(),
			}
		);
	}
	var vd;
	(function (n) {
		function e(t) {
			return [new lD.InlineCompletionItemFeature(t)];
		}
		n.createAll = e;
	})(vd || (ht.ProposedFeatures = vd = {}));
});
var $v = E((ea) => {
	'use strict';
	Object.defineProperty(ea, '__esModule', { value: !0 });
	ea.terminate = void 0;
	var jv = require('child_process'),
		fD = require('path'),
		hD = process.platform === 'win32',
		pD = process.platform === 'darwin',
		gD = process.platform === 'linux';
	function mD(n, e) {
		if (hD)
			try {
				let i = { stdio: ['pipe', 'pipe', 'ignore'] };
				return (
					e && (i.cwd = e),
					jv.execFileSync('taskkill', ['/T', '/F', '/PID', n.pid.toString()], i),
					!0
				);
			} catch {
				return !1;
			}
		else if (gD || pD)
			try {
				var t = (0, fD.join)(__dirname, 'terminateProcess.sh'),
					r = jv.spawnSync(t, [n.pid.toString()]);
				return !r.error;
			} catch {
				return !1;
			}
		else return (n.kill('SIGKILL'), !0);
	}
	ea.terminate = mD;
});
var Cd = E((kP, Hv) => {
	'use strict';
	Hv.exports = ee();
});
var ds = E((xP, Wv) => {
	'use strict';
	var vD =
		typeof process == 'object' &&
		process.env &&
		process.env.NODE_DEBUG &&
		/\bsemver\b/i.test(process.env.NODE_DEBUG)
			? (...n) => console.error('SEMVER', ...n)
			: () => {};
	Wv.exports = vD;
});
var ta = E((IP, Uv) => {
	'use strict';
	var yD = '2.0.0',
		CD = Number.MAX_SAFE_INTEGER || 9007199254740991,
		bD = 16,
		_D = 256 - 6,
		wD = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'];
	Uv.exports = {
		MAX_LENGTH: 256,
		MAX_SAFE_COMPONENT_LENGTH: bD,
		MAX_SAFE_BUILD_LENGTH: _D,
		MAX_SAFE_INTEGER: CD,
		RELEASE_TYPES: wD,
		SEMVER_SPEC_VERSION: yD,
		FLAG_INCLUDE_PRERELEASE: 1,
		FLAG_LOOSE: 2,
	};
});
var na = E((Wn, Kv) => {
	'use strict';
	var { MAX_SAFE_COMPONENT_LENGTH: bd, MAX_SAFE_BUILD_LENGTH: DD, MAX_LENGTH: RD } = ta(),
		SD = ds();
	Wn = Kv.exports = {};
	var TD = (Wn.re = []),
		PD = (Wn.safeRe = []),
		K = (Wn.src = []),
		qD = (Wn.safeSrc = []),
		z = (Wn.t = {}),
		ED = 0,
		_d = '[a-zA-Z0-9-]',
		kD = [
			['\\s', 1],
			['\\d', RD],
			[_d, DD],
		],
		xD = (n) => {
			for (let [e, t] of kD)
				n = n.split(`${e}*`).join(`${e}{0,${t}}`).split(`${e}+`).join(`${e}{1,${t}}`);
			return n;
		},
		se = (n, e, t) => {
			let r = xD(e),
				i = ED++;
			(SD(n, i, e),
				(z[n] = i),
				(K[i] = e),
				(qD[i] = r),
				(TD[i] = new RegExp(e, t ? 'g' : void 0)),
				(PD[i] = new RegExp(r, t ? 'g' : void 0)));
		};
	se('NUMERICIDENTIFIER', '0|[1-9]\\d*');
	se('NUMERICIDENTIFIERLOOSE', '\\d+');
	se('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${_d}*`);
	se(
		'MAINVERSION',
		`(${K[z.NUMERICIDENTIFIER]})\\.(${K[z.NUMERICIDENTIFIER]})\\.(${K[z.NUMERICIDENTIFIER]})`,
	);
	se(
		'MAINVERSIONLOOSE',
		`(${K[z.NUMERICIDENTIFIERLOOSE]})\\.(${K[z.NUMERICIDENTIFIERLOOSE]})\\.(${K[z.NUMERICIDENTIFIERLOOSE]})`,
	);
	se('PRERELEASEIDENTIFIER', `(?:${K[z.NONNUMERICIDENTIFIER]}|${K[z.NUMERICIDENTIFIER]})`);
	se(
		'PRERELEASEIDENTIFIERLOOSE',
		`(?:${K[z.NONNUMERICIDENTIFIER]}|${K[z.NUMERICIDENTIFIERLOOSE]})`,
	);
	se('PRERELEASE', `(?:-(${K[z.PRERELEASEIDENTIFIER]}(?:\\.${K[z.PRERELEASEIDENTIFIER]})*))`);
	se(
		'PRERELEASELOOSE',
		`(?:-?(${K[z.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${K[z.PRERELEASEIDENTIFIERLOOSE]})*))`,
	);
	se('BUILDIDENTIFIER', `${_d}+`);
	se('BUILD', `(?:\\+(${K[z.BUILDIDENTIFIER]}(?:\\.${K[z.BUILDIDENTIFIER]})*))`);
	se('FULLPLAIN', `v?${K[z.MAINVERSION]}${K[z.PRERELEASE]}?${K[z.BUILD]}?`);
	se('FULL', `^${K[z.FULLPLAIN]}$`);
	se('LOOSEPLAIN', `[v=\\s]*${K[z.MAINVERSIONLOOSE]}${K[z.PRERELEASELOOSE]}?${K[z.BUILD]}?`);
	se('LOOSE', `^${K[z.LOOSEPLAIN]}$`);
	se('GTLT', '((?:<|>)?=?)');
	se('XRANGEIDENTIFIERLOOSE', `${K[z.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	se('XRANGEIDENTIFIER', `${K[z.NUMERICIDENTIFIER]}|x|X|\\*`);
	se(
		'XRANGEPLAIN',
		`[v=\\s]*(${K[z.XRANGEIDENTIFIER]})(?:\\.(${K[z.XRANGEIDENTIFIER]})(?:\\.(${K[z.XRANGEIDENTIFIER]})(?:${K[z.PRERELEASE]})?${K[z.BUILD]}?)?)?`,
	);
	se(
		'XRANGEPLAINLOOSE',
		`[v=\\s]*(${K[z.XRANGEIDENTIFIERLOOSE]})(?:\\.(${K[z.XRANGEIDENTIFIERLOOSE]})(?:\\.(${K[z.XRANGEIDENTIFIERLOOSE]})(?:${K[z.PRERELEASELOOSE]})?${K[z.BUILD]}?)?)?`,
	);
	se('XRANGE', `^${K[z.GTLT]}\\s*${K[z.XRANGEPLAIN]}$`);
	se('XRANGELOOSE', `^${K[z.GTLT]}\\s*${K[z.XRANGEPLAINLOOSE]}$`);
	se('COERCEPLAIN', `(^|[^\\d])(\\d{1,${bd}})(?:\\.(\\d{1,${bd}}))?(?:\\.(\\d{1,${bd}}))?`);
	se('COERCE', `${K[z.COERCEPLAIN]}(?:$|[^\\d])`);
	se('COERCEFULL', K[z.COERCEPLAIN] + `(?:${K[z.PRERELEASE]})?(?:${K[z.BUILD]})?(?:$|[^\\d])`);
	se('COERCERTL', K[z.COERCE], !0);
	se('COERCERTLFULL', K[z.COERCEFULL], !0);
	se('LONETILDE', '(?:~>?)');
	se('TILDETRIM', `(\\s*)${K[z.LONETILDE]}\\s+`, !0);
	Wn.tildeTrimReplace = '$1~';
	se('TILDE', `^${K[z.LONETILDE]}${K[z.XRANGEPLAIN]}$`);
	se('TILDELOOSE', `^${K[z.LONETILDE]}${K[z.XRANGEPLAINLOOSE]}$`);
	se('LONECARET', '(?:\\^)');
	se('CARETTRIM', `(\\s*)${K[z.LONECARET]}\\s+`, !0);
	Wn.caretTrimReplace = '$1^';
	se('CARET', `^${K[z.LONECARET]}${K[z.XRANGEPLAIN]}$`);
	se('CARETLOOSE', `^${K[z.LONECARET]}${K[z.XRANGEPLAINLOOSE]}$`);
	se('COMPARATORLOOSE', `^${K[z.GTLT]}\\s*(${K[z.LOOSEPLAIN]})$|^$`);
	se('COMPARATOR', `^${K[z.GTLT]}\\s*(${K[z.FULLPLAIN]})$|^$`);
	se('COMPARATORTRIM', `(\\s*)${K[z.GTLT]}\\s*(${K[z.LOOSEPLAIN]}|${K[z.XRANGEPLAIN]})`, !0);
	Wn.comparatorTrimReplace = '$1$2$3';
	se('HYPHENRANGE', `^\\s*(${K[z.XRANGEPLAIN]})\\s+-\\s+(${K[z.XRANGEPLAIN]})\\s*$`);
	se('HYPHENRANGELOOSE', `^\\s*(${K[z.XRANGEPLAINLOOSE]})\\s+-\\s+(${K[z.XRANGEPLAINLOOSE]})\\s*$`);
	se('STAR', '(<|>)?=?\\s*\\*');
	se('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
	se('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$');
});
var ra = E((OP, zv) => {
	'use strict';
	var ID = Object.freeze({ loose: !0 }),
		OD = Object.freeze({}),
		FD = (n) => (n ? (typeof n != 'object' ? ID : n) : OD);
	zv.exports = FD;
});
var Xv = E((FP, Gv) => {
	'use strict';
	var Vv = /^[0-9]+$/,
		Bv = (n, e) => {
			if (typeof n == 'number' && typeof e == 'number') return n === e ? 0 : n < e ? -1 : 1;
			let t = Vv.test(n),
				r = Vv.test(e);
			return (
				t && r && ((n = +n), (e = +e)),
				n === e ? 0 : t && !r ? -1 : r && !t ? 1 : n < e ? -1 : 1
			);
		},
		ND = (n, e) => Bv(e, n);
	Gv.exports = { compareIdentifiers: Bv, rcompareIdentifiers: ND };
});
var fs = E((NP, Qv) => {
	'use strict';
	var ia = ds(),
		{ MAX_LENGTH: Jv, MAX_SAFE_INTEGER: sa } = ta(),
		{ safeRe: oa, t: aa } = na(),
		MD = ra(),
		{ compareIdentifiers: wd } = Xv(),
		Zt = class {
			constructor(e, t) {
				if (((t = MD(t)), e instanceof Zt)) {
					if (e.loose === !!t.loose && e.includePrerelease === !!t.includePrerelease) return e;
					e = e.version;
				} else if (typeof e != 'string')
					throw new TypeError(`Invalid version. Must be a string. Got type "${typeof e}".`);
				if (e.length > Jv) throw new TypeError(`version is longer than ${Jv} characters`);
				(ia('SemVer', e, t),
					(this.options = t),
					(this.loose = !!t.loose),
					(this.includePrerelease = !!t.includePrerelease));
				let r = e.trim().match(t.loose ? oa[aa.LOOSE] : oa[aa.FULL]);
				if (!r) throw new TypeError(`Invalid Version: ${e}`);
				if (
					((this.raw = e),
					(this.major = +r[1]),
					(this.minor = +r[2]),
					(this.patch = +r[3]),
					this.major > sa || this.major < 0)
				)
					throw new TypeError('Invalid major version');
				if (this.minor > sa || this.minor < 0) throw new TypeError('Invalid minor version');
				if (this.patch > sa || this.patch < 0) throw new TypeError('Invalid patch version');
				(r[4]
					? (this.prerelease = r[4].split('.').map((i) => {
							if (/^[0-9]+$/.test(i)) {
								let s = +i;
								if (s >= 0 && s < sa) return s;
							}
							return i;
						}))
					: (this.prerelease = []),
					(this.build = r[5] ? r[5].split('.') : []),
					this.format());
			}
			format() {
				return (
					(this.version = `${this.major}.${this.minor}.${this.patch}`),
					this.prerelease.length && (this.version += `-${this.prerelease.join('.')}`),
					this.version
				);
			}
			toString() {
				return this.version;
			}
			compare(e) {
				if ((ia('SemVer.compare', this.version, this.options, e), !(e instanceof Zt))) {
					if (typeof e == 'string' && e === this.version) return 0;
					e = new Zt(e, this.options);
				}
				return e.version === this.version ? 0 : this.compareMain(e) || this.comparePre(e);
			}
			compareMain(e) {
				return (
					e instanceof Zt || (e = new Zt(e, this.options)),
					this.major < e.major
						? -1
						: this.major > e.major
							? 1
							: this.minor < e.minor
								? -1
								: this.minor > e.minor
									? 1
									: this.patch < e.patch
										? -1
										: this.patch > e.patch
											? 1
											: 0
				);
			}
			comparePre(e) {
				if (
					(e instanceof Zt || (e = new Zt(e, this.options)),
					this.prerelease.length && !e.prerelease.length)
				)
					return -1;
				if (!this.prerelease.length && e.prerelease.length) return 1;
				if (!this.prerelease.length && !e.prerelease.length) return 0;
				let t = 0;
				do {
					let r = this.prerelease[t],
						i = e.prerelease[t];
					if ((ia('prerelease compare', t, r, i), r === void 0 && i === void 0)) return 0;
					if (i === void 0) return 1;
					if (r === void 0) return -1;
					if (r === i) continue;
					return wd(r, i);
				} while (++t);
			}
			compareBuild(e) {
				e instanceof Zt || (e = new Zt(e, this.options));
				let t = 0;
				do {
					let r = this.build[t],
						i = e.build[t];
					if ((ia('build compare', t, r, i), r === void 0 && i === void 0)) return 0;
					if (i === void 0) return 1;
					if (r === void 0) return -1;
					if (r === i) continue;
					return wd(r, i);
				} while (++t);
			}
			inc(e, t, r) {
				if (e.startsWith('pre')) {
					if (!t && r === !1) throw new Error('invalid increment argument: identifier is empty');
					if (t) {
						let i = `-${t}`.match(this.options.loose ? oa[aa.PRERELEASELOOSE] : oa[aa.PRERELEASE]);
						if (!i || i[1] !== t) throw new Error(`invalid identifier: ${t}`);
					}
				}
				switch (e) {
					case 'premajor':
						((this.prerelease.length = 0),
							(this.patch = 0),
							(this.minor = 0),
							this.major++,
							this.inc('pre', t, r));
						break;
					case 'preminor':
						((this.prerelease.length = 0), (this.patch = 0), this.minor++, this.inc('pre', t, r));
						break;
					case 'prepatch':
						((this.prerelease.length = 0), this.inc('patch', t, r), this.inc('pre', t, r));
						break;
					case 'prerelease':
						(this.prerelease.length === 0 && this.inc('patch', t, r), this.inc('pre', t, r));
						break;
					case 'release':
						if (this.prerelease.length === 0)
							throw new Error(`version ${this.raw} is not a prerelease`);
						this.prerelease.length = 0;
						break;
					case 'major':
						((this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++,
							(this.minor = 0),
							(this.patch = 0),
							(this.prerelease = []));
						break;
					case 'minor':
						((this.patch !== 0 || this.prerelease.length === 0) && this.minor++,
							(this.patch = 0),
							(this.prerelease = []));
						break;
					case 'patch':
						(this.prerelease.length === 0 && this.patch++, (this.prerelease = []));
						break;
					case 'pre': {
						let i = Number(r) ? 1 : 0;
						if (this.prerelease.length === 0) this.prerelease = [i];
						else {
							let s = this.prerelease.length;
							for (; --s >= 0; )
								typeof this.prerelease[s] == 'number' && (this.prerelease[s]++, (s = -2));
							if (s === -1) {
								if (t === this.prerelease.join('.') && r === !1)
									throw new Error('invalid increment argument: identifier already exists');
								this.prerelease.push(i);
							}
						}
						if (t) {
							let s = [t, i];
							(r === !1 && (s = [t]),
								wd(this.prerelease[0], t) === 0
									? isNaN(this.prerelease[1]) && (this.prerelease = s)
									: (this.prerelease = s));
						}
						break;
					}
					default:
						throw new Error(`invalid increment argument: ${e}`);
				}
				return (
					(this.raw = this.format()),
					this.build.length && (this.raw += `+${this.build.join('.')}`),
					this
				);
			}
		};
	Qv.exports = Zt;
});
var ey = E((MP, Zv) => {
	'use strict';
	var Yv = fs(),
		LD = (n, e, t = !1) => {
			if (n instanceof Yv) return n;
			try {
				return new Yv(n, e);
			} catch (r) {
				if (!t) return null;
				throw r;
			}
		};
	Zv.exports = LD;
});
var ny = E((LP, ty) => {
	'use strict';
	var Dd = class {
		constructor() {
			((this.max = 1e3), (this.map = new Map()));
		}
		get(e) {
			let t = this.map.get(e);
			if (t !== void 0) return (this.map.delete(e), this.map.set(e, t), t);
		}
		delete(e) {
			return this.map.delete(e);
		}
		set(e, t) {
			if (!this.delete(e) && t !== void 0) {
				if (this.map.size >= this.max) {
					let i = this.map.keys().next().value;
					this.delete(i);
				}
				this.map.set(e, t);
			}
			return this;
		}
	};
	ty.exports = Dd;
});
var Vr = E((AP, iy) => {
	'use strict';
	var ry = fs(),
		AD = (n, e, t) => new ry(n, t).compare(new ry(e, t));
	iy.exports = AD;
});
var oy = E((jP, sy) => {
	'use strict';
	var jD = Vr(),
		$D = (n, e, t) => jD(n, e, t) === 0;
	sy.exports = $D;
});
var cy = E(($P, ay) => {
	'use strict';
	var HD = Vr(),
		WD = (n, e, t) => HD(n, e, t) !== 0;
	ay.exports = WD;
});
var ly = E((HP, uy) => {
	'use strict';
	var UD = Vr(),
		KD = (n, e, t) => UD(n, e, t) > 0;
	uy.exports = KD;
});
var fy = E((WP, dy) => {
	'use strict';
	var zD = Vr(),
		VD = (n, e, t) => zD(n, e, t) >= 0;
	dy.exports = VD;
});
var py = E((UP, hy) => {
	'use strict';
	var BD = Vr(),
		GD = (n, e, t) => BD(n, e, t) < 0;
	hy.exports = GD;
});
var my = E((KP, gy) => {
	'use strict';
	var XD = Vr(),
		JD = (n, e, t) => XD(n, e, t) <= 0;
	gy.exports = JD;
});
var yy = E((zP, vy) => {
	'use strict';
	var QD = oy(),
		YD = cy(),
		ZD = ly(),
		eR = fy(),
		tR = py(),
		nR = my(),
		rR = (n, e, t, r) => {
			switch (e) {
				case '===':
					return (
						typeof n == 'object' && (n = n.version),
						typeof t == 'object' && (t = t.version),
						n === t
					);
				case '!==':
					return (
						typeof n == 'object' && (n = n.version),
						typeof t == 'object' && (t = t.version),
						n !== t
					);
				case '':
				case '=':
				case '==':
					return QD(n, t, r);
				case '!=':
					return YD(n, t, r);
				case '>':
					return ZD(n, t, r);
				case '>=':
					return eR(n, t, r);
				case '<':
					return tR(n, t, r);
				case '<=':
					return nR(n, t, r);
				default:
					throw new TypeError(`Invalid operator: ${e}`);
			}
		};
	vy.exports = rR;
});
var Sy = E((VP, Ry) => {
	'use strict';
	var hs = Symbol('SemVer ANY'),
		qi = class {
			static get ANY() {
				return hs;
			}
			constructor(e, t) {
				if (((t = Cy(t)), e instanceof qi)) {
					if (e.loose === !!t.loose) return e;
					e = e.value;
				}
				((e = e.trim().split(/\s+/).join(' ')),
					Sd('comparator', e, t),
					(this.options = t),
					(this.loose = !!t.loose),
					this.parse(e),
					this.semver === hs
						? (this.value = '')
						: (this.value = this.operator + this.semver.version),
					Sd('comp', this));
			}
			parse(e) {
				let t = this.options.loose ? by[_y.COMPARATORLOOSE] : by[_y.COMPARATOR],
					r = e.match(t);
				if (!r) throw new TypeError(`Invalid comparator: ${e}`);
				((this.operator = r[1] !== void 0 ? r[1] : ''),
					this.operator === '=' && (this.operator = ''),
					r[2] ? (this.semver = new wy(r[2], this.options.loose)) : (this.semver = hs));
			}
			toString() {
				return this.value;
			}
			test(e) {
				if ((Sd('Comparator.test', e, this.options.loose), this.semver === hs || e === hs))
					return !0;
				if (typeof e == 'string')
					try {
						e = new wy(e, this.options);
					} catch {
						return !1;
					}
				return Rd(e, this.operator, this.semver, this.options);
			}
			intersects(e, t) {
				if (!(e instanceof qi)) throw new TypeError('a Comparator is required');
				return this.operator === ''
					? this.value === ''
						? !0
						: new Dy(e.value, t).test(this.value)
					: e.operator === ''
						? e.value === ''
							? !0
							: new Dy(this.value, t).test(e.semver)
						: ((t = Cy(t)),
							(t.includePrerelease && (this.value === '<0.0.0-0' || e.value === '<0.0.0-0')) ||
							(!t.includePrerelease &&
								(this.value.startsWith('<0.0.0') || e.value.startsWith('<0.0.0')))
								? !1
								: !!(
										(this.operator.startsWith('>') && e.operator.startsWith('>')) ||
										(this.operator.startsWith('<') && e.operator.startsWith('<')) ||
										(this.semver.version === e.semver.version &&
											this.operator.includes('=') &&
											e.operator.includes('=')) ||
										(Rd(this.semver, '<', e.semver, t) &&
											this.operator.startsWith('>') &&
											e.operator.startsWith('<')) ||
										(Rd(this.semver, '>', e.semver, t) &&
											this.operator.startsWith('<') &&
											e.operator.startsWith('>'))
									));
			}
		};
	Ry.exports = qi;
	var Cy = ra(),
		{ safeRe: by, t: _y } = na(),
		Rd = yy(),
		Sd = ds(),
		wy = fs(),
		Dy = Td();
});
var Td = E((BP, Ey) => {
	'use strict';
	var iR = /\s+/g,
		Br = class {
			constructor(e, t) {
				if (((t = oR(t)), e instanceof Br))
					return e.loose === !!t.loose && e.includePrerelease === !!t.includePrerelease
						? e
						: new Br(e.raw, t);
				if (e instanceof Pd)
					return ((this.raw = e.value), (this.set = [[e]]), (this.formatted = void 0), this);
				if (
					((this.options = t),
					(this.loose = !!t.loose),
					(this.includePrerelease = !!t.includePrerelease),
					(this.raw = e.trim().replace(iR, ' ')),
					(this.set = this.raw
						.split('||')
						.map((r) => this.parseRange(r.trim()))
						.filter((r) => r.length)),
					!this.set.length)
				)
					throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
				if (this.set.length > 1) {
					let r = this.set[0];
					if (((this.set = this.set.filter((i) => !Py(i[0]))), this.set.length === 0))
						this.set = [r];
					else if (this.set.length > 1) {
						for (let i of this.set)
							if (i.length === 1 && hR(i[0])) {
								this.set = [i];
								break;
							}
					}
				}
				this.formatted = void 0;
			}
			get range() {
				if (this.formatted === void 0) {
					this.formatted = '';
					for (let e = 0; e < this.set.length; e++) {
						e > 0 && (this.formatted += '||');
						let t = this.set[e];
						for (let r = 0; r < t.length; r++)
							(r > 0 && (this.formatted += ' '), (this.formatted += t[r].toString().trim()));
					}
				}
				return this.formatted;
			}
			format() {
				return this.range;
			}
			toString() {
				return this.range;
			}
			parseRange(e) {
				let r = ((this.options.includePrerelease && dR) | (this.options.loose && fR)) + ':' + e,
					i = Ty.get(r);
				if (i) return i;
				let s = this.options.loose,
					o = s ? It[Pt.HYPHENRANGELOOSE] : It[Pt.HYPHENRANGE];
				((e = e.replace(o, DR(this.options.includePrerelease))),
					je('hyphen replace', e),
					(e = e.replace(It[Pt.COMPARATORTRIM], cR)),
					je('comparator trim', e),
					(e = e.replace(It[Pt.TILDETRIM], uR)),
					je('tilde trim', e),
					(e = e.replace(It[Pt.CARETTRIM], lR)),
					je('caret trim', e));
				let a = e
					.split(' ')
					.map((m) => pR(m, this.options))
					.join(' ')
					.split(/\s+/)
					.map((m) => wR(m, this.options));
				(s &&
					(a = a.filter(
						(m) => (je('loose invalid filter', m, this.options), !!m.match(It[Pt.COMPARATORLOOSE])),
					)),
					je('range list', a));
				let u = new Map(),
					l = a.map((m) => new Pd(m, this.options));
				for (let m of l) {
					if (Py(m)) return [m];
					u.set(m.value, m);
				}
				u.size > 1 && u.has('') && u.delete('');
				let p = [...u.values()];
				return (Ty.set(r, p), p);
			}
			intersects(e, t) {
				if (!(e instanceof Br)) throw new TypeError('a Range is required');
				return this.set.some(
					(r) =>
						qy(r, t) &&
						e.set.some((i) => qy(i, t) && r.every((s) => i.every((o) => s.intersects(o, t)))),
				);
			}
			test(e) {
				if (!e) return !1;
				if (typeof e == 'string')
					try {
						e = new aR(e, this.options);
					} catch {
						return !1;
					}
				for (let t = 0; t < this.set.length; t++) if (RR(this.set[t], e, this.options)) return !0;
				return !1;
			}
		};
	Ey.exports = Br;
	var sR = ny(),
		Ty = new sR(),
		oR = ra(),
		Pd = Sy(),
		je = ds(),
		aR = fs(),
		{
			safeRe: It,
			t: Pt,
			comparatorTrimReplace: cR,
			tildeTrimReplace: uR,
			caretTrimReplace: lR,
		} = na(),
		{ FLAG_INCLUDE_PRERELEASE: dR, FLAG_LOOSE: fR } = ta(),
		Py = (n) => n.value === '<0.0.0-0',
		hR = (n) => n.value === '',
		qy = (n, e) => {
			let t = !0,
				r = n.slice(),
				i = r.pop();
			for (; t && r.length; ) ((t = r.every((s) => i.intersects(s, e))), (i = r.pop()));
			return t;
		},
		pR = (n, e) => (
			(n = n.replace(It[Pt.BUILD], '')),
			je('comp', n, e),
			(n = vR(n, e)),
			je('caret', n),
			(n = gR(n, e)),
			je('tildes', n),
			(n = CR(n, e)),
			je('xrange', n),
			(n = _R(n, e)),
			je('stars', n),
			n
		),
		Ot = (n) => !n || n.toLowerCase() === 'x' || n === '*',
		gR = (n, e) =>
			n
				.trim()
				.split(/\s+/)
				.map((t) => mR(t, e))
				.join(' '),
		mR = (n, e) => {
			let t = e.loose ? It[Pt.TILDELOOSE] : It[Pt.TILDE];
			return n.replace(t, (r, i, s, o, a) => {
				je('tilde', n, r, i, s, o, a);
				let u;
				return (
					Ot(i)
						? (u = '')
						: Ot(s)
							? (u = `>=${i}.0.0 <${+i + 1}.0.0-0`)
							: Ot(o)
								? (u = `>=${i}.${s}.0 <${i}.${+s + 1}.0-0`)
								: a
									? (je('replaceTilde pr', a), (u = `>=${i}.${s}.${o}-${a} <${i}.${+s + 1}.0-0`))
									: (u = `>=${i}.${s}.${o} <${i}.${+s + 1}.0-0`),
					je('tilde return', u),
					u
				);
			});
		},
		vR = (n, e) =>
			n
				.trim()
				.split(/\s+/)
				.map((t) => yR(t, e))
				.join(' '),
		yR = (n, e) => {
			je('caret', n, e);
			let t = e.loose ? It[Pt.CARETLOOSE] : It[Pt.CARET],
				r = e.includePrerelease ? '-0' : '';
			return n.replace(t, (i, s, o, a, u) => {
				je('caret', n, i, s, o, a, u);
				let l;
				return (
					Ot(s)
						? (l = '')
						: Ot(o)
							? (l = `>=${s}.0.0${r} <${+s + 1}.0.0-0`)
							: Ot(a)
								? s === '0'
									? (l = `>=${s}.${o}.0${r} <${s}.${+o + 1}.0-0`)
									: (l = `>=${s}.${o}.0${r} <${+s + 1}.0.0-0`)
								: u
									? (je('replaceCaret pr', u),
										s === '0'
											? o === '0'
												? (l = `>=${s}.${o}.${a}-${u} <${s}.${o}.${+a + 1}-0`)
												: (l = `>=${s}.${o}.${a}-${u} <${s}.${+o + 1}.0-0`)
											: (l = `>=${s}.${o}.${a}-${u} <${+s + 1}.0.0-0`))
									: (je('no pr'),
										s === '0'
											? o === '0'
												? (l = `>=${s}.${o}.${a}${r} <${s}.${o}.${+a + 1}-0`)
												: (l = `>=${s}.${o}.${a}${r} <${s}.${+o + 1}.0-0`)
											: (l = `>=${s}.${o}.${a} <${+s + 1}.0.0-0`)),
					je('caret return', l),
					l
				);
			});
		},
		CR = (n, e) => (
			je('replaceXRanges', n, e),
			n
				.split(/\s+/)
				.map((t) => bR(t, e))
				.join(' ')
		),
		bR = (n, e) => {
			n = n.trim();
			let t = e.loose ? It[Pt.XRANGELOOSE] : It[Pt.XRANGE];
			return n.replace(t, (r, i, s, o, a, u) => {
				je('xRange', n, r, i, s, o, a, u);
				let l = Ot(s),
					p = l || Ot(o),
					m = p || Ot(a),
					g = m;
				return (
					i === '=' && g && (i = ''),
					(u = e.includePrerelease ? '-0' : ''),
					l
						? i === '>' || i === '<'
							? (r = '<0.0.0-0')
							: (r = '*')
						: i && g
							? (p && (o = 0),
								(a = 0),
								i === '>'
									? ((i = '>='), p ? ((s = +s + 1), (o = 0), (a = 0)) : ((o = +o + 1), (a = 0)))
									: i === '<=' && ((i = '<'), p ? (s = +s + 1) : (o = +o + 1)),
								i === '<' && (u = '-0'),
								(r = `${i + s}.${o}.${a}${u}`))
							: p
								? (r = `>=${s}.0.0${u} <${+s + 1}.0.0-0`)
								: m && (r = `>=${s}.${o}.0${u} <${s}.${+o + 1}.0-0`),
					je('xRange return', r),
					r
				);
			});
		},
		_R = (n, e) => (je('replaceStars', n, e), n.trim().replace(It[Pt.STAR], '')),
		wR = (n, e) => (
			je('replaceGTE0', n, e),
			n.trim().replace(It[e.includePrerelease ? Pt.GTE0PRE : Pt.GTE0], '')
		),
		DR = (n) => (e, t, r, i, s, o, a, u, l, p, m, g) => (
			Ot(r)
				? (t = '')
				: Ot(i)
					? (t = `>=${r}.0.0${n ? '-0' : ''}`)
					: Ot(s)
						? (t = `>=${r}.${i}.0${n ? '-0' : ''}`)
						: o
							? (t = `>=${t}`)
							: (t = `>=${t}${n ? '-0' : ''}`),
			Ot(l)
				? (u = '')
				: Ot(p)
					? (u = `<${+l + 1}.0.0-0`)
					: Ot(m)
						? (u = `<${l}.${+p + 1}.0-0`)
						: g
							? (u = `<=${l}.${p}.${m}-${g}`)
							: n
								? (u = `<${l}.${p}.${+m + 1}-0`)
								: (u = `<=${u}`),
			`${t} ${u}`.trim()
		),
		RR = (n, e, t) => {
			for (let r = 0; r < n.length; r++) if (!n[r].test(e)) return !1;
			if (e.prerelease.length && !t.includePrerelease) {
				for (let r = 0; r < n.length; r++)
					if ((je(n[r].semver), n[r].semver !== Pd.ANY && n[r].semver.prerelease.length > 0)) {
						let i = n[r].semver;
						if (i.major === e.major && i.minor === e.minor && i.patch === e.patch) return !0;
					}
				return !1;
			}
			return !0;
		};
});
var xy = E((GP, ky) => {
	'use strict';
	var SR = Td(),
		TR = (n, e, t) => {
			try {
				e = new SR(e, t);
			} catch {
				return !1;
			}
			return e.test(n);
		};
	ky.exports = TR;
});
var Oy = E((en) => {
	'use strict';
	var PR =
			(en && en.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		qd =
			(en && en.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && PR(e, n, t);
			};
	Object.defineProperty(en, '__esModule', { value: !0 });
	en.DiagnosticPullMode = en.vsdiag = void 0;
	qd(ee(), en);
	qd(ye(), en);
	var Iy = Lu();
	Object.defineProperty(en, 'vsdiag', {
		enumerable: !0,
		get: function () {
			return Iy.vsdiag;
		},
	});
	Object.defineProperty(en, 'DiagnosticPullMode', {
		enumerable: !0,
		get: function () {
			return Iy.DiagnosticPullMode;
		},
	});
	qd(yd(), en);
});
var ps = E((Wt) => {
	'use strict';
	var qR =
			(Wt && Wt.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		My =
			(Wt && Wt.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && qR(e, n, t);
			};
	Object.defineProperty(Wt, '__esModule', { value: !0 });
	Wt.SettingMonitor = Wt.LanguageClient = Wt.TransportKind = void 0;
	var sr = require('child_process'),
		Ed = require('fs'),
		kd = require('path'),
		Er = require('vscode'),
		Ue = cn(),
		Fy = yd(),
		ER = $v(),
		Be = Cd(),
		kR = ey(),
		xR = xy();
	My(Cd(), Wt);
	My(Oy(), Wt);
	var Ny = '^1.82.0',
		Ge;
	(function (n) {
		((n[(n.stdio = 0)] = 'stdio'),
			(n[(n.ipc = 1)] = 'ipc'),
			(n[(n.pipe = 2)] = 'pipe'),
			(n[(n.socket = 3)] = 'socket'));
	})(Ge || (Wt.TransportKind = Ge = {}));
	var qr;
	(function (n) {
		function e(t) {
			let r = t;
			return r && r.kind === Ge.socket && Ue.number(r.port);
		}
		n.isSocket = e;
	})(qr || (qr = {}));
	var xd;
	(function (n) {
		function e(t) {
			return Ue.string(t.command);
		}
		n.is = e;
	})(xd || (xd = {}));
	var Id;
	(function (n) {
		function e(t) {
			return Ue.string(t.module);
		}
		n.is = e;
	})(Id || (Id = {}));
	var Od;
	(function (n) {
		function e(t) {
			let r = t;
			return r && r.writer !== void 0 && r.reader !== void 0;
		}
		n.is = e;
	})(Od || (Od = {}));
	var Fd;
	(function (n) {
		function e(t) {
			let r = t;
			return r && r.process !== void 0 && typeof r.detached == 'boolean';
		}
		n.is = e;
	})(Fd || (Fd = {}));
	var Nd = class extends Fy.BaseLanguageClient {
		constructor(e, t, r, i, s) {
			let o, a, u, l, p;
			(Ue.string(t)
				? ((o = e), (a = t), (u = r), (l = i), (p = !!s))
				: ((o = e.toLowerCase()), (a = e), (u = t), (l = r), (p = i)),
				p === void 0 && (p = !1),
				super(o, a, l),
				(this._serverOptions = u),
				(this._forceDebug = p),
				(this._isInDebugMode = p));
			try {
				this.checkVersion();
			} catch (m) {
				throw (Ue.string(m.message) && this.outputChannel.appendLine(m.message), m);
			}
		}
		checkVersion() {
			let e = kR(Er.version);
			if (!e)
				throw new Error(`No valid VS Code version detected. Version string is: ${Er.version}`);
			if ((e.prerelease && e.prerelease.length > 0 && (e.prerelease = []), !xR(e, Ny)))
				throw new Error(
					`The language client requires VS Code version ${Ny} but received version ${Er.version}`,
				);
		}
		get isInDebugMode() {
			return this._isInDebugMode;
		}
		async restart() {
			(await this.stop(),
				this.isInDebugMode
					? (await new Promise((e) => setTimeout(e, 1e3)), await this.start())
					: await this.start());
		}
		stop(e = 2e3) {
			return super.stop(e).finally(() => {
				if (this._serverProcess) {
					let t = this._serverProcess;
					((this._serverProcess = void 0),
						(this._isDetached === void 0 || !this._isDetached) && this.checkProcessDied(t),
						(this._isDetached = void 0));
				}
			});
		}
		checkProcessDied(e) {
			!e ||
				e.pid === void 0 ||
				setTimeout(() => {
					try {
						e.pid !== void 0 && (process.kill(e.pid, 0), (0, ER.terminate)(e));
					} catch {}
				}, 2e3);
		}
		handleConnectionClosed() {
			return ((this._serverProcess = void 0), super.handleConnectionClosed());
		}
		fillInitializeParams(e) {
			(super.fillInitializeParams(e), e.processId === null && (e.processId = process.pid));
		}
		createMessageTransports(e) {
			function t(p, m) {
				if (!p && !m) return;
				let g = Object.create(null);
				return (
					Object.keys(process.env).forEach((D) => (g[D] = process.env[D])),
					m && ((g.ELECTRON_RUN_AS_NODE = '1'), (g.ELECTRON_NO_ASAR = '1')),
					p && Object.keys(p).forEach((D) => (g[D] = p[D])),
					g
				);
			}
			let r = ['--debug=', '--debug-brk=', '--inspect=', '--inspect-brk='],
				i = ['--debug', '--debug-brk', '--inspect', '--inspect-brk'];
			function s() {
				let p = process.execArgv;
				return p ? p.some((m) => r.some((g) => m.startsWith(g)) || i.some((g) => m === g)) : !1;
			}
			function o(p) {
				if (p.stdin === null || p.stdout === null || p.stderr === null)
					throw new Error('Process created without stdio streams');
			}
			let a = this._serverOptions;
			if (Ue.func(a))
				return a().then((p) => {
					if (Fy.MessageTransports.is(p)) return ((this._isDetached = !!p.detached), p);
					if (Od.is(p))
						return (
							(this._isDetached = !!p.detached),
							{
								reader: new Be.StreamMessageReader(p.reader),
								writer: new Be.StreamMessageWriter(p.writer),
							}
						);
					{
						let m;
						return (
							Fd.is(p)
								? ((m = p.process), (this._isDetached = p.detached))
								: ((m = p), (this._isDetached = !1)),
							m.stderr.on('data', (g) =>
								this.outputChannel.append(Ue.string(g) ? g : g.toString(e)),
							),
							{
								reader: new Be.StreamMessageReader(m.stdout),
								writer: new Be.StreamMessageWriter(m.stdin),
							}
						);
					}
				});
			let u,
				l = a;
			return (
				l.run || l.debug
					? this._forceDebug || s()
						? ((u = l.debug), (this._isInDebugMode = !0))
						: ((u = l.run), (this._isInDebugMode = !1))
					: (u = a),
				this._getServerWorkingDir(u.options)
					.then((p) => {
						if (Id.is(u) && u.module) {
							let m = u,
								g = m.transport || Ge.stdio;
							if (m.runtime) {
								let D = [],
									y = m.options ?? Object.create(null);
								(y.execArgv && y.execArgv.forEach((L) => D.push(L)),
									D.push(m.module),
									m.args && m.args.forEach((L) => D.push(L)));
								let P = Object.create(null);
								((P.cwd = p), (P.env = t(y.env, !1)));
								let q = this._getRuntimePath(m.runtime, p),
									N;
								if (
									(g === Ge.ipc
										? ((P.stdio = [null, null, null, 'ipc']), D.push('--node-ipc'))
										: g === Ge.stdio
											? D.push('--stdio')
											: g === Ge.pipe
												? ((N = (0, Be.generateRandomPipeName)()), D.push(`--pipe=${N}`))
												: qr.isSocket(g) && D.push(`--socket=${g.port}`),
									D.push(`--clientProcessId=${process.pid.toString()}`),
									g === Ge.ipc || g === Ge.stdio)
								) {
									let L = sr.spawn(q, D, P);
									return !L || !L.pid
										? Ei(L, `Launching server using runtime ${q} failed.`)
										: ((this._serverProcess = L),
											L.stderr.on('data', (M) =>
												this.outputChannel.append(Ue.string(M) ? M : M.toString(e)),
											),
											g === Ge.ipc
												? (L.stdout.on('data', (M) =>
														this.outputChannel.append(Ue.string(M) ? M : M.toString(e)),
													),
													Promise.resolve({
														reader: new Be.IPCMessageReader(L),
														writer: new Be.IPCMessageWriter(L),
													}))
												: Promise.resolve({
														reader: new Be.StreamMessageReader(L.stdout),
														writer: new Be.StreamMessageWriter(L.stdin),
													}));
								} else {
									if (g === Ge.pipe)
										return (0, Be.createClientPipeTransport)(N).then((L) => {
											let M = sr.spawn(q, D, P);
											return !M || !M.pid
												? Ei(M, `Launching server using runtime ${q} failed.`)
												: ((this._serverProcess = M),
													M.stderr.on('data', (H) =>
														this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
													),
													M.stdout.on('data', (H) =>
														this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
													),
													L.onConnected().then((H) => ({ reader: H[0], writer: H[1] })));
										});
									if (qr.isSocket(g))
										return (0, Be.createClientSocketTransport)(g.port).then((L) => {
											let M = sr.spawn(q, D, P);
											return !M || !M.pid
												? Ei(M, `Launching server using runtime ${q} failed.`)
												: ((this._serverProcess = M),
													M.stderr.on('data', (H) =>
														this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
													),
													M.stdout.on('data', (H) =>
														this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
													),
													L.onConnected().then((H) => ({ reader: H[0], writer: H[1] })));
										});
								}
							} else {
								let D;
								return new Promise((y, P) => {
									let q = (m.args && m.args.slice()) ?? [];
									(g === Ge.ipc
										? q.push('--node-ipc')
										: g === Ge.stdio
											? q.push('--stdio')
											: g === Ge.pipe
												? ((D = (0, Be.generateRandomPipeName)()), q.push(`--pipe=${D}`))
												: qr.isSocket(g) && q.push(`--socket=${g.port}`),
										q.push(`--clientProcessId=${process.pid.toString()}`));
									let N = m.options ?? Object.create(null);
									if (
										((N.env = t(N.env, !0)),
										(N.execArgv = N.execArgv || []),
										(N.cwd = p),
										(N.silent = !0),
										g === Ge.ipc || g === Ge.stdio)
									) {
										let L = sr.fork(m.module, q || [], N);
										(o(L),
											(this._serverProcess = L),
											L.stderr.on('data', (M) =>
												this.outputChannel.append(Ue.string(M) ? M : M.toString(e)),
											),
											g === Ge.ipc
												? (L.stdout.on('data', (M) =>
														this.outputChannel.append(Ue.string(M) ? M : M.toString(e)),
													),
													y({
														reader: new Be.IPCMessageReader(this._serverProcess),
														writer: new Be.IPCMessageWriter(this._serverProcess),
													}))
												: y({
														reader: new Be.StreamMessageReader(L.stdout),
														writer: new Be.StreamMessageWriter(L.stdin),
													}));
									} else
										g === Ge.pipe
											? (0, Be.createClientPipeTransport)(D).then((L) => {
													let M = sr.fork(m.module, q || [], N);
													(o(M),
														(this._serverProcess = M),
														M.stderr.on('data', (H) =>
															this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
														),
														M.stdout.on('data', (H) =>
															this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
														),
														L.onConnected().then((H) => {
															y({ reader: H[0], writer: H[1] });
														}, P));
												}, P)
											: qr.isSocket(g) &&
												(0, Be.createClientSocketTransport)(g.port).then((L) => {
													let M = sr.fork(m.module, q || [], N);
													(o(M),
														(this._serverProcess = M),
														M.stderr.on('data', (H) =>
															this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
														),
														M.stdout.on('data', (H) =>
															this.outputChannel.append(Ue.string(H) ? H : H.toString(e)),
														),
														L.onConnected().then((H) => {
															y({ reader: H[0], writer: H[1] });
														}, P));
												}, P);
								});
							}
						} else if (xd.is(u) && u.command) {
							let m = u,
								g = u.args !== void 0 ? u.args.slice(0) : [],
								D,
								y = u.transport;
							if (y === Ge.stdio) g.push('--stdio');
							else if (y === Ge.pipe)
								((D = (0, Be.generateRandomPipeName)()), g.push(`--pipe=${D}`));
							else if (qr.isSocket(y)) g.push(`--socket=${y.port}`);
							else if (y === Ge.ipc)
								throw new Error('Transport kind ipc is not support for command executable');
							let P = Object.assign({}, m.options);
							if (((P.cwd = P.cwd || p), y === void 0 || y === Ge.stdio)) {
								let q = sr.spawn(m.command, g, P);
								return !q || !q.pid
									? Ei(q, `Launching server using command ${m.command} failed.`)
									: (q.stderr.on('data', (N) =>
											this.outputChannel.append(Ue.string(N) ? N : N.toString(e)),
										),
										(this._serverProcess = q),
										(this._isDetached = !!P.detached),
										Promise.resolve({
											reader: new Be.StreamMessageReader(q.stdout),
											writer: new Be.StreamMessageWriter(q.stdin),
										}));
							} else {
								if (y === Ge.pipe)
									return (0, Be.createClientPipeTransport)(D).then((q) => {
										let N = sr.spawn(m.command, g, P);
										return !N || !N.pid
											? Ei(N, `Launching server using command ${m.command} failed.`)
											: ((this._serverProcess = N),
												(this._isDetached = !!P.detached),
												N.stderr.on('data', (L) =>
													this.outputChannel.append(Ue.string(L) ? L : L.toString(e)),
												),
												N.stdout.on('data', (L) =>
													this.outputChannel.append(Ue.string(L) ? L : L.toString(e)),
												),
												q.onConnected().then((L) => ({ reader: L[0], writer: L[1] })));
									});
								if (qr.isSocket(y))
									return (0, Be.createClientSocketTransport)(y.port).then((q) => {
										let N = sr.spawn(m.command, g, P);
										return !N || !N.pid
											? Ei(N, `Launching server using command ${m.command} failed.`)
											: ((this._serverProcess = N),
												(this._isDetached = !!P.detached),
												N.stderr.on('data', (L) =>
													this.outputChannel.append(Ue.string(L) ? L : L.toString(e)),
												),
												N.stdout.on('data', (L) =>
													this.outputChannel.append(Ue.string(L) ? L : L.toString(e)),
												),
												q.onConnected().then((L) => ({ reader: L[0], writer: L[1] })));
									});
							}
						}
						return Promise.reject(
							new Error('Unsupported server configuration ' + JSON.stringify(a, null, 4)),
						);
					})
					.finally(() => {
						this._serverProcess !== void 0 &&
							this._serverProcess.on('exit', (p, m) => {
								(p !== null && this.error(`Server process exited with code ${p}.`, void 0, !1),
									m !== null && this.error(`Server process exited with signal ${m}.`, void 0, !1));
							});
					})
			);
		}
		_getRuntimePath(e, t) {
			if (kd.isAbsolute(e)) return e;
			let r = this._mainGetRootPath();
			if (r !== void 0) {
				let i = kd.join(r, e);
				if (Ed.existsSync(i)) return i;
			}
			if (t !== void 0) {
				let i = kd.join(t, e);
				if (Ed.existsSync(i)) return i;
			}
			return e;
		}
		_mainGetRootPath() {
			let e = Er.workspace.workspaceFolders;
			if (!e || e.length === 0) return;
			let t = e[0];
			if (t.uri.scheme === 'file') return t.uri.fsPath;
		}
		_getServerWorkingDir(e) {
			let t = e && e.cwd;
			return (
				t ||
					(t = this.clientOptions.workspaceFolder
						? this.clientOptions.workspaceFolder.uri.fsPath
						: this._mainGetRootPath()),
				t
					? new Promise((r) => {
							Ed.lstat(t, (i, s) => {
								r(!i && s.isDirectory() ? t : void 0);
							});
						})
					: Promise.resolve(void 0)
			);
		}
	};
	Wt.LanguageClient = Nd;
	var Md = class {
		constructor(e, t) {
			((this._client = e), (this._setting = t), (this._listeners = []));
		}
		start() {
			return (
				Er.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this, this._listeners),
				this.onDidChangeConfiguration(),
				new Er.Disposable(() => {
					this._client.needsStop() && this._client.stop();
				})
			);
		}
		onDidChangeConfiguration() {
			let e = this._setting.indexOf('.'),
				t = e >= 0 ? this._setting.substr(0, e) : this._setting,
				r = e >= 0 ? this._setting.substr(e + 1) : void 0,
				i = r ? Er.workspace.getConfiguration(t).get(r, !1) : Er.workspace.getConfiguration(t);
			i && this._client.needsStart()
				? this._client
						.start()
						.catch((s) => this._client.error('Start failed after configuration change', s, 'force'))
				: !i &&
					this._client.needsStop() &&
					this._client
						.stop()
						.catch((s) => this._client.error('Stop failed after configuration change', s, 'force'));
		}
	};
	Wt.SettingMonitor = Md;
	function Ei(n, e) {
		return n === null
			? Promise.reject(e)
			: new Promise((t, r) => {
					(n.on('error', (i) => {
						r(`${e} ${i}`);
					}),
						setImmediate(() => r(e)));
				});
	}
});
var Gr = E((Te) => {
	'use strict';
	var IR =
			(Te && Te.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		OR =
			(Te && Te.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && IR(e, n, t);
			};
	Object.defineProperty(Te, '__esModule', { value: !0 });
	Te.GetVirtualCodeRequest =
		Te.GetVirtualFileRequest =
		Te.GetServicePluginsRequest =
		Te.UpdateServicePluginStateNotification =
		Te.UpdateVirtualCodeStateNotification =
		Te.DocumentDrop_DataTransferItemFileDataRequest =
		Te.DocumentDrop_DataTransferItemAsStringRequest =
		Te.DocumentDropRequest =
		Te.ReloadProjectNotification =
		Te.AutoInsertRequest =
		Te.GetMatchTsConfigRequest =
		Te.FindFileReferenceRequest =
			void 0;
	var hn = ps();
	OR(ps(), Te);
	var Ly;
	(function (n) {
		n.type = new hn.RequestType('volar/client/findFileReference');
	})(Ly || (Te.FindFileReferenceRequest = Ly = {}));
	var Ay;
	(function (n) {
		n.type = new hn.RequestType('volar/client/tsconfig');
	})(Ay || (Te.GetMatchTsConfigRequest = Ay = {}));
	var jy;
	(function (n) {
		n.type = new hn.RequestType('volar/client/autoInsert');
	})(jy || (Te.AutoInsertRequest = jy = {}));
	var $y;
	(function (n) {
		n.type = new hn.NotificationType('volar/client/reloadProject');
	})($y || (Te.ReloadProjectNotification = $y = {}));
	var Hy;
	(function (n) {
		n.type = new hn.RequestType('volar/client/documentDrop');
	})(Hy || (Te.DocumentDropRequest = Hy = {}));
	var Wy;
	(function (n) {
		n.type = new hn.RequestType('volar/client/documentDrop/asString');
	})(Wy || (Te.DocumentDrop_DataTransferItemAsStringRequest = Wy = {}));
	var Uy;
	(function (n) {
		n.type = new hn.RequestType('volar/client/documentDrop/fileData');
	})(Uy || (Te.DocumentDrop_DataTransferItemFileDataRequest = Uy = {}));
	var Ky;
	(function (n) {
		n.type = new hn.NotificationType('volar/client/labs/updateVirtualFileState');
	})(Ky || (Te.UpdateVirtualCodeStateNotification = Ky = {}));
	var zy;
	(function (n) {
		n.type = new hn.NotificationType('volar/client/labs/updateServicePluginState');
	})(zy || (Te.UpdateServicePluginStateNotification = zy = {}));
	var Vy;
	(function (n) {
		n.type = new hn.RequestType('volar/client/servicePlugins');
	})(Vy || (Te.GetServicePluginsRequest = Vy = {}));
	var By;
	(function (n) {
		n.type = new hn.RequestType('volar/client/virtualFiles');
	})(By || (Te.GetVirtualFileRequest = By = {}));
	var Gy;
	(function (n) {
		n.type = new hn.RequestType('volar/client/virtualFile');
	})(Gy || (Te.GetVirtualCodeRequest = Gy = {}));
});
var Xy = E((Ld) => {
	'use strict';
	Object.defineProperty(Ld, '__esModule', { value: !0 });
	Ld.activate = NR;
	var Ut = require('vscode'),
		FR = Gr();
	function NR(n, e) {
		let t = !1,
			r;
		s();
		let i = [
			Ut.workspace.onDidChangeTextDocument(o, null),
			Ut.window.onDidChangeActiveTextEditor(s, null),
		];
		return Ut.Disposable.from(...i);
		function s() {
			t = !1;
			let u = Ut.window.activeTextEditor;
			if (!u) return;
			let l = u.document;
			Ut.languages.match(n, l) && (t = !0);
		}
		function o({ document: u, contentChanges: l, reason: p }) {
			if (
				!t ||
				l.length === 0 ||
				p === Ut.TextDocumentChangeReason.Undo ||
				p === Ut.TextDocumentChangeReason.Redo
			)
				return;
			let m = Ut.window.activeTextEditor?.document;
			if (u !== m) return;
			let g = l[l.length - 1];
			if (g.text.length === 0) return;
			let D = g.text[g.text.length - 1],
				y = e.initializeResult?.capabilities;
			if (y?.experimental?.autoInsertionProvider) {
				let { triggerCharacters: P, configurationSections: q } =
					y.experimental.autoInsertionProvider;
				for (let N = 0; N < P.length; N++) {
					let L = P[N],
						M = q?.[N];
					if (
						D.match(new RegExp(L)) &&
						(!M || M.some((H) => Ut.workspace.getConfiguration().get(H)))
					) {
						a(u, g);
						return;
					}
				}
			}
		}
		function a(u, l) {
			r && (clearTimeout(r), (r = void 0));
			let p = u.version,
				m = () =>
					u !== Ut.window.activeTextEditor?.document ||
					Ut.window.activeTextEditor?.document.version !== p;
			r = setTimeout(async () => {
				if (((r = void 0), m())) return;
				let g = Ut.window.activeTextEditor;
				if (!g) return;
				let D = new Ut.Range(
						l.range.start,
						u.positionAt(u.offsetAt(l.range.start) + l.text.length),
					),
					y = g.selections.find((N) => D.contains(N.active))?.active;
				if (!y) return;
				let P = {
						textDocument: e.code2ProtocolConverter.asTextDocumentIdentifier(u),
						selection: e.code2ProtocolConverter.asPosition(y),
						change: { rangeLength: l.rangeLength, rangeOffset: l.rangeOffset, text: l.text },
					},
					q = await e.sendRequest(FR.AutoInsertRequest.type, P);
				q && t && !m() && g.insertSnippet(new Ut.SnippetString(q));
			}, 100);
		}
	}
});
var Jy = E((jd) => {
	'use strict';
	Object.defineProperty(jd, '__esModule', { value: !0 });
	jd.activate = MR;
	var gs = require('vscode'),
		Ad = Gr();
	function MR(n, e) {
		let t;
		return gs.Disposable.from(
			e.onRequest(
				Ad.DocumentDrop_DataTransferItemAsStringRequest.type,
				async ({ mimeType: r }) => (await t.get(r)?.asString()) ?? '',
			),
			e.onRequest(
				Ad.DocumentDrop_DataTransferItemFileDataRequest.type,
				async ({ mimeType: r }) => (await t.get(r)?.asFile()?.data()) ?? new Uint8Array(),
			),
			gs.languages.registerDocumentDropEditProvider(n, {
				async provideDocumentDropEdits(r, i, s) {
					t = s;
					let o = await e.sendRequest(Ad.DocumentDropRequest.type, {
						textDocument: e.code2ProtocolConverter.asTextDocumentIdentifier(r),
						position: e.code2ProtocolConverter.asPosition(i),
						dataTransfer: [...s].map(([a, u]) => {
							let l = u.asFile();
							return {
								mimeType: a,
								value: u.value,
								file: l
									? { name: l.name, uri: l.uri ? e.code2ProtocolConverter.asUri(l.uri) : void 0 }
									: void 0,
							};
						}),
					});
					if (o) {
						let a = new gs.DocumentDropEdit(
							o.insertTextFormat === 2 ? new gs.SnippetString(o.insertText) : o.insertText,
						);
						if (
							(o.additionalEdit &&
								(a.additionalEdit = await e.protocol2CodeConverter.asWorkspaceEdit(
									o.additionalEdit,
								)),
							o.createDataTransferFile)
						) {
							a.additionalEdit ??= new gs.WorkspaceEdit();
							for (let u of o.createDataTransferFile) {
								let l = s.get(u.contentsMimeType)?.asFile();
								l &&
									a.additionalEdit.createFile(e.protocol2CodeConverter.asUri(u.uri), {
										ignoreIfExists: u.options?.ignoreIfExists,
										overwrite: u.options?.overwrite,
										contents: await l.data(),
									});
							}
						}
						return a;
					}
				},
			}),
		);
	}
});
var Ud = E((Wd) => {
	'use strict';
	Object.defineProperty(Wd, '__esModule', { value: !0 });
	var $d;
	function Hd() {
		if ($d === void 0) throw new Error('No runtime abstraction layer installed');
		return $d;
	}
	(function (n) {
		function e(t) {
			if (t === void 0) throw new Error('No runtime abstraction layer provided');
			$d = t;
		}
		n.install = e;
	})(Hd || (Hd = {}));
	Wd.default = Hd;
});
var zd = E((Ke) => {
	'use strict';
	Object.defineProperty(Ke, '__esModule', { value: !0 });
	Ke.config =
		Ke.loadMessageBundle =
		Ke.localize =
		Ke.format =
		Ke.setPseudo =
		Ke.isPseudo =
		Ke.isDefined =
		Ke.BundleFormat =
		Ke.MessageFormat =
			void 0;
	var Yy = Ud(),
		LR;
	(function (n) {
		((n.file = 'file'), (n.bundle = 'bundle'), (n.both = 'both'));
	})((LR = Ke.MessageFormat || (Ke.MessageFormat = {})));
	var AR;
	(function (n) {
		((n.standalone = 'standalone'), (n.languagePack = 'languagePack'));
	})((AR = Ke.BundleFormat || (Ke.BundleFormat = {})));
	var Qy;
	(function (n) {
		function e(t) {
			var r = t;
			return r && Kd(r.key) && Kd(r.comment);
		}
		n.is = e;
	})(Qy || (Qy = {}));
	function Kd(n) {
		return typeof n < 'u';
	}
	Ke.isDefined = Kd;
	Ke.isPseudo = !1;
	function jR(n) {
		Ke.isPseudo = n;
	}
	Ke.setPseudo = jR;
	function Zy(n, e) {
		var t;
		return (
			Ke.isPseudo && (n = '\uFF3B' + n.replace(/[aouei]/g, '$&$&') + '\uFF3D'),
			e.length === 0
				? (t = n)
				: (t = n.replace(/\{(\d+)\}/g, function (r, i) {
						var s = i[0],
							o = e[s],
							a = r;
						return (
							typeof o == 'string'
								? (a = o)
								: (typeof o == 'number' || typeof o == 'boolean' || o === void 0 || o === null) &&
									(a = String(o)),
							a
						);
					})),
			t
		);
	}
	Ke.format = Zy;
	function $R(n, e) {
		for (var t = [], r = 2; r < arguments.length; r++) t[r - 2] = arguments[r];
		return Zy(e, t);
	}
	Ke.localize = $R;
	function HR(n) {
		return (0, Yy.default)().loadMessageBundle(n);
	}
	Ke.loadMessageBundle = HR;
	function WR(n) {
		return (0, Yy.default)().config(n);
	}
	Ke.config = WR;
});
var iC = E((Un) => {
	'use strict';
	Object.defineProperty(Un, '__esModule', { value: !0 });
	Un.config = Un.loadMessageBundle = Un.BundleFormat = Un.MessageFormat = void 0;
	var Pn = require('path'),
		pn = require('fs'),
		UR = Ud(),
		Kt = zd(),
		tC = zd();
	Object.defineProperty(Un, 'MessageFormat', {
		enumerable: !0,
		get: function () {
			return tC.MessageFormat;
		},
	});
	Object.defineProperty(Un, 'BundleFormat', {
		enumerable: !0,
		get: function () {
			return tC.BundleFormat;
		},
	});
	var nC = Object.prototype.toString;
	function KR(n) {
		return nC.call(n) === '[object Number]';
	}
	function or(n) {
		return nC.call(n) === '[object String]';
	}
	function zR(n) {
		return n === !0 || n === !1;
	}
	function ki(n) {
		return JSON.parse(pn.readFileSync(n, 'utf8'));
	}
	var ca, ge;
	function VR() {
		if (
			((ge = {
				locale: void 0,
				language: void 0,
				languagePackSupport: !1,
				cacheLanguageResolution: !0,
				messageFormat: Kt.MessageFormat.bundle,
			}),
			or(process.env.VSCODE_NLS_CONFIG))
		)
			try {
				var n = JSON.parse(process.env.VSCODE_NLS_CONFIG),
					e = void 0;
				if (n.availableLanguages) {
					var t = n.availableLanguages['*'];
					or(t) && (e = t);
				}
				if (
					(or(n.locale) && (ge.locale = n.locale.toLowerCase()),
					e === void 0 ? (ge.language = ge.locale) : e !== 'en' && (ge.language = e),
					zR(n._languagePackSupport) && (ge.languagePackSupport = n._languagePackSupport),
					or(n._cacheRoot) && (ge.cacheRoot = n._cacheRoot),
					or(n._languagePackId) && (ge.languagePackId = n._languagePackId),
					or(n._translationsConfigFile))
				) {
					ge.translationsConfigFile = n._translationsConfigFile;
					try {
						ge.translationsConfig = ki(ge.translationsConfigFile);
					} catch {
						if (n._corruptedFile) {
							var r = Pn.dirname(n._corruptedFile);
							pn.exists(r, function (s) {
								s &&
									pn.writeFile(n._corruptedFile, 'corrupted', 'utf8', function (o) {
										console.error(o);
									});
							});
						}
					}
				}
			} catch {}
		((0, Kt.setPseudo)(ge.locale === 'pseudo'), (ca = Object.create(null)));
	}
	VR();
	function BR() {
		return (
			ge.languagePackSupport === !0 &&
			ge.cacheRoot !== void 0 &&
			ge.languagePackId !== void 0 &&
			ge.translationsConfigFile !== void 0 &&
			ge.translationsConfig !== void 0
		);
	}
	function Vd(n) {
		return function (e, t) {
			for (var r = [], i = 2; i < arguments.length; i++) r[i - 2] = arguments[i];
			if (KR(e)) {
				if (e >= n.length) {
					console.error(
						`Broken localize call found. Index out of bounds. Stacktrace is
: `.concat(new Error('').stack),
					);
					return;
				}
				return (0, Kt.format)(n[e], r);
			} else {
				if (or(t))
					return (
						console.warn('Message '.concat(t, " didn't get externalized correctly.")),
						(0, Kt.format)(t, r)
					);
				console.error(
					`Broken localize call found. Stacktrace is
: `.concat(new Error('').stack),
				);
			}
		};
	}
	function GR(n) {
		var e;
		if (ge.cacheLanguageResolution && e) e = e;
		else {
			if (Kt.isPseudo || !ge.language) e = '.nls.json';
			else
				for (var t = ge.language; t; ) {
					var r = '.nls.' + t + '.json';
					if (pn.existsSync(n + r)) {
						e = r;
						break;
					} else {
						var i = t.lastIndexOf('-');
						i > 0 ? (t = t.substring(0, i)) : ((e = '.nls.json'), (t = null));
					}
				}
			ge.cacheLanguageResolution && (e = e);
		}
		return n + e;
	}
	function XR(n) {
		for (var e = ge.language; e; ) {
			var t = Pn.join(n, 'nls.bundle.'.concat(e, '.json'));
			if (pn.existsSync(t)) return t;
			var r = e.lastIndexOf('-');
			r > 0 ? (e = e.substring(0, r)) : (e = void 0);
		}
		if (e === void 0) {
			var t = Pn.join(n, 'nls.bundle.json');
			if (pn.existsSync(t)) return t;
		}
	}
	function JR(n) {
		var e = ki(Pn.join(n, 'nls.metadata.json')),
			t = Object.create(null);
		for (var r in e) {
			var i = e[r];
			t[r] = i.messages;
		}
		return t;
	}
	function QR(n, e) {
		var t = ge.translationsConfig[n.id];
		if (t) {
			var r = ki(t).contents,
				i = ki(Pn.join(e, 'nls.metadata.json')),
				s = Object.create(null);
			for (var o in i) {
				var a = i[o],
					u = r[''.concat(n.outDir, '/').concat(o)];
				if (u) {
					for (var l = [], p = 0; p < a.keys.length; p++) {
						var m = a.keys[p],
							g = or(m) ? m : m.key,
							D = u[g];
						(D === void 0 && (D = a.messages[p]), l.push(D));
					}
					s[o] = l;
				} else s[o] = a.messages;
			}
			return s;
		}
	}
	function YR(n) {
		var e = new Date();
		pn.utimes(n, e, e, function () {});
	}
	function Bd(n, e) {
		return ((ca[n] = e), e);
	}
	function ZR(n, e) {
		var t,
			r = Pn.join(ge.cacheRoot, ''.concat(n.id, '-').concat(n.hash, '.json')),
			i = !1,
			s = !1;
		try {
			return ((t = JSON.parse(pn.readFileSync(r, { encoding: 'utf8', flag: 'r' }))), YR(r), t);
		} catch (o) {
			if (o.code === 'ENOENT') s = !0;
			else if (o instanceof SyntaxError)
				(console.log('Syntax error parsing message bundle: '.concat(o.message, '.')),
					pn.unlink(r, function (a) {
						a && console.error('Deleting corrupted bundle '.concat(r, ' failed.'));
					}),
					(i = !0));
			else throw o;
		}
		if (((t = QR(n, e)), !t || i)) return t;
		if (s)
			try {
				pn.writeFileSync(r, JSON.stringify(t), { encoding: 'utf8', flag: 'wx' });
			} catch (o) {
				if (o.code === 'EEXIST') return t;
				throw o;
			}
		return t;
	}
	function eC(n) {
		try {
			return JR(n);
		} catch (e) {
			console.log('Generating default bundle from meta data failed.', e);
			return;
		}
	}
	function eS(n, e) {
		var t;
		if (BR())
			try {
				t = ZR(n, e);
			} catch (i) {
				console.log('Load or create bundle failed ', i);
			}
		if (!t) {
			if (ge.languagePackSupport) return eC(e);
			var r = XR(e);
			if (r)
				try {
					return ki(r);
				} catch (i) {
					console.log('Loading in the box message bundle failed.', i);
				}
			t = eC(e);
		}
		return t;
	}
	function tS(n) {
		for (
			var e, t = Pn.dirname(n);
			(e = Pn.join(t, 'nls.metadata.header.json')), !pn.existsSync(e);
		) {
			var r = Pn.dirname(t);
			if (r === t) {
				e = void 0;
				break;
			} else t = r;
		}
		return e;
	}
	function Gd(n) {
		if (!n) return Kt.localize;
		var e = Pn.extname(n);
		if (
			(e && (n = n.substr(0, n.length - e.length)),
			ge.messageFormat === Kt.MessageFormat.both || ge.messageFormat === Kt.MessageFormat.bundle)
		) {
			var t = tS(n);
			if (t) {
				var r = Pn.dirname(t),
					i = ca[r];
				if (i === void 0)
					try {
						var s = JSON.parse(pn.readFileSync(t, 'utf8'));
						try {
							var o = eS(s, r);
							i = Bd(r, o ? { header: s, nlsBundle: o } : null);
						} catch (p) {
							(console.error('Failed to load nls bundle', p), (i = Bd(r, null)));
						}
					} catch (p) {
						(console.error('Failed to read header file', p), (i = Bd(r, null)));
					}
				if (i) {
					var a = n.substr(r.length + 1).replace(/\\/g, '/'),
						u = i.nlsBundle[a];
					return u === void 0
						? (console.error(
								'Messages for file '.concat(n, ' not found. See console for details.'),
							),
							function () {
								return 'Messages not found.';
							})
						: Vd(u);
				}
			}
		}
		if (ge.messageFormat === Kt.MessageFormat.both || ge.messageFormat === Kt.MessageFormat.file)
			try {
				var l = ki(GR(n));
				return Array.isArray(l)
					? Vd(l)
					: (0, Kt.isDefined)(l.messages) && (0, Kt.isDefined)(l.keys)
						? Vd(l.messages)
						: (console.error("String bundle '".concat(n, "' uses an unsupported format.")),
							function () {
								return 'File bundle has unsupported format. See console for details';
							});
			} catch (p) {
				p.code !== 'ENOENT' && console.error('Failed to load single file bundle', p);
			}
		return (
			console.error('Failed to load message bundle for file '.concat(n)),
			function () {
				return 'Failed to load message bundle. See console for details.';
			}
		);
	}
	Un.loadMessageBundle = Gd;
	function rC(n) {
		return (
			n &&
				(or(n.locale) &&
					((ge.locale = n.locale.toLowerCase()),
					(ge.language = ge.locale),
					(ca = Object.create(null))),
				n.messageFormat !== void 0 && (ge.messageFormat = n.messageFormat),
				n.bundleFormat === Kt.BundleFormat.standalone &&
					ge.languagePackSupport === !0 &&
					(ge.languagePackSupport = !1)),
			(0, Kt.setPseudo)(ge.locale === 'pseudo'),
			Gd
		);
	}
	Un.config = rC;
	UR.default.install(Object.freeze({ loadMessageBundle: Gd, config: rC }));
});
var sC = E((Xd) => {
	'use strict';
	Object.defineProperty(Xd, '__esModule', { value: !0 });
	Xd.activate = sS;
	var Xr = require('vscode'),
		nS = iC(),
		rS = Gr(),
		iS = nS.loadMessageBundle();
	function sS(n, e) {
		return Xr.commands.registerCommand(n, async (t) => {
			await Xr.window.withProgress(
				{
					location: Xr.ProgressLocation.Window,
					title: iS('progress.title', 'Finding file references'),
				},
				async (r) => {
					if (!t) {
						let u = Xr.window.activeTextEditor;
						if (!u) return;
						t = u.document.uri;
					}
					let i = await e.sendRequest(rS.FindFileReferenceRequest.type, {
						textDocument: { uri: t.toString() },
					});
					if (!i) return;
					let s = i.map((u) => e.protocol2CodeConverter.asLocation(u)),
						o = Xr.workspace.getConfiguration('references'),
						a = o.inspect('preferredLocation');
					await o.update('preferredLocation', 'view');
					try {
						await Xr.commands.executeCommand(
							'editor.action.showReferences',
							t,
							new Xr.Position(0, 0),
							s,
						);
					} finally {
						await o.update('preferredLocation', a?.workspaceFolderValue ?? a?.workspaceValue);
					}
				},
			);
		});
	}
});
var oC = E((Qd) => {
	'use strict';
	Object.defineProperty(Qd, '__esModule', { value: !0 });
	Qd.activate = aS;
	var Jd = require('vscode'),
		oS = Gr();
	function aS(n, e) {
		return Jd.commands.registerCommand(n, () => {
			Jd.window.activeTextEditor &&
				e.sendNotification(
					oS.ReloadProjectNotification.type,
					e.code2ProtocolConverter.asTextDocumentIdentifier(Jd.window.activeTextEditor.document),
				);
		});
	}
});
var Yd = E((sq, cC) => {
	'use strict';
	function Kn(n) {
		if (typeof n != 'string')
			throw new TypeError('Path must be a string. Received ' + JSON.stringify(n));
	}
	function aC(n, e) {
		for (var t = '', r = 0, i = -1, s = 0, o, a = 0; a <= n.length; ++a) {
			if (a < n.length) o = n.charCodeAt(a);
			else {
				if (o === 47) break;
				o = 47;
			}
			if (o === 47) {
				if (!(i === a - 1 || s === 1))
					if (i !== a - 1 && s === 2) {
						if (
							t.length < 2 ||
							r !== 2 ||
							t.charCodeAt(t.length - 1) !== 46 ||
							t.charCodeAt(t.length - 2) !== 46
						) {
							if (t.length > 2) {
								var u = t.lastIndexOf('/');
								if (u !== t.length - 1) {
									(u === -1
										? ((t = ''), (r = 0))
										: ((t = t.slice(0, u)), (r = t.length - 1 - t.lastIndexOf('/'))),
										(i = a),
										(s = 0));
									continue;
								}
							} else if (t.length === 2 || t.length === 1) {
								((t = ''), (r = 0), (i = a), (s = 0));
								continue;
							}
						}
						e && (t.length > 0 ? (t += '/..') : (t = '..'), (r = 2));
					} else
						(t.length > 0 ? (t += '/' + n.slice(i + 1, a)) : (t = n.slice(i + 1, a)),
							(r = a - i - 1));
				((i = a), (s = 0));
			} else o === 46 && s !== -1 ? ++s : (s = -1);
		}
		return t;
	}
	function cS(n, e) {
		var t = e.dir || e.root,
			r = e.base || (e.name || '') + (e.ext || '');
		return t ? (t === e.root ? t + r : t + n + r) : r;
	}
	var xi = {
		resolve: function () {
			for (var e = '', t = !1, r, i = arguments.length - 1; i >= -1 && !t; i--) {
				var s;
				(i >= 0 ? (s = arguments[i]) : (r === void 0 && (r = process.cwd()), (s = r)),
					Kn(s),
					s.length !== 0 && ((e = s + '/' + e), (t = s.charCodeAt(0) === 47)));
			}
			return ((e = aC(e, !t)), t ? (e.length > 0 ? '/' + e : '/') : e.length > 0 ? e : '.');
		},
		normalize: function (e) {
			if ((Kn(e), e.length === 0)) return '.';
			var t = e.charCodeAt(0) === 47,
				r = e.charCodeAt(e.length - 1) === 47;
			return (
				(e = aC(e, !t)),
				e.length === 0 && !t && (e = '.'),
				e.length > 0 && r && (e += '/'),
				t ? '/' + e : e
			);
		},
		isAbsolute: function (e) {
			return (Kn(e), e.length > 0 && e.charCodeAt(0) === 47);
		},
		join: function () {
			if (arguments.length === 0) return '.';
			for (var e, t = 0; t < arguments.length; ++t) {
				var r = arguments[t];
				(Kn(r), r.length > 0 && (e === void 0 ? (e = r) : (e += '/' + r)));
			}
			return e === void 0 ? '.' : xi.normalize(e);
		},
		relative: function (e, t) {
			if ((Kn(e), Kn(t), e === t || ((e = xi.resolve(e)), (t = xi.resolve(t)), e === t))) return '';
			for (var r = 1; r < e.length && e.charCodeAt(r) === 47; ++r);
			for (var i = e.length, s = i - r, o = 1; o < t.length && t.charCodeAt(o) === 47; ++o);
			for (var a = t.length, u = a - o, l = s < u ? s : u, p = -1, m = 0; m <= l; ++m) {
				if (m === l) {
					if (u > l) {
						if (t.charCodeAt(o + m) === 47) return t.slice(o + m + 1);
						if (m === 0) return t.slice(o + m);
					} else s > l && (e.charCodeAt(r + m) === 47 ? (p = m) : m === 0 && (p = 0));
					break;
				}
				var g = e.charCodeAt(r + m),
					D = t.charCodeAt(o + m);
				if (g !== D) break;
				g === 47 && (p = m);
			}
			var y = '';
			for (m = r + p + 1; m <= i; ++m)
				(m === i || e.charCodeAt(m) === 47) && (y.length === 0 ? (y += '..') : (y += '/..'));
			return y.length > 0
				? y + t.slice(o + p)
				: ((o += p), t.charCodeAt(o) === 47 && ++o, t.slice(o));
		},
		_makeLong: function (e) {
			return e;
		},
		dirname: function (e) {
			if ((Kn(e), e.length === 0)) return '.';
			for (var t = e.charCodeAt(0), r = t === 47, i = -1, s = !0, o = e.length - 1; o >= 1; --o)
				if (((t = e.charCodeAt(o)), t === 47)) {
					if (!s) {
						i = o;
						break;
					}
				} else s = !1;
			return i === -1 ? (r ? '/' : '.') : r && i === 1 ? '//' : e.slice(0, i);
		},
		basename: function (e, t) {
			if (t !== void 0 && typeof t != 'string')
				throw new TypeError('"ext" argument must be a string');
			Kn(e);
			var r = 0,
				i = -1,
				s = !0,
				o;
			if (t !== void 0 && t.length > 0 && t.length <= e.length) {
				if (t.length === e.length && t === e) return '';
				var a = t.length - 1,
					u = -1;
				for (o = e.length - 1; o >= 0; --o) {
					var l = e.charCodeAt(o);
					if (l === 47) {
						if (!s) {
							r = o + 1;
							break;
						}
					} else
						(u === -1 && ((s = !1), (u = o + 1)),
							a >= 0 && (l === t.charCodeAt(a) ? --a === -1 && (i = o) : ((a = -1), (i = u))));
				}
				return (r === i ? (i = u) : i === -1 && (i = e.length), e.slice(r, i));
			} else {
				for (o = e.length - 1; o >= 0; --o)
					if (e.charCodeAt(o) === 47) {
						if (!s) {
							r = o + 1;
							break;
						}
					} else i === -1 && ((s = !1), (i = o + 1));
				return i === -1 ? '' : e.slice(r, i);
			}
		},
		extname: function (e) {
			Kn(e);
			for (var t = -1, r = 0, i = -1, s = !0, o = 0, a = e.length - 1; a >= 0; --a) {
				var u = e.charCodeAt(a);
				if (u === 47) {
					if (!s) {
						r = a + 1;
						break;
					}
					continue;
				}
				(i === -1 && ((s = !1), (i = a + 1)),
					u === 46 ? (t === -1 ? (t = a) : o !== 1 && (o = 1)) : t !== -1 && (o = -1));
			}
			return t === -1 || i === -1 || o === 0 || (o === 1 && t === i - 1 && t === r + 1)
				? ''
				: e.slice(t, i);
		},
		format: function (e) {
			if (e === null || typeof e != 'object')
				throw new TypeError(
					'The "pathObject" argument must be of type Object. Received type ' + typeof e,
				);
			return cS('/', e);
		},
		parse: function (e) {
			Kn(e);
			var t = { root: '', dir: '', base: '', ext: '', name: '' };
			if (e.length === 0) return t;
			var r = e.charCodeAt(0),
				i = r === 47,
				s;
			i ? ((t.root = '/'), (s = 1)) : (s = 0);
			for (var o = -1, a = 0, u = -1, l = !0, p = e.length - 1, m = 0; p >= s; --p) {
				if (((r = e.charCodeAt(p)), r === 47)) {
					if (!l) {
						a = p + 1;
						break;
					}
					continue;
				}
				(u === -1 && ((l = !1), (u = p + 1)),
					r === 46 ? (o === -1 ? (o = p) : m !== 1 && (m = 1)) : o !== -1 && (m = -1));
			}
			return (
				o === -1 || u === -1 || m === 0 || (m === 1 && o === u - 1 && o === a + 1)
					? u !== -1 &&
						(a === 0 && i ? (t.base = t.name = e.slice(1, u)) : (t.base = t.name = e.slice(a, u)))
					: (a === 0 && i
							? ((t.name = e.slice(1, o)), (t.base = e.slice(1, u)))
							: ((t.name = e.slice(a, o)), (t.base = e.slice(a, u))),
						(t.ext = e.slice(o, u))),
				a > 0 ? (t.dir = e.slice(0, a - 1)) : i && (t.dir = '/'),
				t
			);
		},
		sep: '/',
		delimiter: ':',
		win32: null,
		posix: null,
	};
	xi.posix = xi;
	cC.exports = xi;
});
var uC = E((Zd) => {
	'use strict';
	Object.defineProperty(Zd, '__esModule', { value: !0 });
	Zd.activate = dS;
	var uS = Yd(),
		qn = require('vscode'),
		lS = Gr();
	function dS(n, e, t) {
		let r = [],
			i = qn.languages.createLanguageStatusItem(e, n),
			s,
			o;
		(a(),
			qn.window.onDidChangeActiveTextEditor(
				() => {
					(clearTimeout(o), (o = setTimeout(() => a, 100)));
				},
				void 0,
				r,
			),
			r.push(
				qn.commands.registerCommand(e, async () => {
					if (s) {
						let u = await qn.workspace.openTextDocument(s);
						await qn.window.showTextDocument(u);
					}
				}),
			),
			r.push(...r));
		async function a() {
			if (
				!qn.window.activeTextEditor ||
				!qn.languages.match(n, qn.window.activeTextEditor.document)
			)
				return;
			let u = await t.sendRequest(
				lS.GetMatchTsConfigRequest.type,
				t.code2ProtocolConverter.asTextDocumentIdentifier(qn.window.activeTextEditor.document),
			);
			u?.uri
				? ((s = qn.Uri.parse(u.uri)),
					(i.text = uS.relative(
						qn.workspace.rootPath?.replace(/\\/g, '/') || '/',
						s.fsPath.replace(/\\/g, '/'),
					)),
					(i.command = { title: 'Open config file', command: e }))
				: ((i.text = 'No tsconfig'), (i.command = void 0));
		}
	}
});
var dC = E((ef) => {
	'use strict';
	Object.defineProperty(ef, '__esModule', { value: !0 });
	ef.quickPick = fS;
	var lC = require('vscode');
	function fS(n, e) {
		return new Promise((t) => {
			let r = lC.window.createQuickPick(),
				i = [];
			for (let s of Array.isArray(n) ? n : [n]) {
				let o = Object.values(s);
				if (o.length) {
					i.length && i.push({ label: '', kind: lC.QuickPickItemKind.Separator });
					for (let a of o) a && i.push(a);
				}
			}
			((r.items = i),
				(r.placeholder = e),
				r.onDidChangeSelection((s) => {
					if (s[0])
						for (let o of Array.isArray(n) ? n : [n])
							for (let a in o) {
								let u = o[a];
								if (s[0] === u) {
									(t(a), r.hide());
									break;
								}
							}
				}),
				r.onDidHide(() => {
					(r.dispose(), t(void 0));
				}),
				r.show());
		});
	}
});
var fC = E((ms) => {
	'use strict';
	Object.defineProperty(ms, '__esModule', { value: !0 });
	ms.readFile = pS;
	ms.readDirectory = gS;
	ms.stat = mS;
	var tf = require('vscode'),
		hS = new TextDecoder('utf8');
	async function pS(n) {
		try {
			return hS.decode(await tf.workspace.fs.readFile(n));
		} catch {}
	}
	async function gS(n) {
		try {
			return await tf.workspace.fs.readDirectory(n);
		} catch {
			return [];
		}
	}
	async function mS(n) {
		try {
			return await tf.workspace.fs.stat(n);
		} catch {}
	}
});
var hC = E((uq, vS) => {
	vS.exports = {
		name: 'typescript',
		author: 'Microsoft Corp.',
		homepage: 'https://www.typescriptlang.org/',
		version: '6.0.3',
		license: 'Apache-2.0',
		description: 'TypeScript is a language for application scale JavaScript development',
		keywords: ['TypeScript', 'Microsoft', 'compiler', 'language', 'javascript'],
		bugs: { url: 'https://github.com/microsoft/TypeScript/issues' },
		repository: { type: 'git', url: 'https://github.com/microsoft/TypeScript.git' },
		main: './lib/typescript.js',
		typings: './lib/typescript.d.ts',
		bin: { tsc: './bin/tsc', tsserver: './bin/tsserver' },
		engines: { node: '>=14.17' },
		files: [
			'bin',
			'lib',
			'!lib/enu',
			'LICENSE.txt',
			'README.md',
			'SECURITY.md',
			'ThirdPartyNoticeText.txt',
			'!**/.gitattributes',
		],
		devDependencies: {
			'@dprint/formatter': '^0.4.1',
			'@dprint/typescript': '0.93.4',
			'@esfx/canceltoken': '^1.0.0',
			'@eslint/js': '^10.0.1',
			'@octokit/rest': '^22.0.1',
			'@types/chai': '^4.3.20',
			'@types/minimist': '^1.2.5',
			'@types/mocha': '^10.0.10',
			'@types/ms': '^2.1.0',
			'@types/node': 'latest',
			'@types/source-map-support': '^0.5.10',
			'@types/which': '^3.0.4',
			'@typescript-eslint/rule-tester': '^8.56.1',
			'@typescript-eslint/type-utils': '^8.56.1',
			'@typescript-eslint/utils': '^8.56.1',
			'azure-devops-node-api': '^15.1.3',
			c8: '^10.1.3',
			chai: '^4.5.0',
			chokidar: '^4.0.3',
			diff: '^8.0.3',
			dprint: '^0.49.1',
			esbuild: '^0.27.3',
			eslint: '^10.0.2',
			'eslint-plugin-regexp': '^3.0.0',
			'fast-xml-parser': '^5.4.1',
			glob: '^10.5.0',
			globals: '^17.4.0',
			hereby: '^1.12.0',
			'jsonc-parser': '^3.3.1',
			knip: '^5.85.0',
			minimist: '^1.2.8',
			mocha: '^10.8.2',
			'mocha-fivemat-progress-reporter': '^0.1.0',
			'monocart-coverage-reports': '^2.12.9',
			ms: '^2.1.3',
			picocolors: '^1.1.1',
			playwright: '^1.58.2',
			'source-map-support': '^0.5.21',
			tslib: '^2.8.1',
			typescript: '^5.9.3',
			'typescript-eslint': '^8.56.1',
			which: '^3.0.1',
		},
		overrides: { 'typescript@*': '$typescript' },
		scripts: {
			test: 'hereby runtests-parallel --light=false',
			'test:eslint-rules': 'hereby run-eslint-rules-tests',
			build: 'npm run build:compiler && npm run build:tests',
			'build:compiler': 'hereby local',
			'build:tests': 'hereby tests',
			'build:tests:notypecheck': 'hereby tests --no-typecheck',
			clean: 'hereby clean',
			gulp: 'hereby',
			lint: 'hereby lint',
			knip: 'hereby knip',
			format: 'dprint fmt',
			'setup-hooks': 'node scripts/link-hooks.mjs',
		},
		browser: {
			fs: !1,
			os: !1,
			path: !1,
			crypto: !1,
			buffer: !1,
			'source-map-support': !1,
			inspector: !1,
			perf_hooks: !1,
		},
		packageManager: 'npm@8.19.4',
		volta: { node: '22.22.0', npm: '8.19.4' },
		gitHead: '050880ce59e30b356b686bd3144efe24f875ebc8',
	};
});
var mC = E((da) => {
	'use strict';
	Object.defineProperty(da, '__esModule', { value: !0 });
	da.activate = CS;
	da.getTsdk = sf;
	var la = Yd(),
		nt = require('vscode'),
		yS = dC(),
		rf = fC(),
		ua = 'node_modules/typescript/lib',
		nf = 'typescript.tsdk';
	function CS(n, e, t, r, i) {
		let s = [],
			o = nt.languages.createLanguageStatusItem(e, n);
		return (
			(o.command = { title: 'Select Version', command: e }),
			s.push({ dispose: () => o.dispose() }),
			s.push(nt.commands.registerCommand(e, a)),
			nt.workspace.onDidChangeConfiguration(u, void 0, s),
			nt.window.onDidChangeActiveTextEditor(l, void 0, s),
			l(),
			nt.Disposable.from(...s)
		);
		async function a() {
			let p = await sf(t),
				m = gC(),
				g = await pC(),
				D = !!g,
				y = !!m && !g?.isWeb,
				P = m !== ua && !g?.isWeb;
			if (!D && !y && !P) {
				(await nt.window.showErrorMessage(
					`Could not find any TypeScript version. Please point your \`${nf}\` setting to a valid TypeScript distribution.`,
					'Open Settings',
				)) === 'Open Settings' && nt.commands.executeCommand('workbench.action.openSettings', nf);
				return;
			}
			let q = await (0, yS.quickPick)([
				{
					useVSCodeTsdk: D
						? {
								label: (p?.isWorkspacePath ? '' : '\u2022 ') + "Use VS Code's Version",
								description: g.version,
								detail: g.isWeb ? g.path : void 0,
							}
						: void 0,
					useConfigWorkspaceTsdk: y
						? {
								label: (p?.isWorkspacePath ? '\u2022 ' : '') + 'Use Workspace Version',
								description:
									(await vs((await of(m)) ?? '/')) ??
									'Could not load the TypeScript version at this path',
								detail: m,
							}
						: void 0,
					useDefaultWorkspaceTsdk: P
						? {
								label: (p?.isWorkspacePath ? '\u2022 ' : '') + 'Use Workspace Version',
								description:
									(await vs((await of(ua)) ?? '/')) ??
									'Could not load the TypeScript version at this path',
								detail: ua,
							}
						: void 0,
				},
			]);
			if (q === void 0) return;
			q === 'useDefaultWorkspaceTsdk' &&
				(await nt.workspace.getConfiguration('typescript').update('tsdk', ua));
			let N = q === 'useConfigWorkspaceTsdk' || q === 'useDefaultWorkspaceTsdk';
			(N !== af(t) && (t.workspaceState.update('typescript.useWorkspaceTsdk', N), i?.()), l());
		}
		function u(p) {
			p.affectsConfiguration(nf) && af(t) && i?.();
		}
		async function l() {
			let p = (await sf(t))?.version;
			((o.text = p ?? 'x.x.x'), (o.text = r(o.text)));
		}
	}
	async function sf(n) {
		if (af(n)) {
			let t = gC();
			if (t) {
				let r = await of(t);
				if (r) {
					let i = await vs(r);
					if (i !== void 0) return { tsdk: r, version: i, isWorkspacePath: !0 };
				}
			}
		}
		let e = await pC();
		return e ? { tsdk: e.path, version: e.version, isWorkspacePath: !1 } : void 0;
	}
	async function of(n) {
		if (la.isAbsolute(n)) {
			let e = nt.Uri.joinPath(nt.Uri.file(n), 'typescript.js');
			if ((await rf.stat(e))?.type === nt.FileType.File) return n;
		} else if (nt.workspace.workspaceFolders)
			for (let e of nt.workspace.workspaceFolders) {
				let t = la.join(e.uri.fsPath.replace(/\\/g, '/'), n),
					r = nt.Uri.joinPath(nt.Uri.file(t), 'typescript.js');
				if ((await rf.stat(r))?.type === nt.FileType.File) return t;
			}
	}
	async function pC() {
		let n = nt.extensions.getExtension('ms-vscode.vscode-typescript-next');
		if (n) {
			let t = la.join(n.extensionPath.replace(/\\/g, '/'), 'node_modules/typescript/lib'),
				r = await vs(t);
			return r ? { path: t, version: r, isWeb: !1 } : void 0;
		}
		if (nt.env.appRoot) {
			let t = la.join(nt.env.appRoot.replace(/\\/g, '/'), 'extensions/node_modules/typescript/lib'),
				r = await vs(t);
			return r ? { path: t, version: r, isWeb: !1 } : void 0;
		}
		let e = hC().version;
		return { path: `/node_modules/typescript@${e}/lib`, version: e, isWeb: !0 };
	}
	function gC() {
		return nt.workspace.getConfiguration('typescript').get('tsdk')?.replace(/\\/g, '/');
	}
	function af(n) {
		return n.workspaceState.get('typescript.useWorkspaceTsdk', !1);
	}
	async function vs(n) {
		let i = n.toString().split('/').slice(0, -1).join('/') + '/package.json';
		try {
			let s = await rf.readFile(nt.Uri.file(i));
			if (s === void 0) return;
			let o = JSON.parse(s);
			return !o || typeof o.version != 'string' ? void 0 : o.version;
		} catch {
			return;
		}
	}
});
var yC = E((Oe) => {
	'use strict';
	var bS =
			(Oe && Oe.__createBinding) ||
			(Object.create
				? function (n, e, t, r) {
						r === void 0 && (r = t);
						var i = Object.getOwnPropertyDescriptor(e, t);
						((!i || ('get' in i ? !e.__esModule : i.writable || i.configurable)) &&
							(i = {
								enumerable: !0,
								get: function () {
									return e[t];
								},
							}),
							Object.defineProperty(n, r, i));
					}
				: function (n, e, t, r) {
						(r === void 0 && (r = t), (n[r] = e[t]));
					}),
		_S =
			(Oe && Oe.__exportStar) ||
			function (n, e) {
				for (var t in n)
					t !== 'default' && !Object.prototype.hasOwnProperty.call(e, t) && bS(e, n, t);
			};
	Object.defineProperty(Oe, '__esModule', { value: !0 });
	Oe.currentLabsVersion =
		Oe.middleware =
		Oe.getTsdk =
		Oe.activateTsVersionStatusItem =
		Oe.activateTsConfigStatusItem =
		Oe.activateReloadProjects =
		Oe.activateFindFileReferences =
		Oe.activateDocumentDropEdit =
		Oe.activateAutoInsertion =
			void 0;
	Oe.parseServerCommand = Ii;
	Oe.createLabsInfo = qS;
	var ar = require('vscode'),
		wS = Gr(),
		DS = Xy();
	Object.defineProperty(Oe, 'activateAutoInsertion', {
		enumerable: !0,
		get: function () {
			return DS.activate;
		},
	});
	var RS = Jy();
	Object.defineProperty(Oe, 'activateDocumentDropEdit', {
		enumerable: !0,
		get: function () {
			return RS.activate;
		},
	});
	var SS = sC();
	Object.defineProperty(Oe, 'activateFindFileReferences', {
		enumerable: !0,
		get: function () {
			return SS.activate;
		},
	});
	var TS = oC();
	Object.defineProperty(Oe, 'activateReloadProjects', {
		enumerable: !0,
		get: function () {
			return TS.activate;
		},
	});
	var PS = uC();
	Object.defineProperty(Oe, 'activateTsConfigStatusItem', {
		enumerable: !0,
		get: function () {
			return PS.activate;
		},
	});
	var vC = mC();
	Object.defineProperty(Oe, 'activateTsVersionStatusItem', {
		enumerable: !0,
		get: function () {
			return vC.activate;
		},
	});
	Object.defineProperty(Oe, 'getTsdk', {
		enumerable: !0,
		get: function () {
			return vC.getTsdk;
		},
	});
	_S(ps(), Oe);
	Oe.middleware = {
		async provideCodeActions(n, e, t, r, i) {
			let s = await i(n, e, t, r);
			return (
				(s = s?.map((o) =>
					o instanceof ar.CodeAction ? (o.command && (o.command = Ii(o.command)), o) : Ii(o),
				)),
				s
			);
		},
		async resolveCodeAction(n, e, t) {
			let r = await t(n, e);
			return (r?.command && (r.command = Ii(r.command)), r);
		},
		async provideCodeLenses(n, e, t) {
			let r = await t(n, e);
			return ((r = r?.map((i) => (i.command && (i.command = Ii(i.command)), i))), r);
		},
		async resolveCodeLens(n, e, t) {
			let r = await t(n, e);
			return (r?.command && (r.command = Ii(r.command)), r);
		},
	};
	function Ii(n) {
		return n.command === 'editor.action.rename' && n.arguments
			? {
					...n,
					arguments: [
						[
							ar.Uri.parse(n.arguments[0]),
							new ar.Position(n.arguments[1].line, n.arguments[1].character),
						],
					],
				}
			: n.command === 'editor.action.showReferences' && n.arguments
				? {
						...n,
						arguments: [
							ar.Uri.parse(n.arguments[0]),
							new ar.Position(n.arguments[1].line, n.arguments[1].character),
							n.arguments[2].map(
								(e) =>
									new ar.Location(
										ar.Uri.parse(e.uri),
										new ar.Range(
											e.range.start.line,
											e.range.start.character,
											e.range.end.line,
											e.range.end.character,
										),
									),
							),
						],
					}
				: n;
	}
	Oe.currentLabsVersion = '2.3.1';
	function qS(n) {
		let e = new ar.EventEmitter(),
			t = {
				volarLabs: {
					version: Oe.currentLabsVersion,
					languageClients: [],
					languageServerProtocol: wS,
					onDidAddLanguageClient: e.event,
				},
			};
		return {
			extensionExports: t,
			addLanguageClient(r) {
				(t.volarLabs.languageClients.push(r), e.fire(r));
			},
		};
	}
});
var bC = E((fq, CC) => {
	'use strict';
	CC.exports = ps();
});
var OS = {};
PC(OS, { activate: () => kS, deactivate: () => xS });
module.exports = qC(OS);
var fa = Oi(require('node:path')),
	ES = Oi(Zg()),
	zt = Oi(yC()),
	zn = Oi(require('vscode')),
	ys = Oi(bC()),
	kr;
async function kS(n) {
	let e = zn.workspace.getConfiguration('astro.language-server'),
		{ workspaceFolders: t } = zn.workspace,
		r = t?.[0].uri.fsPath,
		i = await IS(n.workspaceState);
	typeof i == 'string' && i.trim() !== '' && typeof r == 'string'
		? ((i = fa.isAbsolute(i) ? i : fa.join(r, i)), console.info(`Using language server at ${i}`))
		: (i = void 0);
	let s = i ? require.resolve(i) : zn.Uri.joinPath(n.extensionUri, 'dist/node/server.js').fsPath,
		o = { execArgv: [] },
		a = { execArgv: ['--nolazy', '--inspect=' + Math.floor(Math.random() * 2e4 + 1e4)] },
		u = {
			run: { module: s, transport: ys.TransportKind.ipc, options: o },
			debug: { module: s, transport: ys.TransportKind.ipc, options: a },
		},
		l = e.get('runtime');
	l && ((u.run.runtime = l), (u.debug.runtime = l), console.info(`Using ${l} as runtime`));
	let p = zn.workspace.getConfiguration('astro').get('content-intellisense'),
		m = zn.workspace.getConfiguration('astro').get('auto-import-cache.enabled') === !1,
		g = {
			typescript: { tsdk: (await (0, zt.getTsdk)(n)).tsdk },
			contentIntellisense: p,
			disableAutoImportCache: m,
		},
		D = {
			documentSelector: [
				{ language: 'astro' },
				...(p ? [{ language: 'markdown' }, { language: 'mdx' }, { language: 'markdoc' }] : []),
			],
			initializationOptions: g,
		};
	((kr = new ys.LanguageClient('astro', 'Astro Language Server', u, D)),
		await kr.start(),
		(0, zt.activateAutoInsertion)('astro', kr),
		(0, zt.activateFindFileReferences)('astro.findFileReferences', kr),
		(0, zt.activateReloadProjects)('astro.reloadProjects', kr),
		(0, zt.activateTsConfigStatusItem)('astro', 'astro.openTsConfig', kr),
		(0, zt.activateTsVersionStatusItem)('astro', 'astro.selectTypescriptVersion', n, (P) => P));
	let y = (0, zt.createLabsInfo)(ES);
	return (y.addLanguageClient(kr), y.extensionExports);
}
function xS() {
	return kr?.stop();
}
async function IS(n) {
	let e = 'astro.language-server',
		t = zn.workspace.getConfiguration(e).inspect('ls-path'),
		r = t?.globalLanguageValue || t?.defaultLanguageValue || t?.globalValue || t?.defaultValue,
		i =
			t?.workspaceFolderLanguageValue ||
			t?.workspaceLanguageValue ||
			t?.workspaceFolderValue ||
			t?.workspaceValue,
		s = `${e}.useLocalLS`,
		o = n.get(s);
	if (o === void 0 && i !== void 0) {
		let a =
				'This workspace contains an Astro Language Server version. Would you like to use the workplace version?',
			u = 'Allow',
			l = 'Dismiss',
			p = 'Never in This Workspace',
			m = await zn.window.showInformationMessage(a, u, l, p);
		m === u ? (await n.update(s, !0), (o = !0)) : m === p && (await n.update(s, !1));
	}
	return (o === !0 && i) || r;
}
0 && (module.exports = { activate, deactivate });
