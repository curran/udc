(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else {
        root['MyModule'] = factory();
    }
}(this, function() {

// An example universal module.
// Curran Kelleher 4/21/2014
MyModule = {
  speak: function () {
    return "hello";
  }
};


return MyModule;

}));
