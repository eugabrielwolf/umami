!(function () {
  'use strict';
  function e(e) {
    var t = this.constructor;
    return this.then(
      function (n) {
        return t.resolve(e()).then(function () {
          return n;
        });
      },
      function (n) {
        return t.resolve(e()).then(function () {
          return t.reject(n);
        });
      },
    );
  }
  var t = setTimeout;
  function n(e) {
    return Boolean(e && void 0 !== e.length);
  }
  function r() {}
  function o(e) {
    if (!(this instanceof o)) throw new TypeError('Promises must be constructed via new');
    if ('function' != typeof e) throw new TypeError('not a function');
    (this._state = 0),
      (this._handled = !1),
      (this._value = void 0),
      (this._deferreds = []),
      c(e, this);
  }
  function i(e, t) {
    for (; 3 === e._state; ) e = e._value;
    0 !== e._state
      ? ((e._handled = !0),
        o._immediateFn(function () {
          var n = 1 === e._state ? t.onFulfilled : t.onRejected;
          if (null !== n) {
            var r;
            try {
              r = n(e._value);
            } catch (e) {
              return void u(t.promise, e);
            }
            s(t.promise, r);
          } else (1 === e._state ? s : u)(t.promise, e._value);
        }))
      : e._deferreds.push(t);
  }
  function s(e, t) {
    try {
      if (t === e) throw new TypeError('A promise cannot be resolved with itself.');
      if (t && ('object' == typeof t || 'function' == typeof t)) {
        var n = t.then;
        if (t instanceof o) return (e._state = 3), (e._value = t), void a(e);
        if ('function' == typeof n)
          return void c(
            ((r = n),
            (i = t),
            function () {
              r.apply(i, arguments);
            }),
            e,
          );
      }
      (e._state = 1), (e._value = t), a(e);
    } catch (t) {
      u(e, t);
    }
    var r, i;
  }
  function u(e, t) {
    (e._state = 2), (e._value = t), a(e);
  }
  function a(e) {
    2 === e._state &&
      0 === e._deferreds.length &&
      o._immediateFn(function () {
        e._handled || o._unhandledRejectionFn(e._value);
      });
    for (var t = 0, n = e._deferreds.length; t < n; t++) i(e, e._deferreds[t]);
    e._deferreds = null;
  }
  function f(e, t, n) {
    (this.onFulfilled = 'function' == typeof e ? e : null),
      (this.onRejected = 'function' == typeof t ? t : null),
      (this.promise = n);
  }
  function c(e, t) {
    var n = !1;
    try {
      e(
        function (e) {
          n || ((n = !0), s(t, e));
        },
        function (e) {
          n || ((n = !0), u(t, e));
        },
      );
    } catch (e) {
      if (n) return;
      (n = !0), u(t, e);
    }
  }
  (o.prototype['catch'] = function (e) {
    return this.then(null, e);
  }),
    (o.prototype.then = function (e, t) {
      var n = new this.constructor(r);
      return i(this, new f(e, t, n)), n;
    }),
    (o.prototype['finally'] = e),
    (o.all = function (e) {
      return new o(function (t, r) {
        if (!n(e)) return r(new TypeError('Promise.all accepts an array'));
        var o = Array.prototype.slice.call(e);
        if (0 === o.length) return t([]);
        var i = o.length;
        function s(e, n) {
          try {
            if (n && ('object' == typeof n || 'function' == typeof n)) {
              var u = n.then;
              if ('function' == typeof u)
                return void u.call(
                  n,
                  function (t) {
                    s(e, t);
                  },
                  r,
                );
            }
            (o[e] = n), 0 == --i && t(o);
          } catch (e) {
            r(e);
          }
        }
        for (var u = 0; u < o.length; u++) s(u, o[u]);
      });
    }),
    (o.resolve = function (e) {
      return e && 'object' == typeof e && e.constructor === o
        ? e
        : new o(function (t) {
            t(e);
          });
    }),
    (o.reject = function (e) {
      return new o(function (t, n) {
        n(e);
      });
    }),
    (o.race = function (e) {
      return new o(function (t, r) {
        if (!n(e)) return r(new TypeError('Promise.race accepts an array'));
        for (var i = 0, s = e.length; i < s; i++) o.resolve(e[i]).then(t, r);
      });
    }),
    (o._immediateFn =
      ('function' == typeof setImmediate &&
        function (e) {
          setImmediate(e);
        }) ||
      function (e) {
        t(e, 0);
      }),
    (o._unhandledRejectionFn = function (e) {
      'undefined' != typeof console &&
        console &&
        console.warn('Possible Unhandled Promise Rejection:', e);
    });
  var l = (function () {
    if ('undefined' != typeof self) return self;
    if ('undefined' != typeof window) return window;
    if ('undefined' != typeof global) return global;
    throw new Error('unable to locate global object');
  })();
  'Promise' in l
    ? l.Promise.prototype['finally'] || (l.Promise.prototype['finally'] = e)
    : (l['Promise'] = o),
    self.fetch ||
      (self.fetch = function (e, t) {
        return (
          (t = t || {}),
          new Promise(function (n, r) {
            var o = new XMLHttpRequest(),
              i = [],
              s = [],
              u = {},
              a = function () {
                return {
                  ok: 2 == ((o.status / 100) | 0),
                  statusText: o.statusText,
                  status: o.status,
                  url: o.responseURL,
                  text: function () {
                    return Promise.resolve(o.responseText);
                  },
                  json: function () {
                    return Promise.resolve(JSON.parse(o.responseText));
                  },
                  blob: function () {
                    return Promise.resolve(new Blob([o.response]));
                  },
                  clone: a,
                  headers: {
                    keys: function () {
                      return i;
                    },
                    entries: function () {
                      return s;
                    },
                    get: function (e) {
                      return u[e.toLowerCase()];
                    },
                    has: function (e) {
                      return e.toLowerCase() in u;
                    },
                  },
                };
              };
            for (var f in (o.open(t.method || 'get', e, !0),
            (o.onload = function () {
              o.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (e, t, n) {
                i.push((t = t.toLowerCase())), s.push([t, n]), (u[t] = u[t] ? u[t] + ',' + n : n);
              }),
                n(a());
            }),
            (o.onerror = r),
            (o.withCredentials = 'include' == t.credentials),
            t.headers))
              o.setRequestHeader(f, t.headers[f]);
            o.send(t.body || null);
          })
        );
      });
  var d = 'http://192.168.86.78:8000',
    h = 'umami.session',
    p = window.screen,
    v = p.width,
    w = p.height,
    y = window.navigator.language,
    m = window.location,
    _ = m.hostname,
    g = m.pathname,
    b = m.search,
    j = window.localStorage,
    P = window.document;
  function T(e, t) {
    return fetch(e, { method: 'post', body: JSON.stringify(t) }).then(function (e) {
      return e.json();
    });
  }
  var R = P.querySelector('script[data-website-id]');
  if (R) {
    var S = R.getAttribute('data-website-id');
    if (S) {
      var F = P.referrer,
        x = v + 'x' + w,
        E = '' + g + b;
      j.getItem(h) ||
        T(d + '/api/session', { website_id: S, hostname: _, url: E, screen: x, language: y }).then(
          function (e) {
            j.setItem(h, JSON.stringify(e));
          },
        ),
        T(d + '/api/collect', {
          type: 'pageview',
          payload: { url: E, referrer: F, session: JSON.parse(j.getItem(h)) },
        }).then(function (e) {
          e.status || j.removeItem(h);
        });
    }
  }
})();