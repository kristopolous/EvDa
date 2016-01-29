EvDa.easy_bind = function(list, instance) {

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

EvDa.extend('expose', function(pub, key_list) {
  if(!EvDa.isArray(key_list)) {
    key_list = [key_list];
  }
  for(var ix = 0; ix < key_list.length; ix++) {
    (function(){
      var key = key_list[ix];
      pub.context[key] = function() {
        pub.apply(pub.context, [key].concat(Array.prototype.slice.call(arguments)));
      }
    })();
  }
});

(function(){
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
  EvDa.easy_sync = function(list) {
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
})();
