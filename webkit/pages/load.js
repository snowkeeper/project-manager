
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Link = Router.Link;

var Load;
module.exports = Load = React.createClass({
	
	mixins: [ Router.Navigation, Router.State ],
	
	getInitialState: function() {
		return { 
			loading: true,
			isModalOpen: false,
			modal: {},
			unload: false 
		}
	},
	componentWillMount: function() {
		//Manager.log('mount');
		this.forceUpdate();
	},
	componentDidMount: function() {
		
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
	componentWillUpdate: function() {
		//Manager.log('update');
		var _this = this;
		
		var load = this.getParams().load;
		var unload = this.getParams().unload;
		var to = this.getParams().to;
		var newbuild = this.getParams().newbuild;
		
		//Manager.log(unload,load,to,newbuild);
		
		if(unload !== undefined) {
			//Manager.log(unload,'unload');
			var remove = function() {
				Manager.db.config.remove({ _id: unload }, {}, function (err, numRemoved) {
					_this.getDocs(function() { _this.transitionTo('Load'); });
					return false;
				});
			}
			return remove();
			
		} else if(load !== undefined) {
			
			return Manager.switchDoc(load,function() {
				if(to) {
					_this.transitionTo(to);
				} else {
					_this.transitionTo('Dashboard');
				}
				return false;
			});
			
		} else if(newbuild === 'true') {
		
			_this.newDoc();
			
		} else if(this.state.loading === true) {
		
			_this.getDocs();
		}
			
	},
	newDoc: function(e) {
		if(e)e.preventDefault();
		Manager.App.createProject();
	},
	confirmDelete: function(e) {
		e.preventDefault();
		Manager.App.confirmDeleteProject(e.target.dataset.id || e.target.parentElement.dataset.id);
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
	render: function() {
		
		var _this = this; 
		
		var temp = [];
		var saved = [];
		
		if(this.state.loading) {
			saved.push(<tr key="load"><td colSpan="5">Loading...</td></tr>);
		} else {
			_.each(this.state.docs,function(v) {
				// var start = Manager._nodes[v._id] && Manager._nodes[v._id].id ? <a href="#" onClick={_this.endNode} data-id={v._id} >Stop</a> : (v.build && v.build.path) ? <a href="#" onClick={_this.startNode} data-id={v._id} >Start</a> : <Link to="LoadTo" params={{load:v._id,to:'Build'}} >Build</Link>;
				
				var start = Manager._nodes[v._id] && Manager._nodes[v._id].id ? <a href="#" onClick={_this.endNode} data-id={v._id} ><span className="glyphicon glyphicon-stop  text-success"  data-toggle="tooltip" data-placement="bottom" title="Stop the node" /></a> : (v.build && v.build.path) ? <a href="#" onClick={_this.startNode} data-id={v._id} ><span className="glyphicon glyphicon-play-circle text-warning"  data-toggle="tooltip" data-placement="bottom" title="Start the node" /></a> : v.temp ? <span /> : <Link to="LoadTo" params={{load:v._id,to:'Build'}} ><span className="glyphicon glyphicon-wrench"  data-toggle="tooltip" data-placement="bottom" title="Build this configuration" /></Link>;
				var removeDir;
				
				var finish = function() {
					var href = _this.makeHref('UnLoad',{unload:v._id});
					var ret = (
						<tr key={v._id} className="tableRow">
							
							<td >
								<Link to="Loader" params={{load:v._id}} ><span  data-toggle="tooltip" data-placement="bottom" title={"switch to " + v.name}>{v.name}</span></Link>
							</td>
							<td >
								{v.build && v.build.options ? v.build.options.version : v.version} 
							</td>
							<td >
								{v.build && v.build.options ? v.build.options.port : ''} 
							</td>
							<td style={{fontSize:21}}>
								{start} 
							</td>
							<td  style={{fontSize:21}}>
								{removeDir} 
							</td>
							<td >
								{moment(v.today).format("lll")}
							</td>
							<td className=" unloadDiv"  style={{fontSize:18}}>
								{Manager.doc && Manager.doc.id !== v._id ? (<a href="#" data-id={v._id} onClick={_this.confirmDelete} ><span className="glyphicon glyphicon-trash   text-danger" /> </a>) : ''} 
							</td>
							
						</tr>
					);
					if(v.temp) {
						temp.push(ret);
					} else {
						
						saved.push(ret);
					}
				}
				
				if(_.isObject(v.build) && v.build.path) {
					removeDir = (<a href="#" onClick={_this.removeNodeDir} data-id={v._id} ><span className="glyphicon glyphicon-remove-circle text-muted"  data-toggle="tooltip" data-placement="bottom" title="Remove build directory" /></a>);
					finish();
				} else {
					finish();
				}
				
			},this);
		}
		return (
			<div>
				<p />
				
				<div  className="">
					
					
					<p />
					<div className="clearfix" />
				</div>
				<p />
				<p>
					
				</p>
				<div role="tabpanel">
					<ul className="nav nav-tabs" role="tablist">
						<li role="presentation" className="active"><a href="#saved" aria-controls="home" role="tab" data-toggle="tab">Saved Builds</a></li>
						<li role="presentation"><a href="#temp" aria-controls="profile" role="tab" data-toggle="tab">Temp Builds</a></li>
						<li role="presentation" className="pull-right"><button className="btn btn-primary" onClick={this.newDoc} > <span className="glyphicon glyphicon-plus" /> New Build</button></li>
					</ul>
					<div className="tab-content">
						<div role="tabpanel" className="tab-pane  active" id="saved">
							<table className="table table-hover">
								<thead>
									<th>Name</th>
									<th>Ver</th>
									<th>Port</th>
									<th>Action</th>
									<th>Build</th>
									<th>Created</th>
									<th>Delete</th>
								</thead>
								<tbody>
									{saved}
								</tbody>
							</table>
							
						</div>
						<div role="tabpanel" className="tab-pane " id="temp">
							<table className="table table-hover">
								<thead>
									
									<th>Name</th>
									<th>Ver</th>
									<th>Port</th>
									<th>Action</th>
									<th>Build</th>
									<th>Created</th>
									<th>Delete</th>
								</thead>
								<tbody>
									{temp}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}
});
