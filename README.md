# A Generic Controller
## IoC, Events, Data, Promises, all the buzzwords.

## Usage

    var ev = EvDa();

creates an event namespace, ev. You can use one for the entire app, that's fine.

You can also seed it with initialization values by passing in an object, for instance:

    var ev = EvDa({key: 'value'});

There's a section far down at the bottom that discusses what this API is from a theoretical
standpoint. You can view it as a generic controller in the traditional MVC sense that has some
hooks for a model, but that's only because that acronym seems to help things gain traction.

It's really, actually, something quite different and quite a bit more useful than that.

You have hipster promises like this:

    ev.isset('key', function() { });

Along with things that you can do before they are cool. Like this:

    ev.after('key', function() { });
    ev.test('key', function() { return false; });

What do those things do? I mean I'd tell you, but really, you just wouldn't get it. /arrogant-jerk.

Ok, I'll show you, just this once:

    each ( [ON, AFTER, 'test'], function ( stage ) {

      // register the function
      pub[stage] = function ( key, callback, meta ) {
        if ( !callback ) {
          callback = key;
          key = BASE;
        }

        // This is the back-reference map to this callback
        // so that we can unregister it in the future.
        (callback.$ || (callback.$ = [])).push ( stage + key );

        (eventMap[stage + key] || (eventMap[stage + key] = [])).push ( callback );

        return extend(callback, meta);
      }
    });



### Be years ahead of those low-contrast hard-to read blog articles with curvy custom hairline fonts.

Watch this. Pretend I know how to get something, like say, a user profile, but I don't want to load it
unnecessarily.

For example:

    ev.setter('user.profile', function(trigger) {
      $.get("/user/profile", function(data) {
        trigger(data);
      });
    });

Then later on I can call this:

    viewProfile: function(){
      ev.whenSet('user.profile', function(profile) {
        TheLatestFadInTemplating( profile );
      });
    }

Here, the request for the data user.profile inside of viewProfile made evda say "hrmm, I don't have it, do I know how to get it?"

And sure enough it does.  It runs the callback which sets user.profile, and then runs the templating code and there you go. Let me
do some kind of weird diagram because I like to waste my time:


                                  /-> no? -> Run code whenever it's set then.
                                 /
                     /-> no? -> Do I have a setter? 
                    /                        \
                   /                          \-> yes? Run the setter. Then Run the code.
    viewProfile -> Does user.profile exist? 
                    \                               
                     \_> yes? run code immediately.

Oh but what if you declare the two things in the reverse order? That works. Sure.  What about this?

    viewProfile: function(){
      if (var profile = ev.isset('user.profile')) { 
        TheLatestFadInTemplating( profile );
      };
    }

Yep. more trivial stuff also works; who'd think that? Nobody really does this yet. I don't know why.

### Doesn't backbone have these things?

Oh right. Here's one for you.  Let's say that we have a function:

    this.once("something", function(){});

and then I do

    this.trigger("something");

That's wonderful. Totally asynchronous, right? 

Nope. That's so wrong. That's so silly. This isn't asynchronous at all. It's "deferred". There's a difference.

What if the trigger runs BEFORE I register the handler?  Then the trigger falls on the floor and the handler goes 
into neverland.  That's not asynchronous.  

I still have to know what will load before what; that's what synchronous is. Like, that is synchronous's definition.  Something that's really
*Asynchronous* would be something like:

    this.trigger("something"); << the trigger could run here

    this.whenSet("something", function(){}); << This will run after trigger.

    this.trigger("something"); << OR here, it doesn't matter.

Well, this library does that. It actually does. Fancy that. We aren't just pretending to be asynchronous here and then spending all our time taking instagram like pics for gravatar with a $5,000 camera.

I'm doing actual work. I know, what the fuck, right?

## API

### Functions

#### Manipulation

##### Base

 * [handle | value] ev(key | hash | array, value | lambda, meta) - do all the below
 * [value] .set(key, value, meta, bypass) - set a key
 * [boolean] .unset(key, ...) - delete a set of keys

##### Stacks

 * [array] .push(key, value) - push a value on a stack at `key`
 * [value] .pop(key) - pop a value off a stack at `key`

##### Sets

 * [set] .setAdd(key, value) - add value to a set at `key`
 * [set] .setDel(key, value) - delete value from a set at `key`

