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
var path      = require('path');
var Mustache  = require('./vendor/mustache.js/mustache').Mustache;

function Handlebar(opts){
  this.viewRoots  = opts.viewRoots || ["views"];
  this.components = {};
  this.components.global  = {};
  this.components.global.viewRoots = this.viewRoots;
  this.templateCache = {};
}

function HandlebarPrototype(){
  function getSettings(opts){
    var comp = opts.owner || "global";
    opts.owner = comp;
    if(!this.templateCache[comp])
      this.templateCache[comp] = {}; // setup the view cache

    return this.components[comp];
  }

  function templateNameFromOpts(opts){
    return opts.template + "." + opts.format;
  }

  function findTemplate(opts, paths){
    var self = this;
    var promise = new process.Promise();
    promise.timeout(500);
    var thePath           = paths[paths.length - 1];
    var templateName      = templateNameFromOpts(opts);
    var fullTemplatePath  = path.join(thePath, templateNameFromOpts(opts) + ".js")

    // get the cached template if it exists
    var templateContent = self.templateCache[opts.owner][templateName]
    if(templateContent){
      setTimeout(function(){ promise.emitSuccess(templateContent) }, 0);
    } else {
      templateContent = posix.cat(fullTemplatePath, "utf8");

      templateContent.addCallback(function(content){
        self.templateCache[opts.owner][templateName] = content
        promise.emitSuccess(content);
      })

      templateContent.addErrback(function(error){
        if(paths.length > 1) {
          var nextTry = findTemplate.call(self, opts, paths.slice(0, paths.length - 1))
          nextTry.addCallback(function(content){
            promise.emitSuccess(content);
          });

          nextTry.addErrback(function(error){
            promise.emitError(error);
          });
        } else {
          error.handlebar = { "templateName" : templateName}
          promise.emitError(error)
        }
      })
    }
    return promise;
  }

  this.onRequest = function(env){
    var opts      = env.handlebar || {};
    var settings  = getSettings.call(this, opts);
    var paths     = settings.viewRoots;

    env.handlebar.data = env.handlebar.data || env.data || {};

    opts.format   = opts.format || "html";
    var template  = findTemplate.call(this, opts, paths);

    template.addCallback(function(templateContent){
      env.body = Mustache.to_html(templateContent, env.handlebar.data);

      // Add a header for the format
      // env.header["Content-Type"] = formatMimeType(opts.format)
      env.done();
    })

    template.addErrback(function(error){
      var templateName = templateNameFromOpts(opts)
      var msg = "Failed to render template:\n" + templateName
      msg += "\n" + sys.inspect(error)
      env.body = msg;
      env.body += "\ntemplateName" + templateName
      env.status = 404;
      env.done();
    })
  }

  this.register = function(app, viewRoots){
    this.components[app] = {};
    this.components[app].viewRoots = viewRoots;
  }
}

Handlebar.prototype = new HandlebarPrototype();

exports.Handlebar = Handlebar;
