var Alloy = require('alloy'),
	_ = require("alloy/underscore")._,
	TAP = Ti.App.Properties;

function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

function guid() {
   return (S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4());
};

function Sync(model, method, opts) {
	var prefix = model.config.adapter.collection_name ? model.config.adapter.collection_name : 'default';
	var regex = new RegExp("^(" + prefix + ")\\-(.+)$");
	var resp = null;

	if (method === 'read') {
		if (opts.parse) {
			// is collection
			var list = [];
			_.each(TAP.listProperties(), function(prop) {
				var match = prop.match(regex);
				if (match !== null) {
					list.push(TAP.getObject(prop));
				}
			});
			model.reset(list);
			resp = list;
		} else {
			// is model
			var obj = TAP.getObject(prefix + '-' + model.id);
			model.set(obj);
			resp = model.toJSON();
		}
	}
	else if (method === 'create' || method === 'update') {
		var newId = model.id || guid();
		model.set({id: newId}, {silent:true});
		TAP.setObject(prefix + '-' + newId, model.toJSON() || {});
		resp = model.toJSON();
	} else if (method === 'delete') {
		TAP.removeProperty(prefix + '-' + model.id);
		model.clear();
		resp = model.toJSON();
	}

	// process success/error handlers, if present
	if (resp) {
        _.isFunction(opts.success) && opts.success(resp);
        method === "read" && model.trigger("fetch");
    } else {
    	_.isFunction(opts.error) && opts.error("Record not found");
    }
}

module.exports.sync = Sync;
module.exports.beforeModelCreate = function(config) {
	// make sure we have a populated model object
	config = config || {};
	config.columns = config.columns || {};
	config.defaults = config.defaults || {};

	// give it a default id if it doesn't exist already
	if (typeof config.columns.id === 'undefined' || config.columns.id === null) {
		config.columns.id = 'String';
	}

	return config;
};
