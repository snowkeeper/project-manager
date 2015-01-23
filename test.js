var npmi = require('npmi');
var npm = require('npm');
var path = require('path');

var winston = require('winston');
	var logname = new Date().getTime() +'.log';
	var snowlog = new (winston.Logger)({
		transports: [
			//new (winston.transports.Console)(),
			new (winston.transports.File)({ filename: path.join('/home/snow/.config/project-manager/testbed/ralph',logname) })
		]
	});

process.chdir('/home/snow/.config/project-manager/testbed/ralph');
/*
 * var options = {
		
	path: '.',              // installation path [default: '.']
	version: '1.6.0',
	forceInstall: true,    // force install if set to true (even if already installed, it will do a reinstall) [default: false]
	npmLoad: {              // npm.load(options, callback): this is the "      options" given to npm.load()
		loglevel: 'info'  // [default: {loglevel: 'silent'}]
	},
	//localInstall: true,
};

npmi(options, function (err, result) {
	if (err) {
		if      (err.code === npmi.LOAD_ERR)    console.log('npm load error');
		else if (err.code === npmi.INSTALL_ERR) console.log('npm install error');
		return console.log(err.message);
	}
	
	// installed
	//_this.emit('build',{action:'npm',working:chunk.toString()});
	console.log(options.name+'@'+options.version+' installed successfully in '+path.resolve(options.path));
});
*/
npm.load({
	loglevel: 'info'
	loaded:false
}, function (err) {
  // catch errors
	  if(err)_this.log(err)
	  npm.commands.install('.',[], function (er, data) {
			snowlog.info('running npm install',er,data);
			//if(data) next();
	  });
	  npm.on("log", function (message) {
			// log the progress of the installation
			snowlog.info('log',chunk.toString());
	  });
});
