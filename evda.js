function EvDa (map) {
  var 
    // Underscore shortcuts ... pleases the minifier
    each = _.each,
    extend = _.extend,
    flatten = _.flatten,

    // Internals
    data = map || {},

    setterMap = {},
    T = 'test',
    hook = [T, /* 'before', */ 'when', 'after' /*, 'finally' */ ],
    stageMap = {},
    keyCheck = {};

  function Invoke ( key, value, meta ) {
    var 
      oldValue = data[key],
      runList,
      result = {};

    data[key] = value;

    each( hook, function(stage) {
      runList = stageMap[stage + key];

      // Runlist is an array
      each(runList, function(callback, index) {

        result[ index ] = callback ( value, {
          meta: meta,
          old: oldValue,
          now: value,
          key: key,
          del: function () {
            // we just set a flag here to
            // maintain index integrity
            callback.X = 1;
          }

        });
      });

      each(runList, function(callback) {
        if ( callback.X ) {
          del ( callback );
        }
      });
    });

    keyCheck[key] = 0;
    return result;
  }

  function Test ( key, value, meta ) {
    var  
      Key = T + key,
      times = stageMap[ Key ].length,
      failure = 0;

    function check ( ok ) {
      times --;
      failure += (ok === false);

      if ( ! times ) {
        if ( ! failure ) { 
          Invoke ( key, value, meta );
        }

        keyCheck[key] = 0;
      }
    }

    each ( stageMap[ Key ], function ( callback ) {
      callback ( value, {
        meta: meta,
        old: data[key],
        done: check,
        key: key,
        del: function () {
          del ( callback );
        }
      });
    });
  }

  function run ( keyList, value, meta ) {
    var result = {};

    each ( flatten([ keyList ]), function ( key ) {
      if ( ! keyCheck[key] ) {
      
        keyCheck[key] = 1;

        result[key] = stageMap[T + key] ?
          Test ( key, value, meta ) :
          Invoke ( key, value, meta );
      }
    });

    return result;
  }

  function del ( handle ) {
    each ( handle.$, function ( stagekey ) {
      stageMap[ stagekey ] = _.without( stageMap[ stagekey ], handle );
    });
  }

  function pub ( scope, value, meta ) {
    var 
      len = arguments.length,
      context = {};

    // If there was one argument, then this is
    // either a getter or the object style
    // invocation.
    if ( len == 1 ) {

      // The object style invocation will return
      // handles associated with all the keys that
      // went in. There *could* be a mix and match
      // of callbacks and setters, but that would
      // be fine I guess...
      if( _.isObject(scope) ) {

        each( scope, function( _value, _key ) {
          context[_key] = pub ( _key, _value );
        });

        return context;
      }

      if( scope.search(/[*?]/) + 1 ) {
        return _.select( _.keys(data), function(toTest) {
          return toTest.match(scope);
        });
      }

      return data[ scope ];
    } 

    return len ? 
      // If there were two arguments and if one of them was a function, then
      // this needs to be registered.  Otherwise, we are setting a value.
      pub [ _.isFunction ( value ) ? 'when' : 'set' ] ( scope, value, meta ) : 

      // If there were no arguments (!len) then we should just return crap
      // as if we were debugging.
      { data: data, events: stageMap };
  }

  // Register callbacks for
  // test, when, and after.
  each ( hook, function ( stage ) {

    // register the function
    pub[stage] = function ( keyList, callback ) {

      // This is the back-reference map to this callback
      // so that we can unregister it in the future.
      callback.$ || (callback.$ = []);

      each ( flatten([ keyList ]), function ( key ) {
        (stageMap[stage + key] || (stageMap[stage + key] = [])).push(callback);

        callback.$.push ( stage + key );
      });

      return callback;
    }
  });

  // remove the test
  hook.shift();

  return extend(pub, {

    // The one time callback gets a property to
    // the end of the object to notify our future-selfs
    // that we ought to remove the function.
    once: function ( key, callback ) {
      return extend(
        pub.when ( key, callback ),
        { X: 1 }
      );
    },

    // Unlike much of the reset of the code,
    // setters have single functions.
    setter: function ( key, callback ) {
      setterMap[key] = callback;

      if (key in data) {
        pub.isset(key);
      }
    },

    isset: function ( key, callback ) {
      // If I know how to set this key but
      // I just haven't done it yet, run through
      // those functions now.
      if( setterMap[key] ) {
        setterMap[key]();

        // This is functionally the same as a delete
        // for our purposes.  Also, this should not
        // grow enormous so it's an inexpensive 
        // optimization.
        setterMap[key] = 0;
      }

      if ( callback ) {
        return key in data ?
          callback ( data[key] ) :
          pub.once ( key, callback );
      }

      return key in data;
    },

    on: pub,

    set: function(k, v, m) {
      // If v is not supplied, then we default with the
      // value 1, which degrades to true.  In order to
      // save a byte from ==, we swap the args in the
      // tri-state operator. 
      return run ( k, arguments.length - 1 ? v : 1, m );
    },

    // unset doesn't hook
    unset: function(key) { delete data[key]; },

    del: del
  });
}
