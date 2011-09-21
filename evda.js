function EvDa () {
  var 
    // Underscore shortcuts ... pleases the minifier
    each = _.each,
    keys = _.keys,
    extend = _.extend,
    flatten = _.flatten,

    // Internals
    data = arguments[0] || {},
    debug = function(){},
    setterMap = {},
    funHandle = 0,
    funMap = {},
    hook = ['test', /* 'before', */ 'when', 'after' /*, 'finally' */ ],
    stageMap = {},
    keyCheck = {};

  function Invoke ( key, value, meta ) {
    debug('set', key, value);
    var 
      old = data[key],
      callback,
      runList,
      result = {};

    data[key] = value;

    each( hook, function(stage) {
      runList = stageMap[stage][key];

      // Runlist is an array
      each(runList, function(callback, index) {

        result[ index ] = callback ( value, {
          meta: meta,
          old: old,
          current: value,
          key: key,
          remove: function () {
            // we just set a flag here to
            // maintain index integrity
            callback.rm = 1;
          }

        });
      });

      each(runList, function(callback) {
        if ( callback.rm ) {
          remove ( callback );
        }
      });
    });

    keyCheck[key] = 0;
    return result;
  }

  function Test ( key, value, meta ) {
    var  
      times = stageMap.test[key].length,
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

    each ( stageMap.test[key], function ( callback ) {
      callback ( value, {
        meta: meta,
        old: data[key],
        callback: check,
        key: key,
        remove: function () {
          remove ( callback );
        }
      });
    });
  }

  function register ( callback ) {
    callback.refs = [];
    funMap[ callback.ix = ++funHandle ] = callback;
  }

  function run ( keyList, value, meta ) {
    var result = {};

    each ( flatten([ keyList ]), function ( key ) {
      if ( ! keyCheck[key] ) {
      
        keyCheck[key] = 1;

        result[key] = stageMap.test[key] ?
          Test ( key, value, meta ) :
          Invoke ( key, value, meta );
      }
    });

    return result;
  }

  function remove ( handle ) {
    each ( handle.refs, function ( tuple ) {
      var
        stage = tuple[0],
        key = tuple[1];

      stageMap[stage][key] = 
        _.without( stageMap[stage][key], handle );
    });

    delete funMap[handle.ix];
  }

  function chain ( scope ) {
    var context = {};

    each ( keys ( pub ), function ( func ) {
      context[func] = function () {
        
        pub[func].apply ( this, [scope].concat( _.toArray ( arguments ) ) );

        return context;
      }
    });

    return context;
  }

  function pub ( scope, value ) {
    var 
      len = arguments.length,
      context = {};

    if ( len == 0 ) {
      return {
        data: data, 
        events: stageMap, 
        functions: funMap
      };
    }

    if ( len == 1 ) {
      if ( _.isObject(scope) ) {

        each( scope, function( _value, _key ) {
          context[_key] = pub ( _key, _value );
        });

        return context;
      }

      if( scope.search(/[*?]/) + 1 ) {
        return _.select( keys(data), function(toTest) {
          return toTest.match(scope);
        });
      }

      return data[ scope ];
    } 

    return chain ( scope ) [
      _.isFunction ( value ) ? 'when' : 'run' 
    ] ( value );
  }

  each ( hook, function ( stage ) {
    stageMap[stage] = {};

    pub[stage] = function ( keyList, callback ) {

      register ( callback );

      each ( flatten([ keyList ]), function ( key ) {
        debug('reg', stage, key);

        stageMap[stage][key] = 
          (stageMap[stage][key] || []).concat(callback);

        callback.refs.push ( [stage, key] );
      });

      return extend ( 
        pub,
        { info: callback }
      );
    }
  });

  // remove the test
  hook.shift();

  return extend(pub, {

    once: function ( key, callback ) {
      var ret = pub.when ( key, callback );

      ret.info.rm = 1;
      return ret;
    },

    setter: function( key, lambda ) {
      setterMap[key] = lambda;
      if (key in data) {
        pub.isset(key);
      }
    },

    isset: function ( key, callback ) {
      // If I know how to set this key but
      // I just haven't done it yet, run through
      // those functions now.
      if( setterMap[key] ) {
        debug('setter', key);
        setterMap[key]();

        delete setterMap[key];
      }

      if ( callback ) {
        return key in data ?
          callback ( data[key] ) :
          pub.once ( key, callback );
      }

      return key in data;
    },

    firstset: pub.isset,

    run: run,
    on: pub,

    set: function(k, v) {
      return pub ( k, arguments.length == 1 ? 1 : v );
    },

    // unset doesn't hook
    unset: function(key) { delete data[key]; },

    debug: function() {
      debug = console.log;
    },

    remove: remove
  });
}
