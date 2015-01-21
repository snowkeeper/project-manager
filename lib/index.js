var npm = require('npm');
var GitHubApi = require('github');
var jf = require('jsonfile');
var mkdirp = require('mkdirp');
var async = require('async');
var moment = require('moment');
var _ = require('lodash');
var archiver = require('archiver');
var request = require('superagent');
var Datastore = require('nedb');
var hat = require('hat');
var forever = require('forever-monitor');
var rmdir = require('rimraf');

var NWJS = require('nw.gui');
var Path = require('path');
var util = require('util');
var fs = require('fs');
var EventEmitter = require("events").EventEmitter;
var spawn = require('child_process').spawn;

var config = require('./webkit/pkg/config.js');
var defaultPkg = require('./webkit/pkg/package.json');
var defaultKeystone = process.cwd() + '/webkit/pkg/keystone.js';

require('dotenv').load();

var manager = function() {
	
	var _this = this;
	
	EventEmitter.call(this);	
	
	this.init();
	
}

/**
 * attach the event system to manager 
 * */
util.inherits(manager, EventEmitter);

manager.prototype.init = function(cb) {
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	var _this = this
	
	// set up project config
	// Project config
	this.Project = {
		name: 'Keystone',
		github: 'snowkeeper/keystone',
		repo: 'keystone',
		repouser: 'snowkeeper',
		npm: 'keystone',
		githubUser: process.env.GITUSER,
		githubPass: process.env.GITPASS
	}
	var cwd = process.cwd();
	this.Project.paths = {
			appData: Path.join(cwd, 'appData'),
			gzip: Path.join(cwd, 'appData', _this.Project.name, 'builds', 'archives'),
			pid: Path.join(cwd, 'appData', _this.Project.name, 'pid'),
			logs: Path.join(cwd, 'appData', 'logs'),
			dbConfig:  Path.join(cwd, 'appData', _this.Project.name),
			dbBuild: Path.join(cwd, 'appData', _this.Project.name, 'builds', 'db')
	}

	// make sure dirs are available
	mkdirp(this.Project.paths.appData, function(err) { if(err)_this.snowlog.error('mkdirp ERROR',err); }); //appData
	mkdirp(this.Project.paths.logs, function(err) { if(err)_this.snowlog.error('mkdirp ERROR',err); }); //logs
	mkdirp(this.Project.paths.dbBuild, function(err) { if(err)_this.snowlog.error('mkdirp ERROR',err); }); // individual build db
	mkdirp(this.Project.paths.dbConfig, function(err) { if(err)_this.snowlog.error('mkdirp ERROR',err); }); // app db
	mkdirp(this.Project.paths.gzip, function(err) { if(err)_this.snowlog.error('mkdirp ERROR',err); }); // gzip files
	mkdirp(this.Project.paths.pid, function(err) { if(err)_this.snowlog.error('mkdirp ERROR',err); }); // pid files
	
	// log
	var winston = require('winston');
	var logname = this.Project.name + '.' + moment(new Date()).format() +'.log';
	this.snowlog = new (winston.Logger)({
		transports: [
			//new (winston.transports.Console)(),
			new (winston.transports.File)({ filename: Path.join(this.Project.paths.logs,logname) })
		]
	});
	
	this._context = hat();
	this.__dir = process.cwd();
	
	/* our database methods */
	this.db = {
		config: new Datastore({ filename: Path.join(this.Project.paths.dbConfig , this.Project.name + '__savedConfig.db'), autoload: true  }),
		latest: new Datastore({ filename: Path.join(this.Project.paths.dbConfig , this.Project.name + '__latestConfig.db'), autoload: true  }),
	}
	
	/*github*/
	this.repo = this.Project.repo;
	this.repouser = this.Project.repouser;
	this.branches = false;
	/*npm*/
	this.current = false;
	this.versions = false;
	
	/* running instances with process*/
	this._nodes = {}
	/* pull in any previous running instances and mark them as stale */
	this._unRegisterNodes();
	
	/* set the defaults for the current build */
	this.resetConfig();
	
	this.GitHub = new GitHubApi({
		// required
		version: "3.0.0",
		// optional
		debug: false,
		protocol: "https",
		timeout: 7500,
		headers: {
			"user-agent": "keystonejs", // GitHub is happy with a unique user agent
		}
	});
	
	/* github methods */
	this.github = {
			auth: function() {
				if(_this.Project.githubUser && _this.Project.githubPass) {
					_this.GitHub.authenticate({
						type: "basic",
						username: _this.Project.githubUser,
						password: _this.Project.githubPass
					});
				}
			},
		
	};
	
	var finish = function() {
		
		/* grab the last doc or get a new one */
		_this.db.latest.findOne({ name: 'latest' }, function (err, doc) {
			if(!doc) {
				/* create the latest entry */
				_this.db.latest.insert({name:'latest',latest:false});
				_this.newDoc();
				
			} else {
				if(doc.latest) {
					
					_this.getDoc(doc.latest);
					
				} else {
					
					_this.newDoc();
					
				}
			}
		});
		
	}
	
	npm.load(npm.config,function(err){
			if(err) {
				console.warn('ERROR',err);
				return;
			}
			/* prepare the sources */
			_this.getVersions();
			_this.getBranches();
			
			finish(cb)
	});
	
}

