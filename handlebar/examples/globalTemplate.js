/* This is a playground for using handlebar
 * the following urls are active:
 * * http://localhost:8000/helloFoo
 * * http://localhost:8000/helloBar
 * * http://localhost:8000/simple/foo
 * * http://localhost:8000/simple/foo.html
 * * http://localhost:8000/simple/foo.js
 */

var sys       = require('sys');
var url       = require('url');
var path      = require('path');
var Handlebar = require('../handlebar').Handlebar;

var Chain = require('../vendor/chain/lib/chain');

var handlebar = new Chain.Link("handlebar", new Handlebar({viewRoots : ["globalTemplates"]}));

/* We'll create a handler that is object based that will register itself with handlebar */
function SimpleRenderer(){
  handlebar.register(this, ["simpleRenderer/views"]);

  var formatRegexp = /(.*?)(\.(\w+))?$/

  this.onRequest = function(env){

    // get the format
    var regResult = env.url.pathname.match(formatRegexp)
    if (regResult){
      var format        = regResult[3] || "html";
      var templateName  = path.filename(regResult[1]);
    } else {
      var format        = "html";
      var templateName  = path.filename(env.url.pathname);
    }

    // kind of irrelevant in this case
    env.data = {
      user  : {
        name  : "Barry",
        title : "Mr."
      }
    }

    // setup the handlebar object for use during rendering
    env.handlebar = {
      owner     : this,
      "format"  : format,
      template  : templateName,
      data      : env.data.user
    }

    env.send(handlebar, function(){
      if(format == "html"){
        // Lets just setup some extra munging on the body when we get it back
        var result = env.body;
        env.body = result + "\n\n</br>This has been modified by the letter S and the number 4";
      }
      env.done();
    })
  }
}

var simpleRenderer = new Chain.Link("simple renderer", new SimpleRenderer())

function handler(env){

  /* Sets up the data for handlebar to render with
   */
  env.handlebar = {
    format    : "html",
    data      : {
      name : "Bob"
    }
  }
  env.handlebar.template = env.url.pathname;

  // Pass the request forward to handlebar for rendering
  env.send(handlebar);
}

var routerRegexp = /^\/simple/
function router(env){
  if(env.request.url.match(routerRegexp)){
    env.send(simpleRenderer);
  } else {
    env.send(this.nextApp);
  }
}

var app = Chain.Builder.make([
  router,
  handler
]);

Chain.run(app);
