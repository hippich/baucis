// __Dependencies__
var mongoose = require('mongoose');
var Controller = require('../Controller');
var BaucisError = require('../BaucisError');

// __Module Definition__
var decorator = module.exports = function (options, protect) {
  var controller = this;

  controller.vivify = function (path) {
    var definition = controller.model().schema().path(path);
    var ref = definition.caster.options.ref;

    if (definition.caster.instance !== 'ObjectID') {
      throw BaucisError.Configuration('Only paths with a type of ObjectId can be vivified');
    }
    if (!ref) {
      throw BaucisError.Configuration('Only paths that reference another collection can be vivified');
    }

    var child = Controller(ref).baucisPath(path);

    child.request('post', function (request, response, next) {
      request.baucis.incoming(function (context, callback) {
        var path = child.parentPath();
        if (!context.incoming[path]) context.incoming[path] = request.baucis.parentId;
        callback(null, context);
      });
      next();
    });

    child.query(function (request, response, next) {
      var conditions = {};
      conditions[child.parentPath()] = request.baucis.parentId;
      request.baucis.query.where(conditions);
      next();
    });

    controller.children(child);

    return child;
  };
};
