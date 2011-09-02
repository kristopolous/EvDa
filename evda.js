function EvDa () {
  var 
    pub = {},

    // Underscore shortcuts ... pleases the minifier
    each = _.each,
    keys = _.keys,
    extend = _.extend,
    isFunction = _.isFunction,
    isArray = _.isArray,
    isString = _.isString,
    isNumber = _.isNumber,
    isObject = _.isObject,
    slice = Array.prototype.slice,

    // Internals
    data = {},
    funHandle = 0,
    funMap = {},
    stageMap = {},
    keyCheck = {},
    shared = {};

  function Stage ( key, value, meta, opts ) {
    var runList = stageMap[opts.stage][key];

    // This closure is needed in order to save a pointer
    // to the callback, which may be run asynchronously.
    each(runList, function(callback, ix) {
      opts.result[ix] = callback ( value, {
        meta: meta,
        oldValue: opts.oldValue,
        currentValue: data[key],
        key: key,
        deregister: function () {
          callback.once = true;
        }
      });
    });

    each(runList, function(callback) {
      if(callback.once) {
        deregister(callback);
      }
    });
  }

  function Invoke ( key, value, meta ) {
    var 
      oldValue = data[key],
      result = {};

    // if ( value !== undefined ) {
      data[key] = value;
    // }

    each( ['invoke', 'after'], function(which) {
      Stage ( key, value, meta, {
        result: result, 
        stage: which,
        oldValue: oldValue
      });
    });

    keyCheck[key] = false;
    return result;
  }

  function Test ( key, value, meta ) {
    var  
      success = 0,
      failure = 0;

    function check ( ok ) {
      ok = (ok !== false);

      success += ok;
      failure += !ok;

      if ( success + failure == stageMap.test[key].length ) {
        if ( ! failure ) { 
          Invoke ( key, value, meta );
        }

        keyCheck[key] = false;
      }
    }

    each ( stageMap.test[key], function ( cb ) {
      cb ( value, {
        meta: meta,
        oldValue: data[key],
        callback: check,
        key: key,
        deregister: function () {
          deregister ( cb );
        }
      });
    });
  }

  function Set ( key, value, meta ) {
    if ( ! keyCheck[key] ) {
    
      keyCheck[key] = true;

      return ( stageMap.test[key] ) ?
        Test ( key, value, meta ) :
        Invoke ( key, value, meta );
    }
  }

  function register ( callback ) {
    callback.ix = ++funHandle;
    callback.refList = [];
    funMap[callback.ix] = callback;

    return callback;
  }

  function run ( keyList, value, meta ) {
    var result = {};

    if ( isString ( keyList ) ) {
      keyList = [keyList];
    }

    each ( keyList, function ( key ) {
      result[key] = Set ( key, value, meta );
    });

    return result;
  }

  function deregister ( handle ) {
    if ( handle.refList ) {

      each ( handle.refList, function ( tuple ) {
        var
          stage = tuple[0],
          key = tuple[1];

        stageMap[stage][key] = 
          _.without( stageMap[stage][key], handle );
      });
    }

    delete funMap[handle.ix];
  }

  shared = {
    // If we are pushing and popping a non-array then
    // it's better that the browser tosses the error
    // to the user than we try to be graceful and silent
    // Therein, we don't try to handle input validation
    // and just try it anyway
    push: function ( key, value ) {
      data[key] = data[key] || [];
      data[key].current = data[key].push ( value );
      
      return run ( key, data[key] );
    },

    pop: function ( key ) {
      data[key].pop ();
      data[key].current = _.last(data[key]);

      return run ( key, data[key] );
    },

    onSet: function ( key, callback ) {
      return (shared.invoke ( key, callback )).handle;
    },

    once: function ( key, stageMap ) {
      var handle = shared.onSet ( key, stageMap );

      handle.once = true;
      return handle;
    },

    decr: function ( key ) {
      // if key isn't in data, it returns 0 and sets it
      // if key is in data but isn't a number, it returns NaN and sets it
      // if key is 1, then it gets reduced to 0, getting 0,
      // if key is any other number, than it gets set
      return run ( key, data[key] - 1 || 0 );
    },

    incr: function ( key ) {
      // we can't use the same trick here because if we
      // hit 0, it will auto-increment to 1
      return run ( key, isNumber(data[key]) ? (data[key] + 1) : 1 );
    },

    notNull: function ( key, cb ) {
      if ( ( key in data ) && data[key] !== null ) {
        cb ( data[key] );
      } else {
        return shared.once ( key, cb );
      }
    },

    share: function ( prop ) {
      return chain ({meta: prop}); 
    },

    run: run,

    deregister: deregister
  };


  each ( ['test', 'invoke', 'after'], function ( stage ) {
    stageMap[stage] = {};

    shared[stage] = function ( keyList, callback ) {

      if ( callback ) {
        callback = register ( callback );

        if ( isString ( keyList ) ) {
          keyList = [keyList];
        }

        each ( keyList, function ( key ) {

          stageMap[stage][key] = 
            (stageMap[stage][key] || []).concat(callback);

          callback.refList.push ( [stage, key] );
        });
      }

      return extend ( 
        { handle: callback },
        shared
      );
    }
  });

  function chain ( obj ) {
    var context = {};

    if ( !obj.scope ) {
      obj.scope = [];
    } else {
      obj.scope = [obj.scope];
    }

    obj.meta = obj.meta || [];

    each ( keys ( shared ), function ( func ) {
      context[func] = function () {
        
        shared[func].apply ( this, 
          obj.scope.concat ( 
            slice.call ( arguments ), 
            obj.meta 
          ) 
        );

        return context;
      }
    });

    return context;
  }

  // Events have chains
  pub.Event = function ( scope, invoke ) {
    var len = arguments.length;

    if ( len == 0 ) {
      return stageMap;
    }

    var context = chain ({ scope: scope });
     
    if ( isFunction ( invoke ) ) {
      context.invoke ( invoke );
    } else if ( len > 1 ){
      context.run ( invoke );
    } else if ( isObject(scope) ) {
      context = {};

      each( scope, function(key) {
        context[key] = pub.Event ( key, scope[key] );
      });
    }

    return context;
  }

  // Data has getters and setters
  pub.Data = function ( key, value ) {
    var 
      args = slice.call ( arguments ),
      len = args.length,
      ret = {},
      keyRegex;

    if ( len == 0 ) {
      return data;
    }

    if ( isObject( key ) ) {
      each( key, function(el) {
        ret[el] = pub.Data ( el, key[el] );
      });

      return ret;
    }

    if ( len == 1 ) {
      if( key.search(/[\*\?]/) != -1 ) {
        keyRegex = new RegExp( key, 'ig' );

        return _.select( keys(data), function(toTest) {
          return toTest.match(keyRegex);
        });
      }

      if ( isArray ( data[key] ) ) { 
        try { 
          // There's an IE9 bug that can mangle array pointers
          data[key].slice();
        } catch ( ex ) {
          data[key] = slice.call ( data[key] );
        }
      }

      return data[key];
    } 

    if (isArray(this)) {
      args = args.concat(this);
    }

    return run.apply ( this, args );
  }

  extend ( pub.Event, shared );
  extend ( pub.Data, shared );

  // All aliases to the master catchall
  pub.get = pub.set = pub.Data;

  return pub;
}
