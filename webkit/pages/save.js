
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Link = Router.Link;

var Save;
module.exports = Save = React.createClass({
	
	saveValue: function(e) {
		var _this = this;
		var name = this.refs.name.getDOMNode().value;
		console.log('save config',name);
		if(!name)return;
		Manager.updateDoc({name:name,temp:false},function(){
			_this.forceUpdate();	
		});
		
	},
	render: function() {
		
		if(Manager.doc.doc.temp) {
			var name = '';
			var saveText = 'Save Configuration';
		} else {
			var name = Manager.doc.doc.name;
			var saveText = 'Update Configuration';
		}
		var cfg = []
		_.each(Manager.config,function(cf) {
			cfg.push(<tr key={cf.key}><td>{cf.key}</td><td>{cf.value === true ? 'true' : cf.value === false ? 'false' : cf.value}</td></tr>);
		});
		return (
			<div className="form-horizontal">
				<p />
				<div className="">
						Current Build: &nbsp; <b>{Manager.doc.doc.name}</b>
					</div>
				<div className="clearfix" />
				<p />
				<div className="form-group">
					<label htmlFor="path" className="col-sm-3 control-label">_id</label>
						<div className="col-sm-9">
							<p className="form-control-static">{Manager.doc.id}</p>
						</div>
				</div>
				<div className="form-group">
					<label htmlFor="name" className="col-sm-3 control-label">Name</label>
						<div className="col-sm-9">
							<input type="text" className=" form-control" id="name" ref="name" defaultValue={name} />
						</div>
				</div>
				<div className="form-group">
					<div className="col-sm-offset-3 col-sm-9">
						<button type="button" className="btn btn-default" onClick={this.saveValue} >{saveText}</button>
					</div>
				</div>
				<br />
				<div>
				<table className="table table-hover">
					<thead>
						<th>Key</th>
						<th>Value</th>
					</thead>
					<tbody>
						{cfg}
					</tbody>
				</table>
				</div>
			</div>
		);
	}
});

