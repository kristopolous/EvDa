# A Generic Event System
EvDa is a collection of about 30 or so functions to construct a modular no-kitchen-sink style application.  This is an event system.

It's 100% agnostic as to the MV\* approach or other libraries used and intended to be just below a level of complexity where 
someone has to take an architectural opinion as to how to use it.

That is to say that it takes no opinion on how say, a routes architecture should be created, but instead, gives fundamental building blocks to construct a variety of them.

Similarly, no decree is made about *how* to do two-way data-binding or reactive design.  Instead, there's generic tools which
makes composing such a system convenient and easy.

This isn't a weekend project.  It's been in development since 2008 and includes a suite with over 270 tests. Code is never pushed to master unless it passes all the tests.  

It's been used in ember, angular, react, backbone, and extjs projects to supplement features that aren't in these libraries and also to get multiple libraries that don't play nice with each other to interact.

### Agnostic Example: Namespaced Events.

EvDa supports namespaced events while not having any opinion on how to do them.  


#### Through globals

You can do something like this:

    var 
      content = EvDa(),
      toolbar = EvDa(),
      api = EvDa();

And then have those as three separate "namespaces".

#### Through instances

You can set a context inside of a constructor (with EvDa-helper)

    function Person(name) {
      this.events = EvDa(this);
      this.name = name;

      this.events.expose('greet');
      this.greet(function(when) {
        return "Good " + when + "! My name is " + this.name + ".";
      });
    }

    new Person('john').greet('morning');
    >> Good morning! My name is John.

#### Through dot notation

EvDa support object bubbling and dot notation. So you can do something like:

    var ev = EvDa();

    ev('content', function(obj) {
      ...
    });

    ev('content.key', 'value');

    ev({
        toolbar: {
          key: 'something'
        }
      });

etc...

So as you can see here, there's "namespaces" as per the definition of what a namespace entails, but no direct decree as to how those *ought* to be
done.  This library empowers your personal liberty as a programmer, instead of restricting it to a preconceived implementation that you may
not be able to integrate easily.

### A longer example.

    var ev = EvDa();

creates an event namespace, ev. You can use one for the entire app, that's fine.

You can also seed it with initialization values by passing in an object, for instance:

    var ev = EvDa({key: 'value'});

You have hipster promises like this:

    ev.isset('key', function() { });

Along with things that you can do before they are cool. Like this:

    ev.after('key', function() { });
    ev.test('key', function() { return false; });

What about a way to console log whenever anything gets set?

    ev('', function(el){ console.log(el) })

    >> fn0

What about setting 2 keys to one value?

    ev(['key1', 'key2'], value);

    >> [value, value]

What about having two callbacks for this?

    ev({
      'key1': function() { ... },
      'key2': function() { ... },
    })

    >> {key1: fn0, key2: fn1 }

What about having just one?

    ev(['key1','key2'], function(new_value, meta_info) {
      console.log(key + ' was set to ' + new_value);
    })

    >> [fn0, fn1]

What about making them run just once?

    ev(['key1','key2'], function(new_value, meta_info) {
      console.log(key + ' was set to ' + new_value);
    }, {once: 1})

    >> [fn0, fn1]
    
What about unregistering one of them?

    var list = ev(['key1','key2'], function(new_value, meta_info) {
      console.log(key + ' was set to ' + new_value);
    });

    ev.del(list[0]);

    >> list[0]

And setting the other one to only running once?

    list[1].once = true;

And then running something after that?


    list[1].after(function() {
      console.log('this will be run after');
    });

    >> fn0

And now running that chain?

    ev.fire(['key1', 'key2']);

    >> ['value1', 'value2']

That's nice you think, but some libraries will completely make chain functions inaccessible ... for instance
what if we do this?

    var ret = ev
      .before('key', fn0)
      .test(fn1)
      .on(fn2)
      .after(fn3);

    >> [fn0, fn1, ..., fnX]

