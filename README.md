## A JS event system
### Usage

    var ev = EvDa();

creates an event namespace, ev. You can use one for the entire app, that's fine.

## API

### Manipulation
*set(key, value)* Sets [key] to [value]

*unset(key)* Deletes the key from the db. No events are fired.

*emit(key, [value])* Sets / Emits a key, with an optional [value] to assign to it

*run(key, [value])* Alias of emit

*push(key, value)* 

 * Pushes value to the end of key, which must take the push operation (aka, initialized as an array).  
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

*pop(key)* 

 * Pops a value off the end of the key, which must take the pop operation (aka, initialized as an array).
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

*incr(key)*

 * Atomically (in the JS sense) increments a key's value. 
 * It will initialize the key to the numeric value 1 if it's not a number
 * Returns the result of the set event.

*decr(key)*

 * Atomically (in the JS sense) decrements a key's value. 
 * It will initialize the key to the numeric value 0 if it's not a number
 * Returns the result of the set event.

### Triggers

*get(key, [callback])*  Gets the value of [key], with an optional callback to be fired whenever it's set.

*isset(key, [callback])* 

 * If a callback is not set, returns true if key is in the database, false if it is not
 * If a callback is set,

   * The handle is returned.
   * It will be fired once.  
   * If the key is set, the callback will fire immediately.  
   * If the key is not set, it will be fired when it is.

*firstset(key, [cabllack])* Alias of isset

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