##### Values

 * [value] .incr(key, [ amount ] ) - increment a key's value - returning the new value.
 * [value] .decr(key, [ amount ] ) - decrement a key's value - returning the new value.

#### Triggers

 * [handle] .on(key, lambda ( value, { key, old, meta } ) ) - register lambda to run **when** key is set.
 * [handle] .after(key, lambda ( value, { key, old, meta } ) ) - register lambda to run **after** key is set.
 * [handle] .test(key, lambda ( value, { key, old, result, meta } | cb )) - register lambda to run as **a condition OF** setting a key.
 * [handle] .once(key, lambda) - run an on, but only once.
 * [handle] .when(key, value | lambda, lambda ( value, { key, old, meta } ) ) - run a lambda when a key **is a certain value**
 * [boolean] .setter(key, lambda) - define a way to set a key if requested
 * [boolean | undefined] .isSet(key | object) - see if a key or a group of keys have been set, **firing a setter if necessary**.
 * [boolean | undefined] .whenSet(key | object, lambda) - do something once when a key is set, **firing a setter if necessary**.
 * [void] .del(handle) - delete a handle returned by on, after, or test.
 * [boolean] pause() - stop running callbacks
 * [boolean] play() - run the aggregate callbacks

##### Grouping

 * [setter] .group(name, lambda) - Register a set of triggers under a common name.
 * [list] .disable(name) - Disable all the triggers of that name.
 * [list] .enable(name) - Enable all the triggers of that name.

#### Miscellaneous

 * [object] .db - The current database.
 * [object] .events - The object of registered events.
 * [void] .sniff() - Enable a debugger.


### Manipulation

#### Base

**[handle | value] ev(key | hash | array, value | lambda, meta)**

 * If value, lambda, and meta are absent, this is a getter. eg., ev('key') => 'value'
 * If value is not a function, then it's a setter. If meta is set, then 
   this object gets passed around to the trigger functions.
 * If value is a function, this registers a callback in the "ON" block.
 * If the first argument an array then each element of the array is ran on the rest of the arguments.
   
   * Since the handle is itself, a decorated callback, then you can simply run ev.once(handle) at any future time to make sure that the callback only runs once more, then deregisters. This is different from a delete wherein it will deregister right away.

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

**[value] .set(key, value, meta, bypass)** 

 * Sets [key] to [value] or undefined if a value is omitted. Although undefined is a falsy value, the engine checks for set membership so it won't be fooled by things like undefined and null. 
 * Passes the meta information if supplied to the registered functions.
 * If bypass is set to something truthy, then the tests for the key (if any) will be bypassed once.

**[boolean] .unset(key, ...)** 

 * Deletes the key, meaning that .isSet('key') will return false henceforth
 * Returns whether all the keys existed or not.
 * No events are fired.


#### Stacks

**[array] .push(key, value)**

 * Pushes value to the end of key, which must take the push operation (aka, initialized as an array).  
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

**[value] .pop(key)**

 * Pops a value off the end of the key, which must take the pop operation (aka, initialized as an array).
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

#### Sets

**[set] .setAdd(key, value)**

 * Creates key if it doesn't exist, as an array
 * Adds value to the array if it's not already there.
 * Returns set.

**[set] .setDel(key, value)**

 * Creates key if it doesn't exist, as an array
 * Removes value from the set if it is there.
 * Returns set.

#### Values

**[number] .incr(key, [ amount ] )**

 * Atomically (in the JS sense) increments a key's value. 
 * It will initialize the key to the numeric value amount or 1 if it's not a number
 * Returns the result of the set event.

**[number] .decr(key, [ amount ] )**

 * Atomically (in the JS sense) decrements a key's value by an amount or 1 if not specified. 
 * It will initialize the key to the numeric value 0 if it's not a number
 * Returns the result of the set event.

### Triggers

**[handle] .on(key, lambda ( value, { key, old, meta } ) )**

 * Runs every time the key is set.
 * Returns a handle that can be passed into ev.del to deregister.

**[handle] .after(key, lambda ( value, { key, old, meta } ) )**

 * Runs after a key has been set
 * Returns a handle that can be passed into ev.del to deregister.