manager.prototype.resetConfig = function() {

	/*config*/
	this.version = false;
	this.type = 'module';
	this.models = [];
	this.modules = [];
	this.routes = [];
	
	
	this.config =  {};
	_.each(config,function(v){
		this.config[v.key] = v;
	},this);
	
	this.doc = {};
}

manager.prototype._unRegisterNodes = function() {
	
	var _this = this;
	
	this.db.config.find({})
		.sort({ today: -1 })
		.exec(function(err,docs) {
			_.each(docs,function(doc) {
				if(doc.pid) {	
					
					_this.updateDocById(doc._id,{status:'stopped',pid:false});
					
				}
			});
					
		});
	
}

manager.prototype.contextMenu = function(cutLabel, copyLabel, pasteLabel) {
	var _this = this;
	var gui = NWJS;
	var menu = new gui.Menu();

	var cut = new gui.MenuItem({
		label: cutLabel || "Cut",
		click: function() {
			document.execCommand("cut");
		}
	});

	var copy = new gui.MenuItem({
		label: copyLabel || "Copy",
		click: function() {
			document.execCommand("copy");
		}
	});

	var paste = new gui.MenuItem({
		label: pasteLabel || "Paste",
		click: function() {
			document.execCommand("paste");
		}
	});
	
	var snap = new gui.MenuItem({
		label: "Snapshot",
		click: function() {
			Manager.takeSnapshot();
		}
	});

	menu.append(cut);
	menu.append(copy);
	menu.append(paste);
	menu.append(snap);
	
	return menu;
}

manager.prototype.newDoc = function(cb) {
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	var _this = this;
	
	this.resetConfig();
	
	var doc = { 
		version: this.version
        , name: hat()
        , repo: this.repo
        , today: new Date()
        , repouser: this.repouser
        , type: this.type
        , models: this.models  
        , modules: this.modules
        , routes: this.routes
        , config: this.config
        , temp: true
	};
	
	_this.db.config.insert(doc, function (err, newDoc) {   
		_this.doc = {
			id: newDoc._id,
			doc: newDoc,
			db: new Datastore({ filename: Path.join(_this.Project.paths.dbBuild,'__' + doc.name + '__.db'), autoload: true  })
		}
		/* set the latest */
		_this.getView(function() {
			_this.db.latest.update({ name: 'latest' }, { $set: { latest:newDoc._id }}, {});
			cb();	
		});
		
	});
}

manager.prototype.switchDoc = function(id,cb) {
	var _this = this;
	
	_this.getDoc(id,function() {
		cb()
	});
}

manager.prototype.getDoc = function(id,cb) {
	
	var _this = this;
		
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	//console.log('get doc',id);
	_this.db.config.findOne({ _id: id }, function (err, doc) {
		_this.doc = {
			id: doc._id,
			doc: doc,
			db: new Datastore({ filename: Path.join(_this.Project.paths.dbBuild,'__' + doc.name + '__.db'), autoload: true  })
		}
		_this.version = doc.version;
		_this.type = doc.type;
		_this.models = doc.models || [];
		_this.modules = doc.modules || [];
		_this.routes = doc.routes || [];
		_this.config = doc.config;
		
		var callback = function() {
			/* set the latest */
			_this.db.latest.update({ name: 'latest' }, { $set: { latest:doc._id }}, {});
			cb(null,_this.doc)
		}
		if(_this.type === 'module')_this.getView(callback);
		if(_this.type === 'branch')_this.getPackageFromGitHub(_this.version,callback);
		
		
	});
}

manager.prototype.getDocByName = function(name,cb) {
	
	var _this = this;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	if(!name) {
		return cb('name required');
	}
	
	_this.db.config.findOne({ name: name }, function (err, doc) {
		cb(null,doc)
	});
}

manager.prototype.getDocById = function(id,cb) {
	
	var _this = this;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	if(!id) {
		return cb('id required');
	}
	
	_this.db.config.findOne({ _id: id }, function (err, doc) {
		cb(null,doc)
	});
}

/* pre methods for update 
 * takes the object ot be updated
 * returns the new modified object
 * */
manager.prototype.updateDocPre = function(doc,callback) {
	if(doc.name) {
		doc.saneName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	}
	
	callback(null,doc);
}

