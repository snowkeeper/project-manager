
var _ = require('lodash');
var config = require('./pkg/config.js');
var moment = require('moment');

var React =  require('react/addons');
var Router = require('react-router'); 
var Route = Router.Route,
	DefaultRoute = Router.DefaultRoute, 
	NotFoundRoute = Router.NotFoundRoute,
	RouteHandler =Router.RouteHandler ,
	Link = Router.Link;
	
var Load = require('./pages/load');
var Modules = require('./pages/modules');
var Models = require('./pages/models');
var Routes = require('./pages/routes');
var Version = require('./pages/version');
var Configuration = require('./pages/configuration');
var Save = require('./pages/save');
var Build = require('./pages/build'); 
var Nodes = require('./components/nodes'); 
var PageSlide = require('./components/pageSlider'); 


var UI = React.createClass({
  
	mixins: [ Router.State, PageSlide ],

	getInitialState: function () {
		
		var _this = this;
		
		Manager.App = {
			forceUpdate: function() {
				_this.forceUpdate();
			},
			showNodes: _this.showNodes,
			slidePage: _this.slidePage,
			closeSlide: function() {
				this.setState({slideOpen: false});
			}.bind(this)
		}
		
		return {
			loading: true,
			animating: false,
			slideOpen: false,
            page: <span />,
		};
	},

	componentWillMount: function () {
		var _this = this;
		var _branches = false;
		var _versions = false;
		
		var checkInit = function() {
			if(Manager.branches && Manager.current) {
				_this.setState({
					loading: false
				});
			} else {
				Manager.on('branches',function(status) {
					if(status.success) {
						if(_this.state.versions) {
							_this.setState({
								loading: false,
								branches: true
							});
						} else {
							_this.setState({
								branches: true
							});
						}
					} else {
						_this.setState({
							branchesFail: true,
							branchesMessage: status.err,
							branches: true
						});
					}
				});
				Manager.on('versions',function(status) {
					if(status.success) {
						if(_this.state.branches) {
							_this.setState({
								loading: false,
								versions: true
							});
						} else {
							_this.setState({
								versions: true
							});
						}
					} else {
						_this.setState({
							versions: true,
							versionsFail: true,
							versionsMessage: status.err
						});
					}
				});
			}
		}
		if(this.state.loading) {
			//console.log('will mount');
			checkInit();
		}
		
	},
	componentDidMount: function () {
		
		var menu = new Manager.contextMenu(/* pass cut, copy, paste labels if you need i18n*/);
		$(document).on("contextmenu", function(e) {
			e.preventDefault();
			menu.popup(e.originalEvent.x, e.originalEvent.y);
		});
		
	},
	skipLoad: function(e) {
		e.preventDefault();
		this.setState({loading:false});
	},
	showNodes: function(e) {
		if(e)e.preventDefault();
		this.slidePage(<SlidePage key="Nodes"  />);
	},
	render: function () {
		var section = (this.getPathname() || '/Home').slice(1);
			var lis = (
			<ul className="nav nav-pills nav-stacked">
			<li className={section === 'Load' ? 'active':''}><Link to="Load">New / Manage</Link> </li>
			<li className={section === 'Version' ? 'active':''}><Link to="Version">Version</Link></li>
			<li className={section === 'Configuration' ? 'active':''}><Link to="Configuration">Configuration</Link></li>
			<li className={section === 'Modules' ? 'active':''}><Link to="Modules">Modules</Link></li>
			<li className={section === 'Models' ? 'active':''}><Link to="Models">Models</Link></li>
			<li className={section === 'Routes' ? 'active':''}><Link to="Routes">Routes</Link></li>
			<li className={section === 'Save' ? 'active':''}><Link to="Save">Save</Link></li>
			<li className={section === 'Build' ? 'active':''}><Link to="Build">Build</Link></li>
			</ul>
		);
		if(this.state.loading) {
			var branches = this.state.branchesFail ?  <p className="text-danger"><span className="glyphicon glyphicon-remove" /> Branches failed to load.<br />{this.state.branchesMessage}</p> : this.state.branches ? <p className="text-success"><span className="glyphicon glyphicon-ok" /> Branches loaded</p> : <p className="text-info">Branches loading...</p>;
			var versions = this.state.versionsFail ?  <p className="text-danger"><span className="glyphicon glyphicon-remove" /> NPM Versions failed to load.<br />{this.state.versionsMessage}</p> : this.state.versions ? <p className="text-success"><span className="glyphicon glyphicon-ok" /> NPM versions loaded</p> : <p className="text-info">NPM versions loading...</p>;
			var route = (
				<div>
					<h3 >Loading...</h3>
					<p>{branches}</p>
					<p>{versions}</p>
					<p>If there are connection issues you can skip loading.  Version and/or branch info may not be available.</p>
					<p>
						<a href="#" onClick={this.skipLoad} >skip loading</a><br />
					</p>
					
				</div>
			);
		} else {
			var route = <RouteHandler/>;
		}
		var running;
		var len = _.size(Manager._nodes);
		if(len) {
			running = (
				<div className="bg-primary nodes" onClick={this.showNodes}>
					{len} active {len > 1 ? ' Nodes' : ' Node'} 
				</div>
			);
		}
		
		var slider;
		
		slider = this.slideRender();

		return (
				<div id="wrap" className="">
					{slider}
					<div id="infoBar" className="">
						<div className="col-xs-3 infoBarLinks" id="infoBarLinks">
							<div className="list">
								<span className="glyphicon glyphicon-list-alt"></span>
								Keystone
							</div>
				
						</div>
						<div className="col-xs-9  no-pad" id="">
							<div className="list col-xs-9 infoBarLinks infoBarInfo">
								{section}
							</div>
							<div className="no-pad col-xs-3 ">
								{running}
							</div>
						</div>
					</div>
					<div className="" id ="infoContent">
						<div className="col-xs-3" id="listList" style={{display:"none"}}>
					
						</div>
						<div className="col-xs-3" id="itemList" >
							
								{lis}
							
						</div>
						<div className="Content col-xs-offset-3 col-xs-9">
							{route}
						</div>
					</div>
					
				</div>
		);
		
	}
	
});


