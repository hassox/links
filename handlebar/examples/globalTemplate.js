var sys       = require('sys');
var Handlebar = require('../handlebar').Handlebar;

var Chain = require('../vendor/chain/lib/chain');

var handlebar = new Chain.Link("handlebar", new Handlebar({viewRoots : ["globalTemplates"]}));

//sys.puts(handlebar.onRequest.toString());

function handler(env){
  env.data = { name : "Harry" }
  env.handlebar = {
    format    : "html"
  }
  env.handlebar.template = env.request.uri.path;

  env.send(handlebar);
}

var app = Chain.Builder.make([
  handler,
  handlebar
]);

Chain.run(app);





