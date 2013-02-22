//
// EvDa Events and Data v1.0
// https://github.com/kristopolous/EvDa
//
// Copyright 2011, Chris McKenzie
// Dual licensed under the MIT or GPL Version 2 licenses.
//
function EvDa (imported) {
  var 
    BASE = '__base',
    slice = Array.prototype.slice,  
    toString = Object.prototype.toString,
    isArray = [].isArray || function(obj) { return toString.call(obj) === '[object Array]' },
    isFunction = function(obj) { return !!(obj && obj.constructor && obj.call && obj.apply) },
    isString = function(obj) { return !!(obj === '' || (obj && obj.charCodeAt && obj.substr)) },
    isNumber = function(obj) { return toString.call(obj) === '[object Number]' },
    isObject = function(obj) {
      if(isString(obj)) {
        return false;
      }

      return obj == null ? 
        String( obj ) == 'object' : 
        toString.call(obj) === '[object Object]' || true ;
    },

    toArray = function(obj) {
      return slice.call(obj);
    },

    each = [].forEach ?
      function (obj, cb) {
        if (isArray(obj) || obj.length) { 
          toArray(obj).forEach(cb);
        } else {
          for( var key in obj ) {
            cb(key, obj[key]);
          }
        }
      } :

      function (obj, cb) {
        if (isArray(obj)) {
          for ( var i = 0, len = obj.length; i < len; i++ ) { 
            cb(obj[i], i);
          }
        } else {
          for( var key in obj ) {
            cb(key, obj[key]);
          }
        }
      },

    last = function(obj) {
      return obj.length ? obj[obj.length - 1] : undefined;
    },

    keys = ({}).keys || function (obj) {
      if(isArray(obj)) { 
        return obj;
      }
      var ret = [];

      for(var key in obj) {
        ret.push(key);
      }

      return ret;
    },

    without = function(collection, item) {
      var ret = [];
      each(collection, function(which) {
        if(which !== item) {
          ret.push(which);
        }
      });
      return ret;
    },

    uniq = function(obj) {
      var 
        old, 
        ret = [];

      each(keys(obj).sort(), function(which) {
        if(which != old) {
          old = which;
          ret.push(which);
        }
      });
      return ret;
    },

    select = function(obj, test) {
      var ret = [];
      each(obj, function(which) {
        if(test(which)) { ret.push (which); }
      });
      return ret;
    },

    size = function(obj) {
      return (obj && 'length' in obj) ? obj.length : 0;
    },

    map = [].map ?
      function(array, cb) { 
        return array.map(cb) 
      } : 

      function(array, cb) {
        var ret = [];

        for ( var i = 0, len = array.length; i < len; i++ ) { 
          ret.push(cb(array[i], i));
        }

        return ret;
      },

    clone = function(obj) {
      if(isArray(obj)) { return slice.call(obj); }
      if(isObject(obj)) { return extend(obj, {}); }
      return obj;
    },

    extend = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (source[prop] !== void 0) {
            obj[prop] = source[prop];
          }
        }
      });
      return obj;
    },

    // Constants
    ON = 'on',
    AFTER = 'after',

    // The one time callback gets a property to
    // the end of the object to notify our future-selfs
    // that we ought to remove the function.
    ONCE = {once: 1},

    // Internals
    data = imported || {},
    setterMap = {},
    eventMap = {};

  // This is the main invocation function. After
  // you declare an instance and call that instance
  // as a function, this is what gets run.
  function pub ( scope, value, meta ) {
    // If there was one argument, then this is
    // either a getter or the object style
    // invocation.
    if ( arguments.length == 1 ) {

      // The object style invocation will return
      // handles associated with all the keys that
      // went in. There *could* be a mix and match
      // of callbacks and setters, but that would
      // be fine I guess...
      if( isObject(scope) ) {
        var ret = {};

        // Object style should be executed as a transaction
        // to avoid ordinals of the keys making a substantial
        // difference in the existence of the values
        each( scope, function( _key, _value ) {
          ret[_key] = pub ( _key, _value, meta, 0, 1 );
        });

        // After the callbacks has been bypassed, then we
        // run all of them a second time, this time the
        // dependency graphs from the object style transactional
        // invocation should be satisfied
        each( ret, function( _key, _value ) {
          if(isFunction(ret[_key]) && !isFunction(scope[_key])) {
            scope[_key] = ret[_key]();
          }
        });

        return scope;
      } else if (isArray(scope)) {
        return map(scope, function(which) {
          return pub(which, value, meta);
        });
      }

      return data[ scope ];
    } 

    // If there were two arguments and if one of them was a function, then
    // this needs to be registered.  Otherwise, we are setting a value.
    return pub [ isFunction ( value ) ? ON : 'set' ].apply(this, arguments);
  }

  // Register callbacks for
  // test, on, and after.
  each ( [ON, AFTER, 'test'], function ( stage ) {

    // register the function
    pub[stage] = function ( key, callback, meta ) {
      if ( !callback ) {
        callback = key;
        key = BASE;
      }

      // This is the back-reference map to this callback
      // so that we can unregister it in the future.
      (callback.$ || (callback.$ = [])).push ( stage + key );

      (eventMap[stage + key] || (eventMap[stage + key] = [])).push ( callback );

      return extend(callback, meta);
    }
  });

  function del ( handle ) {
    each ( handle.$, function( stagekey ) {
      eventMap[ stagekey ] = without( eventMap[ stagekey ], handle );
    });
  }

  function isset ( key, callback ) {
    if( isObject(key) ) {

      each( key, function( _key, _value ) {
        key[_key] = isset( _key, _value );
      });

      // Return the entire object as the result
      return key;
    }

    // If I know how to set this key but
    // I just haven't done it yet, run through
    // that function now.
    if( setterMap[key] ) {
      // If someone explicitly sets the k/v in the setter
      // that is fine, that means this function isn't run.
      setterMap[key](function(value) {
        pub(key, value);
      });

      delete setterMap[key];
    }

    if ( callback ) {
      // If it already exists, then just call the function
      // that came in.
      //
      // Otherwise have it called once on a set. This means
      // that the setter is inherently asynchronous since
      // the execution of this function is continued to be
      // blocked until the key is set.
      return key in data ?
        callback ( data[key] ) :
        pub ( key, callback, ONCE );
    }

    return key in data;
  };

  extend(pub, {
    // Exposing the internal variables so that
    // extensions can be made.
    list: {},
    db: data,
    events: eventMap,
    del: del,
    whenSet: isset,
    isset: isset,

    // Unlike much of the reset of the code,
    // setters have single functions.
    setter: function ( key, callback ) {
      setterMap[key] = callback;

      // If I am setting a setter and
      // a function is already waiting on it,
      // then run it now.
      if (eventMap[ON + key]) {
        return isset( key );
      }
    },

    when: function ( key, toTest, lambda ) {
      return pub(key, function(value) {
        if(value === toTest) {
          lambda(value);
        }
      });
    },

    incr: function ( key ) {
      // we can't use the same trick here because if we
      // hit 0, it will auto-increment to 1
      return pub.set ( key, isNumber(data[key]) ? (data[key] + 1) : 1 );
    },

    decr: function ( key ) {
      // if key isn't in data, it returns 0 and sets it
      // if key is in data but isn't a number, it returns NaN and sets it
      // if key is 1, then it gets reduced to 0, getting 0,
      // if key is any other number, than it gets set
      return pub.set ( key, data[key] - 1 || 0 );
    },

    // If we are pushing and popping a non-array then
    // it's better that the browser tosses the error
    // to the user than we try to be graceful and silent
    // Therein, we don't try to handle input validation
    // and just try it anyway
    push: function ( key, value ) {
      if (size(arguments) == 1) {
        value = key;
        key = BASE;
      }

      return pub.set ( key, [].concat(data[key] || [], [value]) );
    },

    pop: function ( key ) {
      return pub.set ( key || BASE, data[key].slice(0, -1) );
    },

    traceList: [],

    group: function ( list ) {
      var 
        opts = toArray(arguments),
        list = opts.shift(),
        ret = pub.apply(0, opts);

      ( pub.list[list] || (pub.list[list] = []) );

      if(isFunction(ret)) {
        pub.list[list].push(ret);
      } else {
        each(ret, function(value, key) {
          pub.list[list].push(value);
        });
      } 
      return function() {
        return pub.group.apply(0, [list].concat(toArray(arguments)));
      }
    },

    set: function (key, value, _meta, bypass, _noexecute) {
      var 
        testKey = 'test' + key,
        args = slice.call(arguments),
        times = size(eventMap[ testKey ]),
        failure,

        // Invoke will also get done
        // but it will have no semantic
        // meaning, so it's fine.
        meta = {
          meta: _meta || {},
          old: clone(data[key]),
          key: key,
          done: function ( ok ) {
            failure |= (ok === false);

            if ( ! --times ) {
              if ( ! failure ) { 
                pub.set ( key, value, _meta, 1 );
              }
            }
          }
        };

      meta.result = meta.done;

      each ( pub.traceList, function ( callback ) {
        callback ( args );
      });

      if (times && !bypass) {
        each ( eventMap[ testKey ], function ( callback ) {
          callback ( value, meta );
        });
      } else {
        // Set the key to the new value.
        // The old value is beind passed in
        // through the meta
        data[key] = value;

        var cback = function(){
          each(
            (eventMap[ON + key] || []).concat
            (eventMap[AFTER + key] || []), 
            function(callback) {

              if(!callback.S) {
                callback ( value, meta );

                if ( callback.once ) {
                  del ( callback );
                }
              }
            });
          return value;
        }

        if(!_noexecute) {
          return cback();
        } else {
          return cback;
        }
      }

      // Don't return the value...
      // return the current value of that key.
      // 
      // This is because keys can be denied
      return data[key];
    },

    once: function ( key, lambda ) {
      return pub ( key, lambda, { once: true } );
    },

    enable: function ( listName ) {
      each(pub.list[listName], function(callback) {
        if ( callback.S && callback.S[listName] ) {
          delete callback.S[listName];
        }

        if ( size(callback.S) == 0 ) {
          delete callback.S;
        }
      });
      return pub.list[listName];
    },

    setadd: function ( key, value ) {
      return pub ( key, uniq(( data[key] || [] ).concat([value])) );
    },

    setdel: function ( key, value ) {
      return pub ( key, without(( data[key] || [] ), value) );
    },

    disable: function ( listName ) {
      each(pub.list[listName], function(callback) {
        ( callback.S || (callback.S = {}) ) [ listName ] = true;
      });
      return pub.list[listName];
    },

    unset: function () { 
      var bool = true;
      each(arguments, function(which) {
        bool &= (which in data);
        delete data[which];
      });
      return bool;
    },

    find: function ( regex ) {
      return select( keys(data), function(toTest) {
        return toTest.match(regex);
      });
    },

    changed: function(key, callback) {
      if( !callback ) {
        callback = key;
        key = BASE;
      }

      return pub.on(key, function(value, meta) {
        var 
          newlen = size(value),
          oldlen = size(meta.old);
        
        if(newlen - oldlen == 1) {
          callback(last(value));
        } else if (newlen > oldlen) { 
          callback(toArray(value).slice(oldlen));
        }
      });
    },

    sniff: function () {
      var 
        ignoreMap = {},
        startTime = +new Date();

      pub.traceList.unshift(function(args){
        if(!ignoreMap[args[0]]) {
          console.log((+new Date()) - startTime, args);
        }
      });
         
      // neuter this function but don't populate
      // the users keyspace.
      pub.sniff = function(key) {
        if(key) {
          ignoreMap[key] = !ignoreMap[key];
          return "[Un]ignoring " + key;
        } 
        return keys(ignoreMap);
      }
    }
  });

  pub.setAdd = pub.setadd;
  pub.setDel = pub.setdel;
  pub.isSet = pub.isset;

  pub.get = pub;
  pub.change = pub.on;
  pub.add = pub.push;

  return pub;
}