And then you want to unregister the third one on the list, the "on" function?  Easy! Address it like an array:

    ev.del(ret[2]);

    >> ret[2]

What if you want to repurpose the third function for something else?

    ev('something else', ret[3]);

    >> ret[3]

What if you want to take some callbacks as a group and then disabled them?

    var 
      some_group = ev.after(['key1','key2']),
      handle = ev.disable(some_group);

Now what if you want to assign all of those to another key?

    ev.on('key3', some_group);

    >> fn0

And now you want to re-enable them and then increment all the keys at once?

    ev.enable(some_group);

    >> [ fn0, fn1, ..., fnX ]

    ev.incr(['key1','key2','key3']);

    >> [1, 1, 1]


There you go ... 


### Diagnostic tools (introduction)

There's also a nice way to diagnose things.

A nice way to find out if there's events associated with say, 'key1' you can do something like:

    >> ev.events('key1')
    Object { first: undefined, on: Array[3], after: undefined, test: undefined, or: undefined, set: undefined }

    >> ev.events('key1').on[0].$
    { ref: ['onname'], ix: 1, last: Date 2016-02-23T20:48:26.346Z, line: [(stack trace)] }

This tells us that the first function that will be run in the on handler of key 1 is registered for just one function, onname; it's been called once, last at 2016-02-23T20:48:26.346Z and was registered from 1 place.

We can thus do an action and then see if these numbers change. Things like disabling a group or setting something as running once is also stored here for inspection.

There's other tools to to trace execution and do various other inspections.

### Setters

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

### Doesn't framework-XYZ have these things?

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

Well, this library does that. Fancy that. 

## API

### Functions

#### Manipulation

Syntax notations:

  * square brackets ( [ ] ) - data types
  * vertical bars ( | ) - optional versions of a specific parameter
  * squiggly brackets ( { } ) - objects that are passed in and their keys
  * pointy brackets ( &lt; &gt; ) - optional arguments.

##### Base

 * <a href="#ev">[handle | value] ev(key | hash | array, value | lambda &lt;, meta &gt; )</a> - do all the below
 * <a href="#set">[value] .set(key, value &lt;, meta, _opts &gt; )</a> - set a `key`
 * <a href="#unset">[boolean] .unset(key &lt;, ... &gt; )</a> - delete a set of keys
 * <a href="#extend">[value] .extend(key, obj)</a> - extends the object value of a `key`

##### Stacks

 * <a href="#push">[array] .push(key, value &lt;, meta &gt; )</a> - push a value on a stack at `key`
 * <a href="#pop">[value] .pop(key &lt;, meta &gt; )</a> - pop a value off a stack at `key`

##### Sets

 * <a href="#setadd">[set] .setAdd(key, value &lt;, meta &gt; )</a> - add value to a set at `key`
 * <a href="#osetadd">[set] .osetAdd(key, value &lt;, meta &gt; )</a> - add value to a set at `key` maintaining the order
 * <a href="#setdel">[set] .setDel(key, value &lt;, meta &gt; )</a> - delete value from a set at `key`
 * <a href="#settoggle">[set] .setToggle(key, value &lt;, meta &gt; )</a> - toggle the membership of a value in a set at `key`

##### Values

 * <a href="#incr">[value] .incr(key &lt;, amount, meta &gt; )</a> - increment a key's value - returning the new value
 * <a href="#decr">[value] .decr(key &lt;, amount, meta &gt; )</a> - decrement a key's value - returning the new value

