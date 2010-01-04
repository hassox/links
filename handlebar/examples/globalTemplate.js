var sys       = require('sys');
var Handlebar = require('../handlebar').Handlebar;

var Chain = require('../vendor/chain/lib/chain');

var handlebar = new Chain.Link("handlebar", new Handlebar({viewRoots : ["globalTemplates"]}));

//sys.puts(handlebar.onRequest.toString());

function handler(env){
  env.data = { name : "Harry" }
  env.handlebar = {
    template  : "helloFoo",
    format    : "html"
  }
  env.send(handlebar);
}

var app = Chain.Builder.make([
  handler,
  handlebar
]);

Chain.run(app);





