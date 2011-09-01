function EvDa ( ) {
  var 
    pub = {},

    // Underscore shortcuts
    each = _.each,
    keys = _.keys,
    slice = Array.prototype.slice,
    data = {},
    fHandle = 0,
    fMap = {},
    stageMap = {},
    keyCheck = {},
    Do = {},
    shared = {};

  Do.Stage = function ( key, value, meta, opts ) {
    var 
      runList = stageMap[opts.stage][key],
      len;
    
    if ( ! runList ) {
      return opts.result;
    }

    len = runList.length;

    // This closure is needed in order to save a pointer
    // to the callback, which may be run asynchronously.
    each(runList, function(callback, ix) {
      opts.result[ix] = callback ( value, {
        meta: meta,
        oldValue: opts.oldValue,
        currentValue: data[key],
        key: key,
        deregister: function ( ) {
          callback.oneShot = true;
        }
      });
    });

    for ( ix = 0; ix < len; ix++ ) {
      if ( runList[ix].oneShot ) {
        deregister ( runList[ix] );
      }
    }
  }

  Do.Invoke = function ( key, value, meta ) {
    var 
      oldValue = data[key],
      result = {};

    if ( value !== undefined ) {
      data[key] = value;
    }

    Do.Stage ( key, value, meta, {
      result: result, 
      stage: 'invoke', 
      oldValue: oldValue
    });

    Do.Stage ( key, value, meta, {
      result: result, 
      stage: 'after',
      oldValue: oldValue
    });

    delete keyCheck[key];
    return result;
  }

  Do.Test = function ( key, value, meta ) {
    var  
      len = stageMap.test[key].length,
      result = {},
      success = 0,
      failure = 0;

    function check ( ok ) {
      if ( arguments.length == 0 ) {
        ok = true;
      }

      success += ok;
      failure += !ok;

      if ( success + failure == len ) {
        if ( failure ) { 
          keyCheck[key] = false;
        } else {
          return Do.Invoke ( key, value, meta );
        }
      }
    }

    each ( stageMap.test[key], function ( cb ) {
      result[cb.ix] = 
        cb ( value, {
          meta: meta,
          oldValue: data[key],
          callback: check,
          key: key,
          deregister: function ( ) {
            deregister ( cb );
          }
        });
    });
  }

  Do.Run = function ( key, value, meta ) {
    var result = {};

    if ( keyCheck[key] ) {
      return result;
    }
  
    keyCheck[key] = true;

    if ( ! stageMap.test[key] ) {
      result = Do.Invoke ( key, value, meta );
    } else {
      result = Do.Test ( key, value, meta );
    }

    return result;
  }

  function register ( callback ) {
    callback.ix = ++fHandle;
    callback.refList = [];
    fMap[callback.ix] = callback;

    return callback;
  }

  function inherit ( opts ) {
    return _.extend ( opts.child, opts.parent );
  }

  function deregister ( handle ) {
    if ( handle.refList ) {

      each ( handle.refList, function ( tuple ) {
        var
          stage = tuple[0],
          key = tuple[1], 

          offset = _.indexOf ( stageMap[stage][key], handle );

        stageMap[stage][key].splice ( offset, 1 );
      });
    }

    delete fMap[handle.ix];
  }


  shared = {
    ifChanged: function ( key, value ) {
      if (! ( key in data ) ) {           
        return shared.run ( key, value );
      }

      if ( data[key] !== value ) {
        return shared.run ( key, value );
      }

      return false;
    },

    popandpush: function ( key, value ) {
      if ( !is.array ( data[key] ) ) {
        data[key] = [];
      }

      data[key].pop ( );
      data[key].push ( value );
      data[key].current = value;

      return shared.run ( key, data[key] );
    },

    pop: function ( key ) {
      if ( !is.array ( data[key] ) ) {
        return false;
      }

      data[key].pop ( );
      if ( data[key].length > 0 ) {
        data[key].current = data[key][data[key].length - 1];
      } else {
        data[key].current = undefined;
      }

      return shared.run ( key, data[key] );
    },

    append: function ( key, value ) {
      if ( !is.array ( data[key] ) ) {
        data[key] = [];
      }

      data[key].push ( value );
      data[key].current = value;
      
      return shared.run ( key, data[key] );
    },

    setHash: function ( key, map ) {
      return shared.run ( key, _.extend ( true, map, data[key] ) );
    },

    onSet: function ( key, callback ) {
      var obj = shared.invoke ( key, callback );
      return obj.handle;
    },

    decr: function ( key ) {
      if ( key in data && typeof data[key] == 'number' ) {
        return shared.run ( key, data[key] - 1 );
      } else {
        return shared.run ( key, 0 );
      }
    },

    incr: function ( key ) {
      if ( key in data && typeof data[key] == 'number' ) {
        return shared.run ( key, data[key] + 1 );
      } else {
        return shared.run ( key, 1 );
      }
    },

    run: function ( keyList, value, meta ) {
      var result = {};

      if ( _.isString ( keyList ) ) {
        keyList = [keyList];
      }

      each ( keyList, function ( key ) {
        result[key] = Do.Run ( key, value, meta );
      });

      return result;
    },

    notNull: function ( key, cb ) {
      if ( ( key in data ) && data[key] !== null ) {
        cb ( data[key] );
      } else {
        return shared.onSet.once ( key, cb );
      }
    },

    meta: function ( prop ) {
      return chain ({meta: prop}); 
    },

    deregister: deregister
  };

  shared.push = shared.append;
  shared.share = shared.meta;

  shared.onSet.once = function ( key, stageMap ) {
    var handle = shared.onSet ( key, stageMap );

    handle.oneShot = true;
    return handle;
  };

  each ( 'test,invoke,after'.split ( ',' ), function ( stage ) {
    stageMap[stage] = {};

    shared[stage] = function ( keyList, callback ) {

      if ( callback ) {
        callback = register ( callback );

        if ( _.isString ( keyList ) ) {
          keyList = [keyList];
        }

        each ( keyList, function ( key ) {

          if ( !stageMap[stage][key] ) {
            stageMap[stage][key] = [];
          }

          stageMap[stage][key].push ( callback );

          callback.refList.push ( [stage, key] );
        });
      }

      return inherit ({
        child: {handle: callback},
        parent: shared
      });
    }
  });

  function chain ( obj ) {
    var context = {};

    if ( !obj.scope ) {
      obj.scope = [];
    } else {
      obj.scope = [obj.scope];
    }

    if ( !obj.meta ) {
      obj.meta = [];
    }

    each ( keys ( shared ), function ( func ) {
      context[func] = function ( ){
        
        shared[func].apply ( this, obj.scope.concat ( slice.call ( arguments ), obj.meta ) );

        return context;
      }
    });

    return context;
  }

  // Events have chains
  pub.Event = function ( scope, invoke ) {
    if ( arguments.length == 0 ) {
      return stageMap;
    }

    var context = chain ({ scope: scope });
     
    if ( _.isFunction ( invoke ) ) {
      context.invoke ( invoke );
    } else if ( arguments.length > 1 ){
      context.run ( invoke );
    } else if ( arguments[0].constructor == Object ) {
      context = {};
      for ( var key in arguments[0] ) {
        context[key] = pub.Event ( key, arguments[0][key] );
      }
    }

    return context;
  }

  // Data has getters and setters
  pub.Data = function ( key, value ) {
    var 
      args = slice.call ( arguments ),
      ret = {},
      params = [];

    if ( arguments.length === 0 ) {
      return data;
    }

    if ( typeof key === 'object' ) {
      for ( var el in key ) {
        ret[el] = arguments.callee.apply ( this, [el, key[el]] );
      }

      return ret;
    }

    if ( arguments.length == 1 ) {
      if( key.search(/[\*\?]/) != -1 ) {
        var 
          keyRegex = new RegExp( key, 'ig' ),
          ret = [];

        each( keys(data), function(toTest) {
          if (toTest.match(keyRegex)) {
            ret.push(toTest);
          }
        });

        return ret;
      }

      if ( _.isArray ( data[key] ) ) { 
        try { 
          _.isFunction ( data[key].push );
        // There's an IE9 bug that can mangle data pointers
        } catch ( ex ) {
          console.log ( "woops, caught a bad error for " + key );
          data[key] = slice.call ( data[key] );
        }
      }

      return data[key];
    } 

    if ( this.constructor == Array ) {
      params = this;
    }

    return shared.run.apply ( this, args.concat ( params ) );
  }

  inherit ({
    child: pub.Event,
    parent: shared
  });

  inherit ({
    child: pub.Data,
    parent: shared
  });

  // All aliases to the master catchall
  shared.set = 
    pub.Data.set = 
    pub.get = 
    pub.set = pub.Data;

  return pub;
}
