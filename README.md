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

 * <a href="#ev">[handle | value] ev(key | hash | array, value | lambda, meta)</a> - do all the below
 * <a href="#set">[value] .set(key, value, meta, bypass)</a> - set a key
 * <a href="#unset">[boolean] .unset(key, ...)</a> - delete a set of keys
 * <a href="#extend">[value] .extend(key, obj)</a> - extends the object value of a key.

##### Stacks

 * <a href="#push">[array] .push(key, value)</a> - push a value on a stack at `key`
 * <a href="#pop">[value] .pop(key)</a> - pop a value off a stack at `key`

##### Sets

 * <a href="#setadd">[set] .setAdd(key, value)</a> - add value to a set at `key`
 * <a href="#setdel">[set] .setDel(key, value)</a> - delete value from a set at `key`

##### Values

 * <a href="#incr">[value] .incr(key, [ amount ] )</a> - increment a key's value - returning the new value.
 * <a href="#decr">[value] .decr(key, [ amount ] )</a> - decrement a key's value - returning the new value.

#### Triggers

 * <a href="#on">[handle] .on(key, lambda ( value, { key, old, meta } ) )</a> - register lambda to run **when** key is set.
 * <a href="#after">[handle] .after(key, lambda ( value, { key, old, meta } ) )</a> - register lambda to run **after** key is set.
 * <a href="#test">[handle] .test(key, lambda ( value, { key, old, result, meta } | cb ))</a> - register lambda to run as **a condition OF** setting a key.
 * <a href="#once">[handle] .once(key, lambda)</a> - run an on, but only once.
 * <a href="#when">[handle] .when(key, value | lambda, lambda ( value, { key, old, meta } ) )</a> - run a lambda when a key **is a certain value**
 * <a href="#del">[void] .del(handle)</a> - delete a handle returned by on, after, or test.
 * <a href="#setter">[boolean] .setter(key, lambda)</a> - define a way to set a key if requested
 * <a href="#isset">[boolean | undefined] .isSet(key | object)</a> - see if a key or a group of keys have been set, **firing a setter if necessary**.
 * <a href="#whenset">[boolean | undefined] .whenSet(key | object, lambda)</a> - do something once when a key is set, **firing a setter if necessary**.
 * <a href="#pause">[boolean] pause()</a> - stop running callbacks
 * <a href="#play">[boolean] play()</a> - run the aggregate callbacks
 * <a href="#fire">[void] fire(key)</a> - runs the setter mechanics without changing any values

##### Grouping

 * <a href="#group">[setter] .group(name, lambda)</a> - Register a set of triggers under a common name.
 * <a href="#enable">[list] .enable(name)</a> - Enable all the triggers of that name.
 * <a href="#disable">[list] .disable(name)</a> - Disable all the triggers of that name.
 * <a href="#bubble">Object Bubbling</a> and <a href="#global">Global Scope</a>

#### Miscellaneous

 * [object] .db - The current database.
 * [object] .events - The object of registered events.
 * [void] .sniff() - Enable a debugger.
 * [void] .empty() - Resetting all values and keeping all triggers.


### Manipulation

#### Base

<h4><a name="ev"></a>[handle | value] ev(key | hash | array, value | lambda, meta)</a></h4>

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

<h4><a name="set"></a>[value] .set(key, value, meta, bypass)</h4>

 * Sets [key] to [value] or undefined if a value is omitted. Although undefined is a falsy value, the engine checks for set membership so it won't be fooled by things like undefined and null. 
 * Passes the meta information if supplied to the registered functions.
 * If bypass is set to something truthy, then the tests for the key (if any) will be bypassed once.

Example:

    ev.set('key', 1);

    // sets the key to the array [1, 2, 3] and passes
    // meta to the callback.
    ev.set('key', [1,2,3], 'meta');

    // sets the key to an undefined value.
    ev.set('key');


<h4><a name="unset"></a>[boolean] .unset(key, ...)</h4>

 * Deletes the key, meaning that `.isSet('key')` will return false henceforth
 * Returns whether all the keys existed or not.
 * No events are fired.


<h4><a name="extend"></a>[value] .extend(key, obj)</h4>

 * Runs an equivalent to `$.extend` or `_.extend` on the existing value, merging back in.
 * Recurses down to the needed depth
 * No way to un-extend without getting the value, manually removing it, and re-assigning.

#### Stacks

<h4><a name="push"></a>[array] .push(key, value)</h4>

 * Pushes value to the end of key, which must take the push operation (aka, initialized as an array).  
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

<h4><a name="pop"></a>[value] .pop(key)</h4>

 * Pops a value off the end of the key, which must take the pop operation (aka, initialized as an array).
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

#### Sets

<h4><a name="setadd"></a>[set] .setAdd(key, value)</h4>

 * Creates key if it doesn't exist, as an array
 * Adds value to the array if it's not already there.
 * If the set is not modified, events aren't run.
 * Returns set.

<h4><a name="setdel"></a>[set] .setDel(key, value)</h4>

 * Creates key if it doesn't exist, as an array
 * Removes value from the set if it is there.
 * If the set is not modified, events aren't run.
 * Returns set.

#### Values

<h4><a name="incr"></a>[number] .incr(key, [ amount ] )</h4>

 * Atomically (in the JS sense) increments a key's value. 
 * It will initialize the key to the numeric value amount or 1 if it's not a number
 * Returns the result of the set event.