**[handle] .test(key, lambda ( value, { key, old, result, meta } ))**

 * Can block ev.set or ev(key, value) and thus suppress the "ON" and "AFTER" functions.
 * If the test succeeds, then the function must call a supplied callback function, named 
   `result` and supplied in an object in the second argument. Calling the function with anything
   other then the boolean false signals that the check succeeded. That means that calling
   `.result()` means "go ahead".

**[handle] .when(key, value | test | eval string, lambda)** 

 * Executes lambda when `key === value` OR `test(value) == true`
 * **Note:** By default, this handler runs every time that key gets set to value. To make this a one-time run, you can do the following:

    `ev.once(ev.when('key', 'value', callback))`

**[void] .del(handle)**

 * Deregisters a hooked function from running.

**[bolean] .setter(key, lambda)** 

 * State that the setter for a key is a callback. 
   This will be run if there are things blocked on it.
 * Returns whether it was run immediately or not.
 * Useful for asynchronous operations, such as a login screen; wherein you only
   want to give it to the user when applicable
 * The list of setters are in `ev.setterMap`
 * The lambda function may have a function that it runs when its ready.  That's to say something like this:

      ev.setter("username", function(done) {
        $.get("/whoami", done);
      }); 

 Now in some template I'm doing something like this

      ev.isSet('username', function(who){
        $("#header").html(
          template({
            username: who
          })
        );
      });
      
**[boolean | undefined] .is[sS]et(key | object | array, lambda)**

 * If lambda is not set, returns true if key exists, false if it is not
 * If lambda is set,

   * If the key is set, the lambda will run immediately and in the "ON" block. `undefined` is returned.
   * If the key is not set, execution will be deferred until it is set.  A handle is returned to deregister it.

 * You can pass in K/V object style arguments similar to the ev() notation above.
 * You can also pass an array of things ... all of them need to be set for the lambda to run. 

**[boolean | undefined] .whenSet(key | object, lambda)**

 * An alias to `.isSet` for syntactic sugar.

**[handle] .once(key, lambda)**

 * Flag a function for running only once

**[boolean] pause() **

 * Prevents any values from being set and any callbacks from being registered.
 * Returns true if it was not paused already, false otherwise.
 * This is useful if a group of values with elaborate triggers is expected to change rapidly
 * State is held in the .isPaused variable. **Don't set directly** - I trust you ;-)

**[boolean] play() **

 * Aggregates all the key/value pairs that were requested to be set (by running the backlog on a mock instance)
 * Returns true if it was paused, false otherwise.
 * Sets the new key/value pairs in a bulk execution - ignoring the interim values since the pause()
 * State is held in the .isPaused variable. **Don't set directly** - I trust you ;-)

#### Grouping

**[setter] .group(list, params)**

 * Identical to an ev() command as documented above, except for the first parameter.
 * The first parameter, list, categorizes lambdas into a group that can be disabled or enabled in bulk.
 * A disabled lambda retains its position in the chain but is simply skipped.
 * Callbacks can be disabled through multiple lists and enabled.  Only if it is completely enabled after being disabled through all routes will it run again.
 * This function returns a setter for syntactic convenience so that it doesn't have to be explicitly invoked each time.

**[list] .enable( list )**

 * Enables a list of lambdas previously disabled and set up through the ev.group() call
 * Does not work for test cases

**[list] .disable( list )**

 * Disables (supresses execution of) a list of lambdas previously disabled and set up through the ev.group() call
 * Does not work for test cases

### Miscellaneous

**.db**

 * A direct reference (not a copy) to the internal hash.  This can be used to extend the library

**.setterMap**

 * The map of K/V setters

**.events**

 * A map to the lambdas, broken up into key values of either "test", "on", or "after" followed by the key value.  For instance, if you had run ev.on('key', lambda).  Then ev.events['onkey'] = lambda.  This may sound dangerous at first, but everything gets either a "test", "on" or "after" prefix - so no collisions from shared namespace will arise.

**.sniff(arg)**

 * Wraps set in a console.log abstraction
 * ev.traceList is also exposed. It's an
   array and run every time.
 * if arg is
   * a string - that event is excluded from being logged
   * empty - the current set of excluded events are returned
   * FALSE - this feature is disabled
   * TRUE - the feature is enabled

### Examples

 * My [ytmix](https://github.com/kristopolous/ytmix) project uses this library all over the place.
 * There is an examples directory in the github repo

<!--
### What this is

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

-->
