## A JS contingency system

This adds a contingency abstraction to JS in about 0.8KB.

Oftentimes, you may 

 * Need to do a number of things when a value is set,
 * Only want to do something if a value has been set; otherwise, delay that thing until the value is set.  
 * Want to be able to invalidate the process of settings a value; for instance, if the user attemps to change a context without saving things first.
 * Want to define how to get a value, but not actually do the process until something else needs it. 

For example, pretend you have a site where people can see the content, but once they want to vote on something or leave a comment or do one of countless other things, they need to log in. And then before they submit a comment, you want to check it for
say, some guidelines based on the content; or you want to pop up a captcha prior to submission.

This is what contingency enables you to do with expressiveness and ease.  
You can build large scale modular dynamic asynchronous applications without having to worry about cascading consequences or 
having business logic changes require editing multiple files.

This library gives this all to you in under 900 bytes.

Underscore.js is required.

### Usage

    var ev = EvDa();

creates an event namespace, ev. You can use one for the entire app, that's fine.

You can also seed it with initialization values by passing in an object, for instance:

    var ev = EvDa({key: 'value'});


## API

### Manipulation
**[handle | value] ev(key | hash, value | lambda, meta)**

 * If value and lambda are absent, this is a getter
 * If value is not a function, then it's a setter. If meta is set, then 
   this object gets passed around to the trigger functions.
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

**[value] ev.set(key, value)** 

 * Sets [key] to [value] or undefined if a value is omitted. Although undefined is a falsy value, the engine checks for set membership so it won't be fooled by things like undefined and null. 

**ev.unset(key)** 

 * Deletes the key from the db. 
 * No events are fired.

### Triggers

**[handle] ev.on(key, lambda ( value, { key, old, meta } ) )**

 * Run every time the key is set.
 * Returns a handle that can be passed into del to deregister.

**[handle] ev.after(key, lambda ( value, { key, old, meta } ) )**

 * Runs after a key has been set
 * Returns a handle that can be passed into del to deregister.

**[handle] ev.test(key, lambda ( value, { key, old, done, meta } ))**

 * Can block ev.set or ev(key, value) and thus suppress the "ON" and "AFTER" functions.
 * If the test succeeds, then the function must call a supplied callback function, named 
   done and supplied in an object in the second argument. Calling the function with anything
   other then the boolean false signals that the check succeeded. That means that calling
   done() means "go ahead".

**ev.del(handle)**

 * Deregisters a hooked function from running.

**ev.setter(key, lambda)** 

 * State that the setter for a key is a callback. 
   This will be run if there are things blocked on it.
 * Useful for asynchronous operations, such as a login screen; wherein you only
   want to give it to the user when applicable

**[boolean | undefined] ev.isset(key, lambda)**

 * If lambda is not set, returns true if key exists, false if it is not
 * If lambda is set,

   * A handle is returned to deregister it.
   * If the key is set, the lambda will run immediately and in the "ON" block.
   * If the key is not set, execution will be deferred until it is set.
   * undefined is returned.



### Extras
There is an add-on file too for higher-order abstractions, which includes regex finding of keys, set operations, and atomic incrementers and decrementers, that clocks in at under 0.5KB.
These functions are available in evda-extra.js

**[number] ev.incr(key)**

 * Atomically (in the JS sense) increments a key's value. 
 * It will initialize the key to the numeric value 1 if it's not a number
 * Returns the result of the set event.

**[number] ev.decr(key)**

 * Atomically (in the JS sense) decrements a key's value. 
 * It will initialize the key to the numeric value 0 if it's not a number
 * Returns the result of the set event.

**[value] ev.push(key, value)**

 * Pushes value to the end of key, which must take the push operation (aka, initialized as an array).  
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

**[value] ev.pop(key)**

 * Pops a value off the end of the key, which must take the pop operation (aka, initialized as an array).
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.