#### Triggers

 * <a href="#on">[handle] .on(key, lambda ( value, { key, old, meta } ) )</a> - register lambda to run **when** key is set
 * <a href="#after">[handle] .after(key, lambda ( value, { key, old, meta } ) )</a> - register lambda to run **after** key is set
 * <a href="#test">[handle] .test(key, lambda ( value, { key, old, result, meta } | cb ))</a> - register lambda to run as **a condition OF** setting a key
 * <a href="#or">[handle] .or(key, lambda ( value, { key, old, result, meta } | cb ))</a> - register lambda to run if a test fails
 * <a href="#once">[handle] .once(key, lambda)</a> - run an on, but only once
 * <a href="#when">[handle] .when(key, value | lambda, lambda ( value, { key, old, meta } ) )</a> - run a lambda when a key **is a certain value**
 * <a href="#del">[void] .del(handle)</a> - delete a handle returned by on, after, or test
 * <a href="#setter">[boolean] .setter(key, lambda)</a> - define a way to set a key if requested
 * <a href="#isset">[boolean | undefined] .isSet(key | object)</a> - see if a key or a group of keys have been set, **firing a setter if necessary**
 * <a href="#whenset">[boolean | undefined] .whenSet(key | object, lambda)</a> - do something once when a key is set, **firing a setter if necessary**
 * <a href="#pause">[boolean] pause()</a> - stop running callbacks
 * <a href="#play">[boolean] play()</a> - run the aggregate callbacks
 * <a href="#fire">[void] fire(key | [ key1, key2, ..., keyn ] &lt;, meta &gt; )</a> - runs the setter mechanics without changing any values

##### Grouping

 * <a href="#group">[setter] .group(name, lambda)</a> - Register a set of triggers under a common name.
 * <a href="#enable">[list] .enable(name)</a> - Enable all the triggers of that name.
 * <a href="#disable">[list] .disable(name)</a> - Disable all the triggers of that name.
 * <a href="#bubble">Object Bubbling</a> and <a href="#global">Global Scope</a>

#### Miscellaneous

 * <a href="#events">[object] .events( &lt; key, type &gt; )</a> - The registered events to (re)order them
 * <a href="#db">[object] .db</a> - The current database
 * <a href="#settermap">[object] .setterMap</a> - All the setters
 * <a href="#sniff">[void] .sniff()</a> - Enable a debugger
 * <a href="#empty">[void] .empty()</a> - Resetting all values and keeping all triggers
 * <a href="#version">__version__</a> - Grabbing the version of the library
 * <a href="#callbackhell">callback hell</a> - Avoiding it.

### Manipulation

#### Base

<h4><a name="ev"></a>[handle | value] ev(key | hash | array, value | lambda, meta)</a></h4>

 * If value, lambda, and meta are absent, this is a getter. eg., `ev('key')` => 'value'
 * If value is not a function, then it's a setter. If meta is set, then 
   this object gets passed around to the trigger functions.
 * If value is a function, this registers a callback in the "ON" block.
 * If the first argument an array then each element of the array is ran on the rest of the arguments.
   
   * Since the handle is itself, a decorated callback, then you can simply run `ev.once(handle)` at any future time to make sure that the callback only runs once more, then deregisters. This is different from a delete wherein it will deregister right away.

 * If value is in object, its keys and values are run through the handler again, following the above rules. Note that you can do something like `ev({}, undefined, meta)` to pass the same meta information to all the tuples in the hash.

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

If there are no arguments, then an object for inspection is returned.

As of <a href="#version">0.1.88</a>, this is what is returned:

    {
      data: ...       The keys and current values
      events: ...     The events (on, after, before, test ...)
      locks: ...      Used to prevent recursion, it can also (if buggy) prevent firing
      testLocks: ...  Used to prevent test recursion
      last: ...       The last function return value for each key (useful for debugging closures)
      globs: ...      Regex style event listening
      trace: ...      Functions to run each time, see <a href='#sniff'>sniff</a> for more information.
    }

There is a scope specific object, `dbg`, which may be contextually added to for more information.

