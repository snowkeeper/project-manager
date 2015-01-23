
var React =  require('react');
 

var SlideMenu;
module.exports = SlideMenu = React.createClass({
	
    getInitialState: function () {
		return {
			norender: this.props.norender,
			loading:true,
			temp: false
		}
		
	},
	getDefaultProps: function () {
		return {
			norender: false,
			position: 'center',
		}
		
	},
	componentWillReceiveProps: function(p) {
		if(p.norender) {
			this.setState({norender:p.norender});
		}
	},
	getDocs: function(cb) {
		if(!_.isFunction(cb))cb = function() {};
		
		var _this = this;
			
		Manager.db.config
		.find({})
		.sort({ today: -1 })
		.exec(function(err,docs) {
			if(_this.isMounted()) {
				_this.setState({
					docs:docs,
					loading:false
				},cb);
			}
		});
	},
	componentWillMount: function() {
		this.forceUpdate();
	},
	componentWillUpdate: function() {
		this.getDocs();
	},
	componentDidUpdate: function() {
		Manager.App.closeMenuOnClick();
	},
	shouldComponentUpdate: function() {
		return !this.props.norender;
	},
	closeMenu: function(e) {
		e.preventDefault();
		Manager.App.closeMenu();
	},
	endNode: function(e) {
		e.preventDefault();
		Manager.App.stopNode(e.target.dataset.id || e.target.parentElement.dataset.id);
	},
	startNode: function(e) {
		var _this = this;
		e.preventDefault();
		var id = e.target.dataset.id  || e.target.parentElement.dataset.id;
		Manager.startNode(id,function() {
			//Manager.log('transition to Nodes');
			//_this.transitionTo('Nodes');
			Manager.App.showNodes();
		});
		
	},
	removeNodeDir: function(e) {
		var _this = this;
		e.preventDefault();
		var id = e.target.dataset.id || e.target.parentElement.dataset.id;
		Manager.App.removeNodeBuildDir(id,function(){
			_this.getDocs();
		});	
	},
	goto: function(e) {
		e.preventDefault();
		var id = e.target.dataset.id || e.target.parentElement.dataset.id;
		Manager.switchDoc(id,function() {
			Manager.App.closeMenu();
			Manager.App.forceUpdate();
		});
		
	},
	changeView: function(e) {
		e.preventDefault();
		var temp = e.target.dataset.view || e.target.parentElement.dataset.view
		temp = temp == 'temp' ? true : false;
		this.setState({temp:temp});
	},
    render: function () {
		var _this = this;
			var head = (
				<div>
				<nav className="navbar navbar-default">
				  <div className="container-fluid">
					 <div className="navbar-header">
						<a href="#" onClick={this.closeMenu} ><span className="navbar-brand glyphicon glyphicon-chevron-left" /></a>
					</div>

					<div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
					  <ul className="nav navbar-nav">
						<li className={this.state.temp ? '' : ' active'}><a href="#" onClick={this.changeView} data-view="saved">Saved <span className="sr-only">(current)</span></a></li>
						<li className={this.state.temp ? 'active' : ' '}><a href="#" onClick={this.changeView} data-view="temp">Temp</a></li>
					  </ul>
					</div>
					
				  </div>
				</nav>
				</div>
			);
		var temp = [];
		var saved = [];
		
		if(this.state.loading) {
			saved.push(<tr key="load"><td colSpan="5">Loading...</td></tr>);
		} else {
			_.each(this.state.docs,function(v) {
				var build = _.isObject(v.build) && _.isObject(v.build.options) ? v.build.options : false;
				var host = (build && Manager._nodes[v._id]) ? <a href={"http://" + build.host + ":" + build.port + '/keystone'} onClick={Manager.App.openWindow} data-window={build.port} >{build.port}</a> : build ? <span>{build.port}</span> : <span></span>;
				var start = Manager._nodes[v._id] && Manager._nodes[v._id].id ? <a href="#" onClick={_this.endNode} data-id={v._id} ><span className="glyphicon glyphicon-stop text-success"  data-toggle="tooltip" data-placement="bottom" title="Stop the node" /></a> : (v.build && v.build.path) ? <a href="#" onClick={_this.startNode} data-id={v._id} ><span className="glyphicon glyphicon-play-circle text-warning"  data-toggle="tooltip" data-placement="bottom" title="Start the node" /></a> : v.temp ? <span /> : <a href={"#/Load/" + v._id + "/Build"} onClick={Manager.App.closeMenu} ><span className="glyphicon glyphicon-wrench"  data-toggle="tooltip" data-placement="bottom" title="Build this configuration" /></a>;
				var removeDir;
				var finish = function() {
					var ret = (
						<tr key={v._id} className="tableRow hover active">
							
							<td >
								{removeDir} &nbsp;{start}
							</td>
							<td >
								<span  data-toggle="tooltip" data-placement="bottom" title={"switch to " + v.name}><a onClick={_this.goto} href="#" data-id={v._id} >{v.name}</a></span>
							</td>
							<td >
								{v.build && v.build.options ? v.build.options.version : v.version} 
							</td>
							
							<td >
								{host} 
							</td>
						</tr>
					);
					if(v.temp) {
						temp.push(ret);
					} else {
						
						saved.push(ret);
					}
				}
				
				if(v.build && v.build.path) {
					removeDir = (<a href="#" onClick={_this.removeNodeDir} data-id={v._id} ><span className="glyphicon glyphicon-remove-circle text-muted"  data-toggle="tooltip" data-placement="bottom" title="Remove build directory" /></a>);
					finish();
				} else {
					finish();
				}
				
			},this);
		}
		var results = this.state.temp ? temp : saved;
        return (
            <div className={"menuslide " + this.props.position}>
				{head}
				<table className="table table-hover">
					<tbody>
						{results}
					</tbody>
				</table>
            </div>
        );
    }
});
