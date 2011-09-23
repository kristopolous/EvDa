function EvDa (map) {
  var 
    // Underscore shortcuts ... pleases the minifier
    each = _.each,
    extend = _.extend,
    size = _.size,

    // Constants
    TEST = 'test',
    ON = 'on',
    AFTER = 'after',

    // Internals
    data = map || {},
    setterMap = {},
    stageMap = {};

  function Invoke ( key, value, meta ) {
    // Set the key to the new value.
    // The old value is beind passed in
    // through the meta
    data[key] = value;

    each(
      (stageMap[ON + key] || []).concat
      (stageMap[AFTER + key] || []), 
      function(callback) {

        callback ( value, meta );

        if ( callback.X ) {
          del ( callback );
        }
      });
  }

  function del ( handle ) {
    each ( handle.$, function ( stagekey ) {
      stageMap[ stagekey ] = _.without( stageMap[ stagekey ], handle );
    });
  }

  function pub ( scope, value, meta ) {
    var len = size(arguments);

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
          scope[_key] = pub ( _key, _value, meta );
        });

        return scope;
      }

      return data[ scope ];
    } 

    // If there were two arguments and if one of them was a function, then
    // this needs to be registered.  Otherwise, we are setting a value.
    return pub [ _.isFunction ( value ) ? ON : 'set' ] ( scope, value, meta );
  }

  // Register callbacks for
  // test, on, and after.
  each ( [ON, AFTER, TEST], function ( stage ) {

    // register the function
    pub[stage] = function ( key, callback ) {

      // This is the back-reference map to this callback
      // so that we can unregister it in the future.
      (callback.$ || (callback.$ = [])).push ( stage + key );

      (stageMap[stage + key] || (stageMap[stage + key] = [])).push ( callback );

      return callback;
    }
  });

  return extend(pub, {
    // Exposing the internal variables so that
    // extensions can be made.
    data: data,
    events: stageMap,

    // The one time callback gets a property to
    // the end of the object to notify our future-selfs
    // that we ought to remove the function.
    once: function ( key, callback ) {
      return extend(
        pub[ON] ( key, callback ),
        { X: 1 }
      );
    },

    // Unlike much of the reset of the code,
    // setters have single functions.
    setter: function ( key, callback ) {
      setterMap[key] = callback;

      if (key in data) {
        pub.isset( key );
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

    set: function(key, value, meta) {
      var 
        Key = TEST + key,
        times = size(stageMap[ Key ]),
        failure = 0;

      function check ( ok ) {
        failure += (ok === false);

        if ( ! --times ) {
          if ( ! failure ) { 
            Invoke ( key, value, meta );
          }
        }
      }

      // Invoke will also get done
      // but it will have no semantic
      // meaning, so it's fine.
      meta = {
        meta: meta || {},
        old: data[key],
        done: check,
        key: key
      };

      if (times) {
        each ( stageMap[ Key ], function ( callback ) {
          callback ( value, meta );
        });
      } else {
        Invoke ( key, value, meta );
      }

      return value;
    },

    // unset doesn't hook
    unset: function(key) { delete data[key]; },

    del: del
  });
}