manager.prototype.updateDoc = function(obj,cb) {
	
	if(!_.isObject(obj))return false;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	var _this = this;
	
	this.updateDocPre(obj, function(err,ready) {
		
		var doc = _this.doc.doc;
		
		_.assign(doc,ready);
			
		_this.db.config.update({ _id: doc._id }, doc, {}, function (err, numReplaced) {
				_this.doc.doc = doc
				//console.log('update',doc);
				cb(null,_this.doc);
		});	
	});
	

}


manager.prototype.updateDocById = function(id,obj,cb) {
	
	if(!_.isObject(obj))return false;
	if(!id)return false;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	var _this = this;
	
	this.getDocById(id,function(err,doc) {
		
		if(err || !doc)cb('error finding doc by id ' + id);
		
		_this.updateDocPre(obj, function(err,ready) {
			
			_.assign(doc,ready);
			
			_this.db.config.update({ _id: doc._id }, doc, {}, function (err, numReplaced) {
					if(err)return cb('error updating doc by id ' + id);
					cb(doc);
			});
		});
	});

}

manager.prototype.updateDocByName = function(name,obj,cb) {
	
	if(!_.isObject(obj))return false;
	if(!name)return false;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	
	var _this = this;
	
	this.getDocByName(name,function(err,doc) {
		if(err || !doc)cb('error updating ' + name);
		
		_this.updateDocPre(obj, function(err,ready) {
			
			_.assign(doc,ready);
			
			_this.db.config.update({ _id: doc._id }, doc, {}, function (err, numReplaced) {
					if(err)return cb('error updating doc by id ' + id);
					cb(doc);
			});
		});
		
	});

}

manager.prototype.getVersions = function(cb) {
	
	var _this = this;
	var timeout = setTimeout(function() {
		_this.emit('versions',{success:false,err:'Taking a looooong time.  Still waiting...'});
	},7500);
	return npm.commands.view([_this.repo],{silent:true},function(err,data) {
		if(err) {
			console.warn('VIEW ERROR',err);
			
			return _.isFunction(cb) ? cb(err) : false;
		}
		clearTimeout(timeout);
		var currentKey = _.keys(data)[0];
		_this.versions = data[currentKey].versions;
		_this.emit('versions',{success:true});
		_this.current = data;
	});

}

manager.prototype.getView = function(version,cb) {
	
	var _this = this;
	
	if(_.isFunction(version)) {
		cb = version;
		version = false;
	}
	
	var _version = version === false ? _this.version : version;	
	if(version === 'link')version = '';
	
	var ver = '';
	if(version === false && _this.version && _this.version !== 'link') ver = '@' + _this.version
	
	var repo = version ? _this.repo + '@' + version : _this.repo + ver;
	
	return npm.commands.view([repo],{silent:true},function(err,data) {
		if(err) {
			console.warn('VIEW ERROR',err);
			return _.isFunction(cb) ? cb(err) : false;
			
		}
		//console.log(repo,_version)
		_this.current = data;
		
		var currentKey = _.keys(data)[0];
		if(_version === '')_version = currentKey;
		_this.versions = data[currentKey].versions;
		_this.version = _version;
		_this.type = 'module';
		_this.updateDoc({version:_version,type:'module'});
		return _.isFunction(cb) ? cb(null,data) : data;
	});

}



manager.prototype.getPackageFromGitHub = function(val,cb) {
	
	var _this = this;
	
	if(!this._gitPackageTries)this._gitPackageTries = 0;
	
	if(_.isFunction(val)) {
		cb = val;
		val = false;
	}
	
	var opts = {
		// optional:
		// headers: {
		//     "cookie": "blahblah"
		// },
		repo: _this.repo,
		user: _this.repouser,
		path: 'package.json'
	}
	
	if(val)opts.ref = val;
	
	this.github.auth();
	
	this.GitHub.repos.getContent(opts, function(err, res) {
		_this.current = {};
		_this.current[val] = {};
		
		if(err) {
			_this._gitPackageTries++;
			console.log('package from github error',err,'Retry? ',_this._gitPackageTries,_this._gitPackageTries < 4);
			if(_this._gitPackageTries < 4) {
				_this.getPackageFromGitHub(val,cb);
			}
			
			return _.isFunction(cb) ? cb(err) : false;
		}
		
		if(res.download_url) {
			request.get(res.download_url, function(res){
				//console.log('request get',res.text,res.body);
				try {
					_this.current[val] = JSON.parse(res.text);
				} catch(e) {
					_this.current[val] = {}
				}
				_this.version = val;
				_this.type = 'branch';
				_this.updateDoc({version:val,type:'branch'});
				//console.log(_this.current[val],res.text)
				return _.isFunction(cb) ? cb(null,_this.current) : _this.current;
			});
		}
		
		
	});
	
}

