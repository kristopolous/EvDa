EvdaAdd(function() {
  pub.incr = function ( key ) {
    // we can't use the same trick here because if we
    // hit 0, it will auto-increment to 1
    return run ( key, _.isNumber(data[key]) ? (data[key] + 1) : 1 );
  };

  pub.decr = function ( key ) {
    // if key isn't in data, it returns 0 and sets it
    // if key is in data but isn't a number, it returns NaN and sets it
    // if key is 1, then it gets reduced to 0, getting 0,
    // if key is any other number, than it gets set
    return run ( key, data[key] - 1 || 0 );
  }
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
});

