var Evda_ = self.EvDa;
self.EvDa = function(){
  var E = Evda_.apply(0, _.toArray(arguments));

  return _.extend(E, {
    incr: function ( key ) {
      // we can't use the same trick here because if we
      // hit 0, it will auto-increment to 1
      return E.set ( key, _.isNumber(E.data[key]) ? (E.data[key] + 1) : 1 );
    },

    decr: function ( key ) {
      // if key isn't in data, it returns 0 and sets it
      // if key is in data but isn't a number, it returns NaN and sets it
      // if key is 1, then it gets reduced to 0, getting 0,
      // if key is any other number, than it gets set
      return E.set ( key, E.data[key] - 1 || 0 );
    },

    // If we are pushing and popping a non-array then
    // it's better that the browser tosses the error
    // to the user than we try to be graceful and silent
    // Therein, we don't try to handle input validation
    // and just try it anyway
    push: function ( key, value ) {
      E.data[key] = E.data[key] || [];
      E.data[key].current = E.data[key].push ( value );
      
      return E.set ( key, E.data[key] );
    },

    pop: function ( key ) {
      E.data[key].pop ();
      E.data[key].current = _.last(E.data[key]);

      return E.set ( key, E.data[key] );
    },

    find: function ( regex ) {
      return _.select( _.keys(E.data), function(toTest) {
        return toTest.match(regex);
      });
    }
 });
}
