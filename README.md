## A JS contingency system

This adds a contingency abstraction to JS.

Oftentimes, you may 

 * Need to do a number of things when a value is set.
 * Only want to do something if a value has been set; otherwise, delay that thing until the value is set.  
 * Want to be able to invalidate the process of settings a value; for instance, if the user attemps to change a context without saving things first.
 * Want to define how to get a value, but not actually do the process until something else needs it. 

For example, pretend you have a site where people can see the content, but once they want to vote on something or leave a comment or do one of countless other things, they need to log in. And then before they submit a comment, you want to check it for
say, some guidelines based on the content; or you want to pop up a captcha prior to submission.

This is what contingency enables you to do with expressiveness and ease.  

You can build large scale modular dynamic asynchronous applications without having to worry about cascading consequences or 
having business logic changes require editing multiple files.

### Dynamic function composition

#### The scaling deficiencies
Encapsulation efforts usually work best when you can separate your concerns via some
single lens upon which you view your project.  Oftentimes, real-world objects are used
to justify the OO style of design; say "dog" extends from "animals" but, then is quickly
pointed out may also be classified under "pets" and "things that need to be fed". 

Then multiple inheritance is touched upon; where you do meta-programming, defining
the abstract concept of "things that require food" and then make sure that all systems
somehow feed back to that that are relevant etc.

The reality is that multi-dimensional design breaks the simple OO abstractions in that
they complexify quickly.  Separation of concerns is very hard with vertical integration
efforts which yield multi-disciplinary abstractions.

#### Composable functions
What if you could have an abstract definition of a function, say "initialize X" and
then compose it indirectly throughout your application so that you can dynamically 
redefine it as necessary, removing and adding sections.  You can put in conditionals,
loops, callers, and all the things as if you had carefully designed the interface
and abstraction in a more formal manner; but at the same time do not actually need to
do so.

You have data that is publically accessible; they have getters and setters; which can
hook; you can pass arbitrary information into them via regular parameters, and can then
have trace functions; very much like in a more traditional model.  That is what you will
find here; compactly and succinctly.


### Usage

    var ev = EvDa();

creates an event namespace, ev. You can use one for the entire app, that's fine.

You can also seed it with initialization values by passing in an object, for instance:

    var ev = EvDa({key: 'value'});


## API

### Manipulation
**[handle | value] ev(key | hash, value | lambda, meta)**

 * If value, lambda, and meta are absent, this is a getter. eg., ev('key') => 'value'
 * If value is not a function, then it's a setter. If meta is set, then 
   this object gets passed around to the trigger functions.
 * If value is a function, this registers a callback in the "ON" block.
 * If value is a function and meta is {once: true} then it will only be run once.
   
   * Since the handle is itself, a decorated callback, then you can simply run handle.once = true at any future time to make sure that the callback only runs once more, then deregisters. This is different from a delete wherein it will deregister right away.

 * If value is in object, its keys and values are run through the handler again, following the above rules. Note that you can do something like ev({}, undefined, meta) to pass the same meta information to all the tuples in the hash.

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
      ev.del(handle);
    });

    ev({
      a: 1,
      b: 2
    });

**[value] ev.set(key, value, meta, bypass)** 

 * Sets [key] to [value] or undefined if a value is omitted. Although undefined is a falsy value, the engine checks for set membership so it won't be fooled by things like undefined and null. 
 * Passes the meta information if supplied to the registered functions.
 * If bypass is set to something truthy, then the tests for the key (if any) will be bypassed once.

**ev.unset(key)** 

 * Deletes the key, meaning the isset('key') will return false henceforth
 * No events are fired.

**ev.db**

 * A direct reference (not a copy) to the internal hash.  This can be used to extend the library

**ev.events**

 * A map to the lambdas, broken up into key values of either "test", "on", or "after" followed by the key value.  For instance, if you had run ev.on('key', lambda).  Then ev.events['onkey'] = lambda.  This may sound dangerous at first, but everything gets either a "test", "on" or "after" prefix - so no collisions from shared namespace will arise.

### Triggers

**[handle] ev.on(key, lambda ( value, { key, old, meta } ) )**

 * Runs every time the key is set.
 * Returns a handle that can be passed into ev.del to deregister.

**[handle] ev.after(key, lambda ( value, { key, old, meta } ) )**

 * Runs after a key has been set
 * Returns a handle that can be passed into ev.del to deregister.

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

**[boolean | undefined] ev.isset(key | object, lambda)**

 * If lambda is not set, returns true if key exists, false if it is not
 * If lambda is set,

   * If the key is set, the lambda will run immediately and in the "ON" block. `undefined` is returned.
   * If the key is not set, execution will be deferred until it is set.  A handle is returned to deregister it.

 * You can pass in K/V object style arguments similar to the ev() notation above.


### Extras
There is an addon file for set, collection, and counter abstractions; these includes regex finding of keys, push, pop, and atomic incrementers and decrementers. They are available in evda-extra.js

**ev.list(list, params)**

 * Identical to an ev() command as documented above, except for the first parameter
 * The first parameter, list, categorizes lambdas into a group that can be disabled or enabled in bulk
 * A disabled lambda retains its position in the chain but is simply skipped.
 * Callbacks can be disabled through multiple lists and enabled.  Only if it is completely enabled after being disabled through all routes will it run again

**ev.enable( list )**

 * Enables a list of lambdas previously disabled and set up through the ev.list() call
 * Does not work for test cases

**ev.disable( list )**

 * Disables (supresses execution of) a list of lambdas previously disabled and set up through the ev.list() call
 * Does not work for test cases

**[handle] ev.once(key, lambda)**

 * A syntactic sugar form of ev(key, lambda, {once: true});

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

**ev.unset(argList)**

 * A wrapper to the regular ev.set
 * Allows an argument list to be passed in

**ev.sniff()**

 * wraps set in a console.log abstraction

### Examples

 * My [ytmix](https://github.com/kristopolous/ytmix) project uses this library all over the place.
