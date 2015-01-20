
var moment = require('moment');
var hat = require('hat');

var React =  require('react');
var Router = require('react-router'); 
var Link = Router.Link;

var Modules;
module.exports = Modules = React.createClass({
	
	saveValue: function(e) {
		var module = this.refs.module.getDOMNode().value;
		var version = this.refs.version.getDOMNode().value;
		//console.log('save value',module,version);
		Manager.modules.push({module:module,version:version});
		Manager.updateDoc({modules:Manager.modules});
		this.forceUpdate();
	},
	deleteItem: function(e) {
		e.preventDefault();
		if(confirm('Really Delete?')) {
			var el = $(e.target).closest('a');
			var newModules = [];
			_.each(Manager.modules,function(v) {
				if(v.module !== el[0].dataset.module && v.version !== el[0].dataset.version) {
					newModules.push(v);
				}				
			},this);
			Manager.modules = newModules;
			Manager.updateDoc({modules:Manager.modules});
			this.forceUpdate();
		}
	},
	render: function() {
		var _this = this;
		var modules = Manager.modules.map(function(v){
			return (<div key={hat()}>
				<div className="col-xs-1"><a onClick={_this.deleteItem} href="#" data-module={v.module} data-version={v.version}><span className="glyphicon glyphicon-trash" /></a></div>
				<div className="col-xs-11"><b>{v.module}@{v.version}</b></div>
			</div>);
		});
		return (
			<div>
				<p />
				<div  className="">
					<p />
					<div className="">
						Current Build: &nbsp; <b>{Manager.doc.doc.name}</b>
					</div>
					<p />
					<div className="clearfix" />
				</div>
				<p >
					<br />
					Modules will be added to the package.json file as entered here.
				</p>
				<div className="clearfix" />
				<p />
				<div className="form-group">
					<label htmlFor="module" >Name of Module</label>
					<input type="text" className=" form-control" id="module" ref="module"  />
				
				</div>
				<div className="form-group">
					<label htmlFor="version" >Version</label>
					<input type="text" className=" form-control" id="version" ref="version"  />
						
				</div>
				<div className="form-group">
					<div className="">
						<button type="button" className="btn btn-default" onClick={this.saveValue} >Add Module</button>
					</div>
				</div>
				<div className="form-group">
					<div className="">
						<h4>Included Modules</h4>
						{modules}
					</div>
				</div>
			</div>
		);
	}
});
