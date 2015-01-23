
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Route = Router.Route,
	DefaultRoute = Router.DefaultRoute, 
	NotFoundRoute = Router.NotFoundRoute,
	RouteHandler =Router.RouteHandler ,
	Link = Router.Link;
	
var Nodes = require('../components/nodes');

var BuildState = require('../components/buildstate');

var Build;
module.exports = Build = React.createClass({
	getInitialState: function() {
				
		return {
			mkdir: false,
			mkdirError: false,	
			pkg: false,
			pkgError: false,
			models: false,
			modelsError: false,
			routes: false,
			routesError: false,
			keystone: false,
			keystoneError: false,	
			npm: false,
			npmError: false,
			gzip: false,
			gzipError: false,
			start: false,
			startError: false,
			done: false,
			doneError: false	
		}			
	},
	_watchBuild: function(s) {
		var _this = this;
			if(s.working) {
				var send = {};
				send.building = true;
				var before = _this.state[s.action + 'Working'] ? _this.state[s.action + 'Working'] : '';
				send[s.action + 'Working'] = before  + s.working + '<br />';
				_this.setState(send);
			} else if(s.success) {
				var send = {};
				send.building = true;
				send[s.action] = _this.state[s.action + 'Working'] || s.success;
				send[s.action + 'Working'] = false;
				if(s.action === 'done') {
					send.building = false;
					send.built = true;
					Manager.App.showNodes();
					//Manager.removeListener('build',_this._watchBuild);
				}
				_this.setState(send);
			} else if(s.err) {
				var send = {};
				send.built = true;
				send.building = false;
				send[s.action + 'Error'] = s.err;
				send[s.action + 'Working'] = false;
				if(s.action === 'mkdir') {
					send[s.action + 'Error'] = s.err;
				}
				_this.setState(send);
			} 
		
	},
	componentDidMount: function() {
		var _this = this;
		Manager.on('build',this._watchBuild);
	},
	// Remove build listeners
	componentWillUnmount: function() {
		Manager.removeListener('build',this._watchBuild);
	},
	build: function(e) {
		
		e.preventDefault();
		
		this.setState({building:true});
		
		Manager.build({
			path: this.refs.path.getDOMNode().value,
			name: this.refs.name.getDOMNode().value,
			npm: this.refs.npm.getDOMNode().checked,
			start: this.refs.start.getDOMNode().checked
		});
		
	},
	stopBuilding: function(e) {
		
		e.preventDefault();
		this.setState({
			mkdir: false,
			mkdirError: false,	
			pkg: false,
			pkgError: false,
			models: false,
			modelsError: false,
			routes: false,
			routesError: false,
			keystone: false,
			keystoneError: false,	
			npm: false,
			npmError: false,
			gzip: false,
			gzipError: false,
			start: false,
			startError: false,
			done: false,
			doneError: false,
			building:false,
			built: false
		});
		
	},
	removeNodeDir: function(e) {
		var _this = this;
		e.preventDefault();
		var id = Manager.doc.id;
		if(confirm('Really Remove Build Directory?')) {
			Manager.removeNodeBuildDir(id,function(err,success) {
				Manager.log(err,success);
				if(err)Manager.log(err);
				if(success) {
					Manager.log('force update after directory removed');
					_this.getDocs();
					//_this.setState({loading:true});
					//_this.forceUpdate();
				}
			});
		}
			
	},
	render: function() {
		
		var _this = this;
		
		// list any ongoing build
		var buildProcess;
		if(this.state.building || this.state.built) {
			var buildProcess = (
				<div>
					
					<BuildState success={this.state.mkdir} error={this.state.mkdirError} working={this.state.mkdirWorking} >Create Directory</BuildState>
					<BuildState success={this.state.pkg} error={this.state.pkgError} working={this.state.pkgWorking} >Create package.json</BuildState>
					<BuildState success={this.state.models} error={this.state.modelsError}  working={this.state.modelsWorking} >Add Model Files</BuildState>
					<BuildState success={this.state.routes} error={this.state.routesError}  working={this.state.routesWorking} >Add Route Files</BuildState>
					<BuildState success={this.state.keystone} error={this.state.keystoneError}  working={this.state.keystoneWorking} >Create Keystone Start File</BuildState>
					<BuildState success={this.state.gzip} error={this.state.gzipError}  working={this.state.gzipWorking} >Create gzip file</BuildState>
					<BuildState success={this.state.npm} error={this.state.npmError}  working={this.state.npmWorking} >Run npm install</BuildState>
					<BuildState success={this.state.start} error={this.state.startError}  working={this.state.startWorking} >Run node keystone</BuildState>
					<BuildState success={this.state.done} error={this.state.doneError}  working={this.state.doneWorking} >Finished</BuildState>
					
					<p>
						<br />
						<a href="#" onClick={this.stopBuilding} >Build Again</a>
					</p>	
				</div>			
			);
			var buildDiv = "col-xs-12";
			var activeDiv = "hidden";
		}
		
		var database = Manager.config.mongo.value ? (<span>Collection: {Manager.config.mongo.value} </span>) : (<span>Your mongo collection will be a sanitized form of <b>{Manager.config.name.value}</b></span>);
		var ret = (
			<div>
				<p />
				<div  className="">
					<div className="clearfix" />
				</div>
				<p />
				<div className="clearfix" />
				
				<div className="form-group">
					<label htmlFor="path" >Path to Build Directory</label>
					<input type="text" className=" form-control" id="path" ref="path" defaultValue="testbed" placeholder={Manager.__dir} />
						
				</div>
				<div className="form-group">
					<label htmlFor="path" >Name of Project Directory is always the build name ({Manager.doc.doc.saneName})</label>
					<input type="text" readOnly className=" form-control" id="name" ref="name"  value={Manager.doc.doc.saneName} />
						
				</div>
				<div className="form-inline" >
					<div className="checkbox">
						<label>
							<input type="checkbox" value="install" id="npm" ref="npm" defaultChecked /> Run <kbd>npm install</kbd>
						</label>
					</div>
				</div>
				<div className="form-inline" >
					<div className="checkbox">
						<label>
							<input type="checkbox" value="start" id="start" ref="start" defaultChecked /> Run <kbd>node keystone</kbd>
						</label>
					</div>
				</div>
				<p >
					<br />
					{database}
				</p>
				<div className="clearfix" />
				<div className="form-group">
					<div >
						<button type="button" className="btn btn-default" onClick={this.build} disabled={this.state.building} >Build Configuration</button>
					</div>
				</div>
				
				
			</div>
		);
		if(this.state.building || this.state.built) {
			return (
				<div>
					<div className={buildDiv}>
						{buildProcess}
						<div style={{position:'relative',height:50}} />
					</div>
				</div>
			);
		
		} else {
			return ret;
		}
	}
});
