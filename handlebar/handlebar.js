/* Handlebar is a Chain application built.  It's built to act as a central
 * rendering component using mustache templates.
 *
 *
 * When creating your handlebar component you can provide it an option hash where you may register a global views directory.  This directory is the fallback directory for all rendering requests.
 *
 *   var handlebar = new Handlebar({ viewRoots : ["views"]})
 *
 * You can also register your component with a handlebar and provide it with an array of paths that will be checked in reverse order for the template you're looking for.
 *
 *  handlebar.register(myApp, ["/some/library/position", "views/myApp"])
 *
 * All data to be rendered, including the template to render should be stored on the env object.
 *
 * Template options / name should be stored in:
 *   env.handlebar
 *    .name   = "template/name/as/path"
 *    .format = "html"
 *
 * Store data in the Chain data store at
 *    env.data
 *
 * @example
 *    env.data = {
 *      post : {
 *        title : "Some Post",
 *        body  : "A post body"
 *      }
 *    }
 *
 *    env.handlebar = {
 *      owner   : myComponent,
 *      name    : "show",
 *      format  : "html"
 *      data    : env.data // default is env.data
 *    }
 *
 *  This is essentially an experiment and all input is welcome
 *
 * @author Daniel Neighman
 *
 */

var sys       = require('sys');
var posix     = require('posix');
var Mustache  = require('./vendor/mustache.js/mustache').Mustache;

function Handlebar(opts){
  this.viewRoots  = opts.viewRoots || ["views"];
  this.components = {};
  this.components.global  = {};
  this.components.global.viewRoots = this.viewRoots
}


function HandlebarPrototype(){
  function getSettings(opts){
    var comp = opts.owner || "global";
    return this.components[comp];
  }

  function findTemplate(name, format, paths){
    var promise = new process.Promise();
    promise.timeout(500);
    var templateName = paths[0] + "/" + name + "." + format + ".js"
    var templateContent = posix.cat(templateName, "utf8");

    templateContent.addCallback(function(content){
      promise.emitSuccess(content);
    })

    templateContent.addErrback(function(error){
      // call again if paths has more paths to check
      sys.puts("ADDING THE ERROR");
      error.handlebar = { "templateName" : templateName}
      promise.emitError(error)
    })

    return promise;
  }

  this.onRequest = function(env){
    var opts      = env.handlebar || {};
    var settings  = getSettings.call(this, opts);
    var paths     = settings.viewRoots;
    opts.format   = opts.format || "html";
    // find the template
    var template = findTemplate(opts.template, opts.format, paths);

    template.addCallback(function(templateContent){
      env.body = templateContent
      env.done();
    })

    template.addErrback(function(error){
      var templateName = templateNameFromOpts(opts)
      var msg = "Failed to render template:\n" + templateName
      env.body = msg;
      env.body += "\ntemplateName" + templateName
      env.status = 404;
      env.done();
    })
  }

  function templateNameFromOpts(opts){
    return opts.template + "." + opts.format;
  }
}

Handlebar.prototype = new HandlebarPrototype();

exports.Handlebar = Handlebar;