manager.prototype.getBranches = function(cb) {
	
	var _this = this;
	
	if(!this._branchTries)this._branchTries = 0;
	
	this.github.auth();
	
	this.GitHub.repos.getBranches({
		// optional:
		// headers: {
		//     "cookie": "blahblah"
		// },
		repo: _this.repo,
		user: _this.repouser
	}, function(err, res) {
		//console.log('branches',res);
		if(err) {
			_this.branchTries++;
			_this.branches = [];
			_this.emit('branches',{success:false,err:err.message});
			if(_this.branchTries < 4) {
				_this.getBranches(cb);
			}
			return _.isFunction(cb) ? cb(err) : false;
		}
		_this.branches = res.map(function(v) {
			return v.name;
		});
		_this.emit('branches',{success:true});
		return _.isFunction(cb) ? cb(null,res) : res;
	});
	
}

manager.prototype.build = function(opts) {
	
	var _this = this;
	var _build = {
		options: {}
	};
	var doc = _this.doc.doc;
	
	if(!_.isObject(opts))opts = {}
	
	var path = opts.path;
	var name = opts.name;
	var install = opts.npm;
	var start = opts.start;
	
	process.chdir(_this.__dir);
	
	async.series([
		/* set up directory */
		function(next) {
						
			_this.emit('build',{action:'mkdir',working:'Creating Directory'});
			
			if(!path)path = _this.__dir;
			if(path.charAt(0) !== '/')path =_this.__dir + '/' + path;
			if(!name)name = doc.saneName || doc.name || 'noname';
			name = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
			path += '/' + name;
			
			_this.snowlog.info('Start build for ' + name + ' in ' + path);
			
			mkdirp(path, function(err) { 
				if(err) {
					_this.emit('build',{action:'mkdir',success:false,err:err});
					_this.snowlog.error(err);
					return;
				}
				
				var done = function() {
					_this.emit('build',{action:'mkdir',success:'Directory available for read/write'});
					_this.snowlog.info('Build directory: ' + _build.path);
					next();
				}
				/* check if directory is empty */
				fs.readdir(path, function(err,files) {
					if(err) {
						_this.emit('build',{action:'mkdir',success:false,err:err});
					_this.snowlog.error(err);
					}
					if(files.length) {
						_this.emit('build',{action:'mkdir',success:false,err:'Directory exists and is not empty'});
						_this.snowlog.error('Directory exists and not empty');
						
					} else {
						_build.path = path;
						fs.mkdir(path + '/public',function() {
							_build.public = path + '/public';
						});
						fs.mkdir(path + '/models',function() {
							_build.models = path + '/models';
						});
						fs.mkdir(path + '/routes',function() {
							_build.routes = path + '/routes';
						});
						fs.mkdir(path + '/logs',function() {
							_build.logs = path + '/logs';
						});
						fs.mkdir(path + '/updates',function() {
							_build.updates = path + '/updates';
							fs.createReadStream(_this.__dir + '/updates/0.0.1-admins.js').pipe(fs.createWriteStream(_build.updates + '/0.0.1-admins.js'));
						});
						fs.mkdir(path + '/helpers',function() {
							
							var hFile = _this.config['helper module'].value;
							
							_build.helpers = path + '/helpers';
							/* create the helper file if supplied */
							if(_.isString(hFile)) {
								
								_this.emit('build',{action:'mkdir',working:'Creating helper file from ' + _this.config['helper module'].value});
								
								if(hFile.charAt(0) !== '/')hFile = _this.__dir + '/' + hFile;
								fs.exists(hFile, function (exists) {
									if(exists) {
										fs.createReadStream(hFile).pipe(fs.createWriteStream(_build.helpers + '/helper.js'));
										done();
									}
								});
							} else {
								done();
							}
						});
						
					}
				});
				
			});
			
		},
		/* create package.json */
		function(next) {
			_this.emit('build',{action:'pkg',working:'Creating package.json file'});
			
			_this.snowlog.info('Create package.json');
					
			var pkg = _.cloneDeep(defaultPkg);
			
			pkg.name = name;
			
			// save the final function and run it when ready
			var finalRun = function() {
				
				_.each(_this.modules,function(module) {
					pkg.dependencies[module.module] = module.version;
				});
				
				var file = _build.path + '/package.json';
				
				jf.writeFile(file, pkg, function(err) {
					if(err) {
						_this.emit('build',{action:'pkg',success:false,err:'Could not write package.json'});
						_this.snowlog.error(err);
					} else {
						_build.version = _this.version;
						_build.options.version = _this.version;
						_this.snowlog.info('Created package.json');
						next();
					}
				});
				
			}
			if(_this.type === 'module') {
				
				if(_this.version === 'link') {
					
					// dont add keystone to package file for link
					pkg.dependencies.keystone = '';
					finalRun();
					
				} else {
					
					pkg.dependencies.keystone = _this.version || '';
					finalRun();
				}
			/* use a github branch */	
			} else if(_this.type === 'branch') {
				
				var ver = _this.version ? '#' + _this.version : '';
				pkg.dependencies.keystone = _this.Project.github + ver;
				finalRun();
				
			}
			
		},
		/* copy .env */
		function(next) {
			_this.emit('build',{action:'pkg',working:'Copying .env file'});
			
			_this.snowlog.info('Copy .env');
					
			fs.exists(_this.__dir + '/webkit/pkg/.env', function (exists) {
				if(exists) {
					fs.createReadStream(_this.__dir + '/webkit/pkg/.env').pipe(fs.createWriteStream(_build.path + '/.env'));
					_this.emit('build',{action:'pkg',success:true});
					next();
				} else {
					_this.emit('build',{action:'pkg',success:true});
					next();
				}
			});
			
		},
		/* copy models */
		function(next) {
			_this.emit('build',{action:'models',working:'Copying model definition files...'});
			
			_this.snowlog.info('Add model files');
			
			async.each(_this.models,function(model,cb) {
				fs.exists(model, function (exists) {
					if(exists) {
						//fs.writeFileSync(_build.models + '/' + path.basename(model), fs.readFileSync(model));
						fs.createReadStream(model).pipe(fs.createWriteStream(_build.models + '/' + Path.basename(model)));
						cb();
					} else {
						fs.exists(_this.__dir + '/models/' + model + '.js', function (exists) {
							if(exists) {
								//fs.writeFileSync(_build.models + '/'  + model + '.js', fs.readFileSync(_this.__dir + '/models/' + model + '.js'));
								fs.createReadStream(_this.__dir + '/models/' + model + '.js').pipe(fs.createWriteStream(_build.models + '/'  + model + '.js'));
								cb();
							} else {
								cb();
							}
						});
					}
				});
			}, function(err) {
				_this.emit('build',{action:'models',success:true});
				next();
			});
			
		},
		/* copy routes */
		function(next) {
			_this.emit('build',{action:'routes',working:'Copying route files...'});
			
			async.each(_this.routes,function(route,cb) {
				fs.exists(route, function (exists) {
					if(exists) {
						//fs.writeFileSync(_build.models + '/' + path.basename(model), fs.readFileSync(model));
						fs.createReadStream(route).pipe(fs.createWriteStream(_build.routes + '/' + Path.basename(route)));
						_build.addroute = true;
						cb();
					} else {
						fs.exists(_this.__dir + '/routes/' + route + '.js', function (exists) {
							if(exists) {
								//fs.writeFileSync(_build.models + '/'  + model + '.js', fs.readFileSync(_this.__dir + '/models/' + model + '.js'));
								fs.createReadStream(_this.__dir + '/routes/' + route + '.js').pipe(fs.createWriteStream(_build.routes + '/'  + route + '.js'));
								_build.addroute = true;
								cb();
							} else {
								cb();
							}
						});
					}
				});
			}, function(err) {
				_this.emit('build',{action:'routes',success:true});
				next();
			});
			
		},
		/* keystone.js */
		function(next) {
			
			_this.emit('build',{action:'keystone',working:'Writing keystone.js...'});
			
			_build.config = "{ \r\n";
			_build.set2 = '';
			_build.set1 = '';
			var kk = [];
			
			var cfgClone = _.cloneDeep(_this.config);
			_.each(cfgClone,function(cfg) {
				
				_this.snowlog.info(cfg.type,cfg.key,cfg.value);
				var originalValue = cfg.value;
				
				/* if the option bit is set we use keystone.set */
				if(cfg.option && cfg.type !== 'ignore' &&  cfg.value &&  cfg.value !== '') {
					
					var who = '';
					var pushme = true;
					
					if(cfg.type === 'module') {
						
						if(cfg.value) {
							cfg.value = "helper['" + cfg.value + "']";
							who += "keystone.set('" + cfg.key + "', " + cfg.value + "); \r\n";
						} else {
							pushme = false;
						}
						
					} else if(cfg.type === 'object') {
						
						if(cfg.value) {
							who += "keystone.set('" + cfg.key + "', " + cfg.value + "); \r\n";
						}
						
					} else if(cfg.type === 'string') {
						
						if(cfg.value) {
							cfg.value = "'" + cfg.value + "'";
							who += "keystone.set('" + cfg.key + "', " + cfg.value + "); \r\n";
						}
						
					} else if(cfg.type === 'number') {
						
						if(cfg.value) {
							who += "keystone.set('" + cfg.key + "', " + parseFloat(cfg.value) + "); \r\n";
						}
						
					} else if( (cfg.value === true || cfg.value === 'true') && cfg.type === 'bool') {
						
						cfg.value = true;
						
					} else if( (cfg.value === false || cfg.value === 'false') && cfg.type === 'bool' && always) {
						
						cfg.value = false;
						
					}  else if(cfg.value === 'false' || cfg.value === undefined) {
						
						pushme = false;
						
					}
						
					if(pushme) {
						
						_build.options[cfg.key] = originalValue;
						if(cfg.option === 2) {
							_build.set2 += who;
							
						} else {
							_build.set1 += who;
						}
						
					}
				
				/* apply to init */	
				} else if(cfg.type !== 'ignore') {
					 
					var pushme = true;
					
					if(cfg.type === 'module') {
						
						if(cfg.value) {
							cfg.value = "helper['" + cfg.value + "']";
						} else {
							pushme = false;
						}
						
					} else if(cfg.type === 'object') {
						
						cfg.value = cfg.value ? cfg.value : '';
					
					} else if(cfg.type === 'number') {
						
						cfg.value = cfg.value ? parseFloat(cfg.value) : '';
					
					} else if( (cfg.value === true || cfg.value === 'true') && cfg.type === 'bool') {
						
						cfg.value = true;
					
					} else if( cfg.value === false && cfg.type === 'bool' && cfg.always) {
						
						cfg.value = false;
					
					} else if(cfg.type === 'false' || cfg.value === undefined) {
						
						pushme = false;
					
					} else if(cfg.type === 'string' && !_.isEmpty(cfg.value)) {
						
						cfg.value = '"' + cfg.value + '"';
					
					} else {
						pushme = false
					}
					
					if(pushme) {
						kk.push(cfg);
						_build.options[cfg.key] = originalValue;
					}
				}
			});
			async.each(kk,function(opt,cb) {
				//console.log(opt);
				if(opt.value !== '' && opt.value !== '"undefined"')_build.config += '    "' + opt.key + '": ' +  opt.value + ",\r\n";
				cb();
				
			},function(err) {
				
				_build.config += "}";
				
				fs.readFile(defaultKeystone, 'utf8', function (err,data) {
					if (err) {
						_this.emit('build',{action:'keystone',success:false,err:err});
						_this.snowlog.error('open default error',err);
						return;
					}
					// add our init vars
					var init = data.replace(/##INIT##/g, _build.config);
					
					// add the helper module
					var helper = '';
					if(_this.config['helper module'].value) {
						helper = "var helper = require('./helpers/helper'); \r\n";
					}
					var helperreplace = init.replace(/##HELPER##/g, helper);
					
					// add the routes
					var routes = '';
					if(_build.addroute) {
						routes = "keystone.set('routes', require('./routes')); \r\n";
					}
					var routereplace = helperreplace.replace(/##ROUTES##/g, routes);
					
					// add the set options
					var o1 = routereplace.replace(/##OPTIONS1##/g, _build.set1);
					var keystonejs = o1.replace(/##OPTIONS2##/g, _build.set2);
					
					fs.writeFile(_build.path + '/keystone.js', keystonejs, 'utf8', function (err) {
						if (err) {
							_this.emit('build',{action:'keystone',success:false,err:err});
							return _this.snowlog.error(err);
						}
						_this.emit('build',{action:'keystone',success:true});
						_this.snowlog.info('keystone.js file created');
						_this.updateDoc({build:_build});
						next();
					});
				});
				
				
			});
			
			
		},
		/* gzip */
		function(next) {
			_this.emit('build',{action:'gzip',working:'Creating zipped file for sanity and sharing...'});
			
			var os = require('os');
			if(os.platform().charAt(0).toLowerCase() === 'w') {
				_this.emit('build',{action:'gzip',success:false,err:err});
				return next();
			}
			
			_build.gzipName = doc.saneName + '.' + moment(new Date()).format() +'.zip';
			_build.gzip = Path.join(_this.Project.paths.gzip, _build.gzipName);
			
			var output = fs.createWriteStream(_build.gzip);
			var archive = archiver('zip');
			
			output.on('close', function () {
			
				_this.doc.db.insert({
					name: doc.name,
					docId: doc._id,
					path: _build.path,
					gzip: _build.gzip,
					createdOn: new Date()
				});
				_this.emit('build',{action:'gzip',success:'Archived ' + archive.pointer()*.001 + ' kb <br /> <span class="glyphicon glyphicon-minus"></span> ' + _build.gzipName });
				next();
			});

			archive.on('error', function(err){
				_this.emit('build',{action:'gzip',success:false,err:err});
				next();
			});

			archive.pipe(output);
			archive.bulk([
				{ expand: true, cwd: _build.path, src: ['**'] }
			]);
			archive.finalize();
			
		},
		/* npm install */
		function(next) {
			_this.emit('build',{action:'npm',working:'Running npm install...'});
			
			if(_this.version === 'link') {
					_this.emit('build',{action:'npm',working:'Running npm link ' + _this.Project.npm});					
					try {
						process.chdir(_build.path);
						var nLink = spawn('npm', ['link','keystone'],{cwd:_build.path});

						nLink.stdout.on('data', function(chunk) {
							_this.emit('build',{action:'npm',working:chunk.toString()});
							_this.snowlog.info(chunk.toString());
						});
						nLink.stderr.on('data', function (data) {
							 _this.emit('build',{action:'npm',working:data.toString()});
							 _this.snowlog.info(data.toString());
						});

						nLink.on('close', function (code) {
							
						});
						
					}
					catch (err) {
						_this.emit('build',{action:'npm',success:false,err:err});
						_this.snowlog.error(err);
					}
					
			}
					
			if(opts.npm) {
				_this.snowlog.info('run npm install');
				try {
					process.chdir(_build.path);
					var child = spawn('npm', ['install']);

					child.stdout.on('data', function(chunk) {
						_this.emit('build',{action:'npm',working:chunk.toString()});
						_this.snowlog.info(chunk.toString());
					});
					child.stderr.on('data', function (data) {
						 _this.emit('build',{action:'npm',working:data.toString()});
						 _this.snowlog.info(data.toString());
					});

					child.on('close', function (code) {
						_this.emit('build',{action:'npm',success:true});
						//Add npm true to doc
						_build.npm = true;
						_this.updateDoc({build:_build});
						next();
					});
					
					_this.doc.npm = child;
					
				}
				catch (err) {
					_this.emit('build',{action:'npm',success:false,err:err});
					_this.snowlog.error(err);
					return next();
				}
				
			} else {
				_this.emit('build',{action:'npm',success:false,err:'Skipping npm install'});
				_this.snowlog.info('Skip npm install');
				next();	
			}
		},
		/* start project */
		function(next) {
			_this.emit('build',{action:'start',working:'Running node keystone...'});
			
			if(opts.start) {
				_this.snowlog.info('Run node keystone');
				var error = false;
				try {
					process.chdir(_build.path);
					var child = new (forever.Monitor)('keystone.js', {
						max: 3,
						silent: true,
						'pidFile': Path.join(_this.Project.paths.pid,doc.saneName + '.pid'),
						'logFile': Path.join(_build.logs,doc.saneName + '.log'), // Path to log output from forever process (when daemonized)
						'outFile': Path.join(_build.logs,doc.saneName + '.log'), // Path to log output from child stdout
						'errFile': Path.join(_build.logs,doc.saneName + '.log'), // Path to log output from child stderr
					});

					child.on('exit', function () {
						delete _this._nodes[doc._id];
						// remove the current pid from the doc
						_this.updateDocById(doc._id,{pid:false,status:'stopped'});
						setTimeout(_this.App.forceUpdate,1000);
					});
					child.on('stdout', function(data) {
						
						// emit to a general node room
						_this.emit('node',{server:doc._id,log:data.toString().replace('\n','<br />')});
						_this.snowlog.info('node',data.toString());
						
					});
					child.on('stderr', function(data) {
						
						// emit to a general node room
						_this.emit('node',{server:doc._id,log:data.toString().replace('\n','<br />')});
						_this.snowlog.info('node',data.toString());
						
					});
					child.on('start', function(process,data) {
						next();
						// add the current pid to the build
						_build.pid = child.child.pid;
						_this.updateDoc({pid:child.child.pid,status:'running',build:_build});
						// send success
						_this.emit('build',{action:'start',success:true});
						setTimeout(function() {
							_this.emit('node',{server:doc._id,log:'Server Starting'});
						},500);
										
					});

					child.start();
					
					/* save the instance to stop later */
					_this._nodes[doc._id] = {
						process: child,
						name: doc.name,
						doc: doc,
						id: doc._id,
						pid: child.child.pid,
						status: 'running'
					}
					_this._nodes[doc._id].methods = {
						addListener: function(callback) {
							_this.on('node', callback);
						},
						removeListener: function(callback) {
							_this.removeListener('node', callback);
						},
						endNode: function(callback) { 
							if(!_.isFunction(callback))callback = function() {};
							if(_this._nodes[doc._id] && _this._nodes[doc._id].process)_this._nodes[doc._id].process.stop();
							
							_this.emit('node',{server:doc._id,log:'Server stopping'});
							_this.updateDocById(doc._id,{status:'stale'},callback);
							
						},	
					}
			
				}
				catch (err) {
					_this.emit('build',{action:'start',success:false,err:err + ' ' + _build.path});
					_this.snowlog.err(err);
					return next();
				}
				
			} else {
				_this.emit('build',{action:'start',success:false,err:'Skipping node keystone'});
				_this.snowlog.info('skip node keystone');
				next();	
			}
			
		}
	],function(err) {
		_this.emit('build',{action:'done',success:true});
	});
	
}

manager.prototype.startNode = function(id,cb) {
	
	var _this = this;
	if(_.isFunction(id)) {
		cb = id;
		id = false;
	}
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	var start = function(doc) {
		
		_this.snowlog.info('Run node keystone');
					
		var error = false;
		
		var _build = doc.build;

		try {
			process.chdir(_build.path);
			var child = new (forever.Monitor)('keystone.js', {
				max: 3,
				silent: true,
				'pidFile': Path.join(_this.Project.paths.pid,doc.saneName + '.pid'),
				'logFile': Path.join(_build.logs,doc.saneName + '.log'), // Path to log output from forever process (when daemonized)
				'outFile': Path.join(_build.logs,doc.saneName + '.log'), // Path to log output from child stdout
				'errFile': Path.join(_build.logs,doc.saneName + '.log'), // Path to log output from child stderr
			});

			child.on('exit', function () {
				delete _this._nodes[doc._id];
				// remove the current pid from the doc
				_this.updateDocById(doc._id,{pid:false,status:'stopped'});
				setTimeout(_this.App.forceUpdate,1000);
			});
			child.on('stdout', function(data) {
				
				// emit to a general node room
				_this.emit('node',{server:doc._id,log:data.toString()});
				_this.snowlog.info('node',data.toString());
				
			});
			child.on('stderr', function(data) {
				
				// emit to a general node room
				_this.emit('node',{server:doc._id,log:data.toString()});
				_this.snowlog.info('node',data.toString());
				
			});
			child.on('start', function(process,data) {
				cb();
				// add the current pid to the build
				_build.pid = child.child.pid;
				_this.updateDocById(doc._id,{pid:child.child.pid,status:'running',build:_build});
				// send success
				setTimeout(function() {
					_this.emit('node',{server:doc._id,log:'Server Starting'});
				},500);
								
			});

			child.start();
			
			/* save the instance to stop later */
			_this._nodes[doc._id] = {
				process: child,
				name: doc.name,
				doc: doc,
				id: doc._id,
				pid: child.child.pid,
				status: 'running'
			}
			_this._nodes[doc._id].methods = {
				addListener: function(callback) {
					_this.on('node', callback);
				},
				removeListener: function(callback) {
					_this.removeListener('node', callback);
				},
				endNode: function(callback) { 
					if(!_.isFunction(callback))callback = function() {};
					if(_this._nodes[doc._id] && _this._nodes[doc._id].process)_this._nodes[doc._id].process.stop();
					_this.updateDocById(doc._id,{status:'stale'},callback);
					_this.emit('node',{server:doc._id,log:'Server stopping'});
				},	
			}
			
		}
		catch (err) {
			_this.emit('node',{server:doc._id,log:err + ' ' + _build.path});
			_this.snowlog.error(err);
			cb();
			return;
		}
	}
	
	if(id) {
		_this.getDocById(id,function(err,doc) {
			start(doc);
		});
	} else {
		start(_this.doc.doc);
	}
}

/* remove the build directory */
manager.prototype.removeNodeBuildDir = function(id,cb) {
	
	var _this = this;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	if(!id) {
		return cb('An ID is required');
	}
	
	this.getDocById(id,function(err,doc) {
		if(err || !doc) {
			return cb('No doc found');
		}
		if(doc.build && doc.build.path) {
			fs.exists(doc.build.path,function(exists) {
				if(exists) {
					rmdir(doc.build.path, function(err) {
						_this.updateDocById(id,{build:{}},function() {
							cb(null,true);
						});
					});
				} else {
					_this.updateDocById(id,{build:{}},function() {
						cb('Directory missing and removed from doc',true);
					});
					
				}
			});
		} else {
			_this.updateDocById(id,{build:{}},function() {
				cb('No build path available');
			});
			
			
		}
		
	});
	
}
manager.prototype.grabLog = function(node,cb) {
	
	var _this = this;
	
	if(!_.isFunction(cb)) {
		cb = function(){};
	}
	if(!node) {
		return cb('An ID is required');
	}
	
	this.getDocById(node,function(err,doc) {
		if(err || !doc) {
			return cb('No doc found');
		}
		if(doc.build && doc.build.path) {
			fs.readFile(Path.join(doc.build.logs,doc.saneName + '.log'), {encoding:'utf8'},function (err, data) {
				if (err || !data) cb('Could not load log file at ' + Path.join(doc.build.logs,doc.saneName + '.log'));
				try {
					var dd = data.toString().split('\n');
				} catch(e) {
					var dd = []
				}
				cb(null,dd);
			});
		} 
		
	});
	
}

manager.prototype.takeSnapshot = function() {
	var win = NWJS.Window.get();
	var p = prompt('Name this capture',new Date().getTime());
	if(p) {
		win.capturePage(function(img) {
			var base64Data = img.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
			require("fs").writeFile(p+".png", base64Data, 'base64', function(err) {
				console.log(err);
			});
		}, 'png');
	}
}


var Manager =  new manager();