<h4><a name="decr"></a>[number] .decr(key, [ amount ] )</h4>

 * Atomically (in the JS sense) decrements a key's value by an amount or 1 if not specified. 
 * It will initialize the key to the numeric value 0 if it's not a number
 * Returns the result of the set event.

### Triggers

<h4><a name="on"></a>[handle] .on(key, lambda ( value, { key, old, meta } ) )</h4>

 * Runs every time the key is set.
 * Returns a handle that can be passed into ev.del to deregister.

<h4><a name="after"></a>[handle] .after(key, lambda ( value, { key, old, meta } ) )</h4>

 * Runs after a key has been set
 * Returns a handle that can be passed into ev.del to deregister.

<h4><a name="test"></a>[handle] .test(key, lambda ( value, { key, old, result, meta } ))</h4>

 * Can block ev.set or ev(key, value) and thus suppress the "ON" and "AFTER" functions.
 * If the test succeeds, then the function must call a supplied callback function, named 
   `result` and supplied in an object in the second argument. Calling the function with anything
   other then the boolean false signals that the check succeeded. That means that calling
   `.result()` means "go ahead".
 * The return value of the callback that is passed in passed through the test function.

<h4><a name="when"></a>[handle] .when(key, value | test | eval string, lambda)</h4>

 * Executes lambda when `key === value` OR `test(value) == true`
 * **Note:** By default, this handler runs every time that key gets set to value. To make this a one-time run, you can do the following:

    `ev.once(ev.when('key', 'value', callback))`

<h4><a name="del"></a>[void] .del(handle)</h4>

 * Deregisters a hooked function from running.

<h4><a name="setter"></a>[bolean] .setter(key, lambda)</h4>

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
     
<h4><a name="isset"></a>[boolean | undefined] .is[sS]et(key | object | array, lambda)</h4>

 * If lambda is not set, returns true if key exists, false if it is not
 * If lambda is set,

   * If the key is set, the lambda will run immediately and in the "ON" block. `undefined` is returned.
   * If the key is not set, execution will be deferred until it is set.  A handle is returned to deregister it.

 * You can pass in K/V object style arguments similar to the ev() notation above.
 * You can also pass an array of things ... all of them need to be set for the lambda to run. 

<h4><a name="whenset"></a>[boolean | undefined] .whenSet(key | object, lambda)</h4>

 * An alias to `.isSet` for syntactic sugar.

<h4><a name="once"></a>[handle] .once(key, lambda)</h4>

 * Flag a function for running only once

<h4><a name="pause"></a>[boolean] .pause()</h4>

 * Prevents any values from being set and any callbacks from being registered.
 * Returns true if it was not paused already, false otherwise.
 * This is useful if a group of values with elaborate triggers is expected to change rapidly
 * State is held in the .isPaused variable. **Don't set directly** - I trust you ;-)

<h4><a name="play"></a>[boolean] .play()</h4>

 * Aggregates all the key/value pairs that were requested to be set (by running the backlog on a mock instance)
 * Returns true if it was paused, false otherwise.
 * Sets the new key/value pairs in a bulk execution - ignoring the interim values since the pause()
 * State is held in the .isPaused variable. **Don't set directly** - I trust you ;-)

<h4><a name="fire"></a>[void] .fire(key)</h4>

 * Runs the setter mechanics without changing any values.
 * Equivalent to `ev.set(key, ev(key))`.

#### Grouping

<h4><a name="group"></a>[setter] .group(list, params)</h4>

 * Identical to an ev() command as documented above, except for the first parameter.
 * The first parameter, list, categorizes lambdas into a group that can be disabled or enabled in bulk.
 * A disabled lambda retains its position in the chain but is simply skipped.
 * Callbacks can be disabled through multiple lists and enabled.  Only if it is completely enabled after being disabled through all routes will it run again.
 * This function returns a setter for syntactic convenience so that it doesn't have to be explicitly invoked each time.

<h4><a name="enable"></a>[list] .enable( list )</h4>

 * Enables a list of lambdas previously disabled and set up through the ev.group() call
 * Does not work for test cases

<h4><a name="disable"></a>[list] .disable( list )</h4>

 * Disables (supresses execution of) a list of lambdas previously disabled and set up through the ev.group() call
 * Does not work for test cases

<h4><a name="bubble"></a>Object Bubbling</h4>

 * When your key has a dot notation then events bubble up in a "dot-notation" style array hierarchy.
 * Note that this is a proper "bubbling" and not "capturing".  For example, in `a.b`, `a.b` events are ran before `a`.
 * The parent objects get key-wrapped versions of the sub-objects.  Although this sounds confusing, it's what you expect. For example, if you set `a.b = 3` and `a.c = 4`, then a's callback would get `{ b: 3, c: 4 }`.  For `a.b.c = 1`  you'll get `{ b: { c: 1 } }`.
 * All logic applies to bubbling.  You can object-set it, have setters, after events, tests, etc.

<h4><a name="global"></a>Global Scope</h4>

 * Every operation bubbles to an empty-string global scope, `''`.
 * You can set handlers here as a catch-all, after-all, or test-all.
 * You can get the entire object space by querying it.
 * Since it's a standard key, it supports all the operations associated with that.

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

**.empty()**

 * Removes all keys from the object
 * Does not call any triggers during the removal
 * Retains all hooks for re-population.

### Examples

 * My [ytmix](https://github.com/kristopolous/ytmix) project uses this library all over the place.
 * There is an examples directory in the github repo