var SlidePage = React.createClass({
    getInitialState: function () {
		return {
			nodesViewList: _.size(Manager._nodes) > 0 ? false : true,
			norender: this.props.norender
		}
		
	},
	componentWillReceiveProps: function(p) {
		if(p.norender)this.setState({norender:p.norender});
	},
	componentWillUpdate: function() {
		//if(!this.state.nodesViewList && _.size(Manager._nodes) > 1) this.setState({nodesViewList:true,norender:false});
		
	},
    closeNodes: function(e) {
		if(e)e.preventDefault();
		Manager.App.slidePage(<SlidePage key="Nodes" norender={true}  />);
	},
	wideNodes: function(e) {
		if(e)e.preventDefault();
		Manager.App.slidePage(<SlidePage key="Nodes" norender={true} />,'wide');
	},
	changeView: function() {
		this.setState({nodesViewList:!this.state.nodesViewList,norender:false});
	},
    render: function () {
        var ret;
        if(this.props.slideOpen) {
			if(!this.state.nodesViewList) {
				var view = <a href="#"  onClick={this.changeView} ><span className="text-muted glyphicon glyphicon-th-large" /></a>
			} else {
				var view = <a href="#"  onClick={this.changeView} ><span className="text-muted glyphicon glyphicon-th-list" /></a>
			}
			var widenode;
			if(this.props.position !== 'left') {
				widenode = (
					<div className="slideHead text-primary col-xs-1"  onClick={this.wideNodes}>
						<span className="glyphicon glyphicon-chevron-left" />
					</div>
				);
			}
			ret = (
				<div>
					{widenode}
					<div className="slideHead text-primary col-xs-9"  onClick={this.closeNodes}>
						<span className="glyphicon glyphicon-chevron-right" />
					</div>
					<div className="slideHead text-right  col-xs-2" >
						{view}
					</div>
					
					<div className="clearfix" />
					<div className="slideContent">
						<Nodes single={!this.state.nodesViewList} norender={this.state.norender} />
					</div>
				</div>
			);
		}
        return (
            <div className={"page " + this.props.position}>
				{ret}
            </div>
        );
    }
});

var NotFound = React.createClass({
  render: function () {
    var stack = keystone.app._router.stack;
   
    var list = stack.map(function(route) {
	 if(!_.isUndefined(route.route)) {
		return (<li key={route.route.path}>{route.route.path}</li>)
	}    
    });
    return (<div>
		<h2>Not found</h2>
		<ul>{list}</ul>
	</div>);
  }
});

var routes = (
	  <Route path="" handler={UI}>
		<DefaultRoute handler={Load}/>
		<Route name="Version" path="Version" handler={Version}/>
		<Route name="Configuration" path="Configuration" handler={Configuration}/>
		<Route name="Models" path="Models" handler={Models}/>
		<Route name="Modules" path="Modules" handler={Modules}/>
		<Route name="Routes" path="Routes" handler={Routes}/>
		<Route name="Save" path="Save" handler={Save}/>
		<Route name="Load" path="Load" handler={Load}/>
		<Route name="Loader" path="Load/:load" handler={Load}/>
		<Route name="LoadTo" path="Load/:load/:to" handler={Load}/>
		<Route name="UnLoad" path="UnLoad/:unload" handler={Load}/>
		<Route name="Build" path="Build" handler={Build}/>
		<Route name="Nodes" path="Nodes" handler={Nodes}/>
		<NotFoundRoute handler={NotFound}/>
	  </Route>
	 
);

Router.run(routes,  function (Handler) {
  React.render(<Handler/>, document.getElementById('contents'));
});
