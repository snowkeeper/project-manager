
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Link = Router.Link;

var Version;
module.exports = Version = React.createClass({
	getInitialState: function() {
		var currentKey = _.keys(Manager.current)[0];
		var current = _.clone(Manager.current[currentKey]);
		
		try {
			delete current.versions;
			delete current.time;
			var pkg = JSON.stringify(current, null, 4);
		} catch(e) {
			var pkg = 'Error retrieving package.json ';
		}
		
		return {
			pkg:pkg,
			change: false
		}
	},
	versions: function() {
		//console.log('versions',Manager.current);
		if(!_.isArray(Manager.versions))return [];
		var versions = Manager.versions.sort().reverse();
		return npmVersions = versions.map(function(v) {
			return (<option key={v} value={v} >{v}</option>);
		});
	},
	branches: function() {
		//console.log('versions',Manager.current);
		if(!_.isArray(Manager.branches))return [];
		return Manager.branches.map(function(v) {
			return (<option key={v} value={v} >{v}</option>);
		});
	},	
	
	getVersion: function(event) {
		
		var _this = this;
		
		var val = event.target.value;
		
		this.refs.typen.getDOMNode().checked = true;
		
		_this.setState({change:true,pkg:JSON.stringify({loading:true}, null, 4)});
		
		Manager.getView(val,function(err,data) {
				
				var currentKey = _.keys(data)[0];
				var current = _.clone(data[currentKey]);
				
				try {
					delete current.versions;
					delete current.time;
					var pkg = JSON.stringify(current, null, 4);
				} catch(e) {
					var pkg = 'Error retrieving package.json ';
				}
				_this.setState({change:false,pkg:pkg});
		});
		
	},
	getPackage: function(event) {
		
		var _this = this;
		
		var val = event.target.value;
		
		this.refs.typeb.getDOMNode().checked = true;
		
		_this.setState({change:true,pkg:JSON.stringify({loading:true}, null, 4)});
		
		Manager.getPackageFromGitHub(val,function(err,data) {
				if(err || !data) {
					_this.setState({change:false,pkg:'Error retrieving package.json '});
					return false;
				}
				var currentKey = _.keys(data)[0];
				var current = _.clone(data[currentKey]);
				
				try {
					delete current.versions;
					delete current.time;
					var pkg = JSON.stringify(current, null, 4);
				} catch(e) {
					var pkg = 'Error retrieving package.json ';
				}
				_this.setState({change:false,pkg:pkg});
		});
		
	},
	changeType: function(e) {
		var val = e.target.value;
		Manager.type = val;
		//console.log(aa)
		if(val == 'module') {
			this.getVersion({target:this.refs.npm.getDOMNode()});
		} else {
			this.getPackage({target:this.refs.git.getDOMNode()});
		}
	},
	render: function() {
		var versions = this.versions();
		var branches = this.branches();
		
		return (
			<div>
				<div  className="">
					
					<p />
					<div className="clearfix" />
				</div>
				<p />
				<p />
				<div className="clearfix" />
				<p />
				<div className="keystone-lists form-inline">
					
					<div  className="form-group">
						<label className="checkbox-inline">
							<input type="radio" onChange={this.changeType} name="type" ref="typen" value="module" defaultChecked={Manager.doc.doc.type === 'module'} /> Npm Version
						</label>
						 &nbsp;
						<select  ref="npm" id="npm" name="npm" onChange={this.getVersion} className="form-control" defaultValue={Manager.version}>
							<option value=''>latest</option>
							<option value="link" >linked</option>
							{versions}
						</select>
					</div>
				</div>
				<p />
				<div className="keystone-lists form-inline">
				
					<div  className ="form-group">
						<label className="checkbox-inline">
							<input type="radio"  onChange={this.changeType} name="type" ref="typeb"  value="branch" defaultChecked={Manager.doc.doc.type === 'branch'}  /> Github Branch
						</label>
						 &nbsp;
						<select ref="git" id="git" name="git" onChange={this.getPackage}  className="form-control" defaultValue={Manager.version || _.keys(Manager.current)[0]}>
							<option value=''>default</option>
							{branches}
						</select>
					</div>
				</div>
				<p />
				<div>
					<pre>
						{this.state.pkg}
					</pre>
				
				</div>
			</div>
		);
	}
});
