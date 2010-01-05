var sys       = require('sys');
var url       = require('url');
var Handlebar = require('../handlebar').Handlebar;

var Chain = require('../vendor/chain/lib/chain');

var handlebar = new Chain.Link("handlebar", new Handlebar({viewRoots : ["globalTemplates", "notHere", "andNotThereEither"]}));

//sys.puts(handlebar.onRequest.toString());

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

/* We'll create a handler that is object based that will register itself with handlebar */

var app = Chain.Builder.make([
  handler,
  handlebar
]);

Chain.run(app);
