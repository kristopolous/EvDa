## A JS event system

Setters, Getters, Message Passing, Value Checking, Testers, Before, After, One-Shot, Namespaces, Recursion protection and a Debugger in 1.2KB.

### Usage

    var ev = EvDa();

creates an event namespace, ev. You can use one for the entire app, that's fine.

You can also seed it with initialization values by passing in an object, for instance:

    var ev = EvDa({key: 'value'});


## API

### Manipulation
*ev(key, value | lambda)* 

 * If key has a * or ? then it will be interpreted as a regular expression and return matching keys and their values
 * If the key is an Array then the value or lambda will be associated with all the string values in the array.
 * If value and lambda are absent, this is a getter
 * If value is not a function, then it's a setter
 * If value is a function, this registers a callback.
 * If value is in object, it's keys and values are run through the handler again, following the above rules.

Looking at the last style, one can do the following:

    var handleList = ev({
      a: function(value) { console.log(value) },
      b: function(value) { console.log(value) }
    });

    ev({
      a: 1,
      b: 2
    });

    _.each(handleList, function(handle) {
      ev.remove(handle);
    });

    ev({
      a: 1,
      b: 2
    });

*ev.set(key, value)* Sets [key] to [value] or 1 (number) if a value is omitted.

*ev.unset(key)* Deletes the key from the db. No events are fired.

### Triggers

*setter(key, [callback])* State that the setter for a key is a callback. This will
be run if there are things blocked on it.

*isset(key, [callback])* 

 * If a callback is not set, returns true if key is in the database, false if it is not
 * If a callback is set,

   * The handle is returned.
   * It will be fired once.  
   * If the key is set, the callback will fire immediately.  
   * If the key is not set, it will be fired when it is.

*test(key, [callback])* 

 * Can invalidate a key changing value
 * Must use a supplied callback function, callback(true) says go ahead, callback(false) says don't do the function
 * Gets the meta information, the old value, a remove hook, the callback function, the new value, and the key affected.

*when(key, [callback])*

 * Run when the key is set.
 * Gets the meta information, the old value, a remove hook, the new value, and the key affected.

*after(key, [callback])* 

 * Runs after a key has been set
 * Gets the meta information, the old value, the new value, a remove hook, and the key affected


### Extras
*incr(key)*

 * Atomically (in the JS sense) increments a key's value. 
 * It will initialize the key to the numeric value 1 if it's not a number
 * Returns the result of the set event.

*decr(key)*

 * Atomically (in the JS sense) decrements a key's value. 
 * It will initialize the key to the numeric value 0 if it's not a number
 * Returns the result of the set event.

*push(key, value)* 

 * Pushes value to the end of key, which must take the push operation (aka, initialized as an array).  
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

*pop(key)* 

 * Pops a value off the end of the key, which must take the pop operation (aka, initialized as an array).
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.