<h4><a name="set"></a>[value] .set(key, value, meta, _opts)</h4>

 * Sets [key] to [value] or undefined if a value is omitted. Although undefined is a falsy value, the engine checks for set membership so it won't be fooled by things like undefined and null. 
 * Passes the meta information if supplied to the registered functions.
 * The opts section gives options for how the flow of the setter is run.  This is a kind of ["multiple dispatch"](http://en.wikipedia.org/wiki/Multiple_dispatch) that is needed for internal unification.  The options are:
   * value: a value to be passed to the setters and the callbacks which may be different from the actual value set.
   * bypass: if set, bypasses any test conditions when running a setter
   * noexec: if set, disables all callbacks from being fired when settings.
   * noset: if set, doesn't set any value.
   * onlychange: if set, only run callbacks if something is changed.
   * coroutine: `function(meta, isFinal)` if set, this is a function that gets passed the meta object before each test and prior to the value actually being set.  Since `meta.value` is the value that will be set in the system, this can permit any permutations perhaps done by the testers or other handlers to be taken into consideration before the final `meta.value` is set.  
   If `isFinal` is true then it means this is the last call prior to being set.
   the `meta.value` at the end of the coroutine function is the one that will be sent to the `after` and `on` listeners - in this sense is more of a middleware than a knuthian coroutine - but since its passed as a lambda during the actual set as opposed to a decoupled listener, the flow of control more closely resembles that of a coroutine than a middleware stack.
   coroutines Should return `true`.
   

Example:

    ev.set('key', 1);

    // sets the key to the array [1, 2, 3] and passes
    // meta to the callback.
    ev.set('key', [1,2,3], 'meta');

    // sets the key to an undefined value.
    ev.set('key');

`set` also has something called a handy setter.  For instance, say you have some kind of promise system
like so:

    var session = EvDa();

    remote('/Login').then(session).fail(...);

But you didn't want all of session to be filled. Pretend you wanted to scope it conveniently.  This is 
where the handy setter comes in:

    remote('/Login').then(session.set('user_data')).fail(...);

In this use-case, `session('user_data')` gets set to undefined, and returns a function which will take in
an argument to set the `user_data`.  This sounds multi-layered and hard but it isn't.  It does what you
expect it to do.  For instance:


    var cb = session.set('user_data');

    cb({username: 'some user', id: 123});

    session('user_data.id') == 123

<h4><a name="unset"></a>[boolean] .unset(key, ...)</h4>

 * Deletes the key, meaning that `.isSet('key')` will return false henceforth
 * Returns whether all the keys existed or not.
 * No events are fired.

Example:

    ev('key', 1);
    > 1

    ev(''); // see <a href="#bubble">bubbling and globals</a> at the end.
    > { key: 1 }

    ev.unset('key')
    > 1

    ev('')
    > {}

<h4><a name="extend"></a>[value] .extend(key, obj)</h4>

 * Runs an equivalent to `$.extend` or `_.extend` on the existing value, merging back in.
 * Recurses down to the needed depth
 * No way to un-extend without getting the value, manually removing it, and re-assigning.

#### Stacks

<h4><a name="push"></a>[array] .push(key, value &lt;, meta &gt; )</h4>

 * Pushes value to the end of key, which must take the push operation (aka, initialized as an array).  
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

Example:

    ev.push('key', 1);
    > [1]

    ev.push('key', 2);
    > [1,2]

<h4><a name="pop"></a>[value] .pop(key &lt;, meta &gt; )</h4>

 * Pops a value off the end of the key, which must take the pop operation (aka, initialized as an array).
 * Updates the 'current' pointer to the last item on the array. 
 * Returns the result of the set event.

Example:

    ev.pop('key');
    > 2

#### Sets

The set functions are convenience wrappers on top of the basic value-based functionalities.  Their are a 
few differences:

 * The value that is passed to the handlers of the set functions is the value to be added or deleted.
 * The value of the entire set is still available (and modifiable in the testers) via `meta.set`.
 * The value of the set gets updated between tests through a coroutine.
 * If the updated `meta.value` fails to pass the unique set test, then no more tests are run and the `or` event handlers are called.
 * Alternatively just the value of `meta.value` can be modified before the set-inclusion rules are actually applied.

<h4><a name="setadd"></a>[set] .setAdd(key, value &lt;, meta &gt; )</h4>

 * Creates key if it doesn't exist, as an array
 * Adds value to the array if it's not already there.
 * If value is an `array` then it gets flattened and appended.
 * If the set is not modified, events aren't run.
 * Returns set.

Example:

    ev.setadd('key', 1);
    > [1]

    ev.setadd('key', 1); << no triggers are run
    > [1]

    ev.setadd('key', [2, 3]);
    > [1, 2, 3]

<h4><a name="osetadd"></a>[set] .osetAdd(key, value &lt;, meta &gt; )</h4>

 * Identical to `setAdd` but maintains the order of the set at a slight complexity cost.

<h4><a name="setdel"></a>[set] .setDel(key, value &lt;, meta &gt; )</h4>

 * Creates key if it doesn't exist, as an array
 * Removes value from the set if it is there.
 * If the set is not modified, events aren't run.
 * Returns set.

Example:

    ev.setAdd('key', [1, 2, 3]);
    > [1, 2, 3]

    ev.setDel('key', 2);
    > [1, 3]


<h4><a name="settoggle"></a>[set] .setToggle(key, value &lt;, meta &gt; )</h4>

 * Creates key if it doesn't exist, as an array
 * Removes value from the set if it is there.
 * Adds value to the set if it is not there.
 * If the set is not modified, events aren't run.
 * Returns set.

Example:

    ev.setAdd('key', 1);
    > [1]

    ev.setToggle('key', 1);
    > []

    ev.setToggle('key', 1);
    > [1]

#### Values

<h4><a name="incr"></a>[number] .incr(key &lt;, amount, meta &gt; )</h4>

 * Atomically (in the JS sense) increments a key's value. 
 * It will initialize the key to the numeric value amount or 1 if it's not a number
 * Returns the result of the set event.

Example:

    ev.incr('key')
    > 1

    ev.incr('key', 2)
    > 3

Also if the second argument is a string, then this gets treated as an expression.  
A place where this would be useful is say if you have a volume button and you want
it to go up 110% and down 90% as opposed to a +/- 10 amount.  Here (as of 0.1.80) 
you can use `incr` as a general purpose `mod` as follows:

    ev.incr('volume', '*(11/10)')
    > 1.100

    ev.incr('volume', '*(10/11)')
    > 1.000

In fact, `.mod` is aliased to `.incr` to make this look more semantically meaningful:

    ev.mod('volume', '*(11/10)')
    > 1.100

    ev.mod('volume', '*(10/11)')
    > 1.000

Does the same thing.

You can set ceilings and floors by denying the values through tests such as:

    ev.test('volume', function(val, meta) {
      meta(val > 10 || val < 0);
    });

<h4><a name="decr"></a>[number] .decr(key &lt;, amount, meta &gt; )</h4>

 * Atomically (in the JS sense) decrements a key's value by an amount or 1 if not specified. 
 * It will initialize the key to the numeric value 0 if it's not a number
 * Returns the result of the set event.

Example:

    ev.decr('key')
    > 0

    ev.decr('key', 2)
    > -2 

### Triggers

These triggers have different semantic values although they all function in much the same way.
If you want to view or modify the current triggers assigned you can do so by not providing a secondary
argument like so:

    ev.on("key");

With that you can do things like re-order, remove, or add things manually.  

It's worth noting that the second argument can be an array of functions so you can do things like

    ev.on('key', ev.on('key1'));

To duplicate functionality.

<h4><a name="on"></a>[handle] .on(key, lambda ( value, { key, old, meta } ) )</h4>

 * Runs every time the key is set.
 * Returns a handle that can be passed into `ev.del` to deregister.

<h4><a name="after"></a>[handle] .after(key, lambda ( value, { key, old, meta } ) )</h4>

 * Runs after a key has been set
 * Returns a handle that can be passed into `ev.del` to deregister.

<h4><a name="test"></a>[handle] .test(key, lambda ( value, { key, old, result, meta, value } ))</h4>

 * Can block `ev.set`  or `ev(key, value)` and thus suppress the "ON" and "AFTER" functions.
 * If the test succeeds, then the function may either 
   * call a supplied callback function, named `result` and supplied in an object in the second argument. Calling the function with anything
   other then the boolean false signals that the check succeeded. That means that calling `.result()` means "go ahead".
   * or return the boolean `true`. (you can return a boolean of `false` to represent test failure).
   * also, `.result()` is aliased to `.done()` and can also be invoked by calling the object, as in `function(val, meta) { meta() }`.
 * The return value of the callback that is passed in passed through the test function.
 * The value of `meta.value` cascades down through the test suite as the value to be 
 tested and eventually the value to be set. This means it is mutable.
 * Tests are run in order based on the successful call of a `lambda` from the last test.  This allows for an asynchronous cascading of middleware and mutation of data.

Example:

    // set up a test condition that tells whether
    // the test should succeed or not - only go forward
    // when value is truthy.
    ev.test('key', function(value, meta) {
      meta(value == true);
    });

    // this will only run 1 time because 
    // the test will fail on the second
    // execution.
    ev.after('key', function(){ 
      console.log('here');
    });

    // this should run.
    ev.set('key', true);

    // sets the key to an undefined value.
    ev.set('key', false);

<h4><a name="or"></a>[handle] .or(key, lambda ( value, { key, old, result, meta } ))</h4>

  * Runs if a `test` is registered and the test suite fails

Example:

    ev.test('key', function(val, meta){
      meta(false);
    }).or('key', function(val) {
      console.log("failure");
    });

<h4><a name="when"></a>[handle] .when(key, value | test | eval string, lambda)</h4>

 * Executes lambda when `key === value` OR `test(value) == true`
 * **Note:** By default, this handler runs every time that key gets set to value. To make this a one-time run, you can do the following:

    `ev.once(ev.when('key', 'value', callback))`

 * There is also an object-style way of doing this which offers more fidelity then the regular `isset` which just checks to see 
   if something is or is not set. In this mode you can do things like:

   `ev.when({
      key1: 'value1',
      key2: 'value2'
    }, function() ... );
   `
This model above helps handle multiple dependencies where each one takes on a specific value.

If invoked as `.when(key, lambda)` then this works identical to an `.isset()` so long as the key isn't an object.

<h4><a name="del"></a>[void] .del(handle)</h4>

 * Deregisters a hooked function from running.
 * Can be called inside the function itself.

Example:

    var 
      ev = EvDa(),
      handle = ev('key', function(value) { 
        console.log(value);
      });

    ev('key', 1);

    ev.del(handle);

    ev('key', 2); << this will not be run.

Inline example:

    var ev = EvDa();

    ev('key', function(value) { 
      console.log(value);

      if(value == 1) {
        // Using the callee reference works as
        // a valid way to deregister the function.
        ev.del(arguments.callee);
      }
    });

    ev('key', 1);
    ev('key', 2); << this will not be run.

<h4><a name="setter"></a>[bolean] .setter(key, lambda)</h4>

 * State that the setter for a key is a callback. 
   This will be run if there are things blocked on it.
 * Returns whether it was run immediately or not.
 * Useful for asynchronous operations, such as a login screen; wherein you only
   want to give it to the user when applicable
 * The lambda function may have a function that it runs when its ready.  That's to say something like this:

      `ev.setter("username", function(done) {
        $.get("/whoami", done);
      });`

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

<h4><a name="fire"></a>[void] .fire(key | [ key1, key2, ..., keyn ] &lt;, key &gt; )</h4>

 * Runs the setter mechanics without changing any values.
 * Equivalent to `ev.set(key, ev(key), {noset: true})`.

#### Grouping

<h4><a name="group"></a>[setter] .group(list, params)</h4>

 * Identical to an ev() command as documented above, except for the first parameter.
 * The first parameter, list, categorizes lambdas into a group that can be disabled or enabled in bulk.
 * A disabled lambda retains its position in the chain but is simply skipped.
 * Callbacks can be disabled through multiple lists and enabled.  Only if it is completely enabled after being disabled through all routes will it run again.
 * This function returns a setter for syntactic convenience so that it doesn't have to be explicitly invoked each time.

<h4><a name="enable"></a>[list] .enable( list )</h4>

 * Enables a list of lambdas previously disabled and set up through the `ev.group()` call.
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

<h4><a name="db"></a>.db</h4>

 * A direct reference (not a copy) to the internal hash.  This can be used to extend the library

<h4><a name="events"></a>.events(name, type)</h4>

 * With no arguments, the event system is returned.
 * With a name argument, all of the types of events associated with that name is returned.  These can be re-ordered.

For instance, say I had two test conditions and I wanted to make the second one registered run first.

    ev.test('key', fun2);

    ev.test('key', fun1);

I can use this to re-order the events.

    var list = ev.events('key', 'test');

    list.unshift(list.pop());

And there I go.

<h4><a name="sniff"></a>.sniff(arg)</h4>

 * Wraps set in a console.log abstraction
 * `ev().traceList` is also exposed. It's an
   array and run every time.
 * if arg is
   * a string - that event is excluded from being logged
   * empty - the current set of excluded events are returned
   * FALSE - this feature is disabled
   * TRUE - the feature is enabled

The `traceList` parameter can be directly manipulated.

By default the bubbled top, "", is set to be ignored. This can be un-ignored with `ev.sniff('')`.

<h4><a name="empty"></a>.empty( &lt; key1, key2, ..., keyn &gt; )</h4>

 * With no arguments:
   * Removes all keys from the object
 * Otherwise:
   * Sets array and Set keys to the empty array ( `[]` )
   * Sets all other keys to null

 * Both invocations:
   * Does not call any triggers during the removal
   * Retains all hooks for re-population.

<h4><a name="version"></a>__version__</h4>

 * In the `release/` directory, a `__version__` string is tacked on to the global `EvDa` object.
 * This is a result of a `git describe` as run from the `tools/deploy.sh` directory.
 * The master is always assumed to be stable and current. 
   * This library has been in development since 2008 and is in constant, widespread, production use. The API can be considered stable and is forwards compatible from about 2010 meaning that a git pull from master can be considered safe.

<h4><a name="callbackhell"></a>Avoiding callback hell</h4>

Callback hell is an example of an [action at a distance](https://en.wikipedia.org/wiki/Action_at_a_distance_%28computer_programming%29) antipattern.  In general terms, this is the same problem that you get from C unions or C++ operator overloading.

You see a seemingly linear state of events such as (in EvDa):

    ... 
    ev.set('key', 'value');
    ...


or in C:

    some_union.prop = 1;

or in C++:

    c = a + b;

And you *think* you know what's going on.  But really, anything could be happening.  Not only, but if you load up a debugger you could be jumping around to weird parts of the code or worse yet, go through quite a few layers of scaffolding and redirection before getting to the actual thing that is happening.

The powerful abstraction and comprehension that these methodologies afford can also violate the separation of concerns and make code do too many things at once. At the end you have code that works like some marvelous complex watch with interacting gears and not a straight-forward easy to dissect or recompose thing.

The generalized event listener and multiple-dispatch model suffer from this problem. 

EvDa seeks to try to solve this through introspection tools.

### Examples

#### Two-way binding

This is all the hot-sauce these days, as if it's some kind of miraculous difficult thing to achieve. 
Here's something I did for my [indycast](https://github.com/kristopolous/DRR) project called `easy_bind`.

You can see how nicely evda plays with underscore, modern js, and jquery:

The invocation here that I want to do is have a number of `li > a` style selectors and 
`input[type=text]`. I want to have two way data-binding so that I can do something like:

    easy_bind(['email', 'notes', 'duration', 'station']);

And then have those keys in the data always reflect the selected things on the UI.  

Do we need to build the Entire Application with Ember or Angular for this? Of course not!

Here's a basic function that can easily do two-way databinding without trying to redefine
javascript as something crazy-hard and really weird or annotating your HTML in order to
satisfy some supposedly sophisticated library:


    function easy_bind(list, instance) {

      if (!instance) {
        if (ev) {
          instance = ev;
        } else {
          throw "Can't find any instance to attach to";
        }
      }

      // There's some claim that you can feature-test everything. 
      // Some totally bogus claim, that is.
      var 
        isiDevice = navigator.userAgent.match(/ip(hone|od|ad)/i),
        listenEvent = isiDevice ? 'touchend' : 'click';

      // Take each "query" to bind to from the list
      _.each(list, function(what) {

        // Look for a node with that name
        var node = document.querySelector('#' + what);

        if(!node) {
          // And if it doesn't exist, see if some input has it
          node = document.querySelector('input[name="' + what + '"]');

          // Alright that didn't work, let's bail
          if(!node) {
            throw new Error("Can't find anything matching " + what);
          }
        }

        // If we are looking at an input box, then we can just grab
        // the value of it
        if(node.nodeName == 'INPUT') {

          $(node).on('blur focus change keyup', function() {
            instance(what, this.value, {node: this});
          });

          // This is the 'two-way' ... 
          instance(what, function(val){ 
            if(val !== undefined) {
              node.value = val; 
            }
          });

        } else {

          // Otherwise there's some complex UL/LI structure that is mostly an artifact
          // of the limitations of CSS.  Regardless, after all the onion-style wrappings, 
          // there should be an <a> tag underneath
          $("a", node).on(listenEvent, function(){

            // This tricks stupid iDevices into not screwing with the user.
            // (Requiring a user to tap twice to select anything.  WTF apple...)
            var mthis = this;

            setTimeout(function(){
              instance(what, mthis.getAttribute('data') || mthis.innerHTML);
            }, 0);
          });

          // Here's the two-way
          instance(what, function(val) {
            $("a", node).removeClass("selected");
            if (val) {
              $("a", node).filter(function(){return this.innerHTML == val}).addClass("selected");
              $("a[data='" + val + "']", node).addClass("selected");
            }
          });
        }

        instance.fire(what); 
      });
    }

#### Easy syncing

The two way data-binding is ok for the local in-memory structures but what if I want
to make this work independently with a syncing layer (yes, completely independently as in
one doesn't know about the other.)

Here's an `easy_sync` implementation from the [same project](https://github.com/kristopolous/DRR):

    // First we have a local-storage getter/setter that is determined
    // based on argument length - to make our lives easier.
    function ls(key, value) {
      if (arguments.length == 1) {
        return localStorage[key] || false;
      } else {
        localStorage[key] = value;
      }
      return value;
    }

    // Now we use it to sync things to the local storage
    function easy_sync(list) {
      _.each(list, function(what) {
        if(ls(what)) {
          ev(what, ls(what));
        }
        ev.after(what, function(value) {
          ls(what, value);
        });
      });
      return ev('');
    }

Using the two above functions I was able to write something like:

    easy_bind(['email', 'notes', 'station', 'duration']);
    var map = easy_sync(['email', 'station']);

    if(map.station) ...

And then have the two way data-binding with remote syncing and I don't have to be restricted to
how I'm going to structure my end-points, or what templating engine I'm using or whatever else.

You can just do this one single thing, and not get a bunch of garbage with it.  Refreshing.

For convenience, these have been included in `evda-helper.js`.

#### Even more?!

Sure.

 * My [ytmix](https://github.com/kristopolous/ytmix) project uses this library all over the place.
 * There is an examples directory in the github repo

