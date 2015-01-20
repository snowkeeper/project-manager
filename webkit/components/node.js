
var moment = require('moment');
var React =  require('react/addons');
var Router = require('react-router'); 

var Node;
module.exports = Node = React.createClass({
	
	mixins: [React.PureRenderMixin],
	
	getInitialState: function() {
		return {
			message: [],
			cfg: false
		}
	},
	getDefaultProps: function() {
		return {
			node: {}
		}
	},
	_addListeners: function(log) {
		if(log.server === this.props.node.id) {
			this.state.message.reverse();
			this.state.message.push(log.log);
			this.state.message.reverse();
			this.setState({
				message: this.state.message
			});	
		}
	},
	// add log on start
	componentWillMount: function() {
		this.viewLog();
	},
	// add running server listners
	componentDidMount: function() {
		this.props.node.methods.addListener(this._addListeners);
	},
	// Remove running server listners
	componentWillUnmount: function() {
		this.props.node.methods.removeListener(this._addListeners);
	},
	endNode: function(e) {
		e.preventDefault();
		var _this = this;	
		//console.log('nodes force update pre');	
		this.props.node.methods.endNode(function() {
			//console.log('nodes force update');
			_this.props.node.methods.removeListener(_this._addListeners);
			Manager.App.forceUpdate();
		});
	},
	startNode: function(e) {
		var _this = this;
		e.preventDefault();
		var id = e.target.dataset.id;
		Manager.startNode(id,function() {
			//console.log('transition to Nodes');
			_this.transitionTo('Nodes');
		});
		
	},
	viewLog: function(e) {
		if(e)e.preventDefault();
		var _this = this;
		var id = this.props.node.id;
		Manager.grabLog(id,function(err,data) {
			//if(err)console.log(err);
			if(data) {
				_this.setState({
					message : data.reverse(),
					cfg: false
				});
			}
		});
	},
	viewConfig: function(e) {
		e.preventDefault();
		var _this = this;
		
		_this.setState({
			cfg : !this.state.cfg
		});
			
	},
	render: function() {
		var node = this.props.node;
		var clas = node.status === 'running' ? "bg-primary" : "bg-warning";
		var actions = node.status === 'running' || node.status === 'stale' ? <a href="#" data-id={node.id} onClick={this.endNode} >Stop</a> : <a href="#" data-id={node.id} onClick={this.startNode} >Start</a>
		
		var build = _.isObject(node.doc.build) && _.isObject(node.doc.build.options) ? node.doc.build.options : false;
		var host = build ? "http://" + build.host + ':' + build.port : 'n/a';
		var n = 0;
		if(this.state.cfg && build) {
			var opts = [];
			_.each(build,function(v,k) {
				n++;
				opts.push(
					<tr key={n} ><td>{k}</td><td>{v === true ? 'true' : v === false ? 'false' : v}</td></tr>
				);
			});	
			var message = (
				<table className="table table-hover">
					<thead>
						<th>Key</th>
						<th>Value</th>
					</thead>
					<tbody>
						{opts}
					</tbody>
				</table>
			);
			
		} else {
			var message = this.state.message.map(function(v) {
				n++;
				return (
					<div key={n} dangerouslySetInnerHTML={{__html: v.replace("\n",'<br />')}} />
				);
			});			
		}
		return (
			<div id={'running' + node.id}>
					<div className={clas} style={{padding:5}}>{node.name} - {host}</div>
					<div className="pull-left" style={{padding:5}}>pid: {node.pid || 'n/a'} </div>
					<div className="pull-left" style={{padding:5,marginLeft:20}}> {actions} | <a href="#" data-id={node.id}  onClick={this.viewLog} >Full Log</a> | <a href="#" data-id={node.id}  onClick={this.viewConfig} >Config</a></div>
					<div className="clearfix" />
					<div className="logger" style={{}}>
						{message}
					</div>
			</div>	
		);		
	}
	
});
