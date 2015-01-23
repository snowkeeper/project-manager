
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
var SlideNodes = require('./pages/slidenodes'); 

var Nodes = require('./components/nodes');
var SlideMenu = require('./components/menuslider');
var Modal = require('./components/modal');
 
var PageSlide = require('./mixins/pageslider'); 
var MenuSlide = require('./mixins/menuslider'); 
var QuickFlash = require('./mixins/qflash'); 

var UI = React.createClass({
  
	mixins: [ Router.State, MenuSlide, PageSlide, Router.Navigation],

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
			}.bind(this),
			closeSlides: function() {
				this.slideMenu(<SlideMenu />,'close');
				this.setState({slideOpen: false});
			}.bind(this),
			closeMenu: function() {
				this.slideMenu(<SlideMenu />,'close');
			}.bind(this),
			openMenu: function() {
				this.slideMenu(<SlideMenu />);
			}.bind(this),
			closeMenuOnClick: function() {
				//$(document).on('click',Manager.App.closeListen);
			},
			closeListen: function(e) {
				var el = $(e);
				var cl = el[0].target.className = "pageslider-container";
				Manager.log(cl);
				if(cl) {
					$(document).off('click',Manager.App.closeListen);
					Manager.App.closeMenu();
				}
			},
			_qFlash:{},
			killqFlash: function(who) {
				clearTimeout(Manager.App._qFlash[who])
				$('.fade'+who).fadeOut();
			},
			qFlash:function(type,msg,delay,kill) {
				if(isNaN(delay))delay=4000;
				
				var clear = function(who) {
					clearTimeout(Manager.App._qFlash[who])
					$('.fade'+who).fadeOut();
				}
				var keys = Object.keys(Manager.App._qFlash)
				keys.forEach(function(v) {
					if(kill || v === type)clear(v)
				})
				$('.fade'+type).fadeIn().find('.html').html(msg);
				Manager.log('flash',msg);
				Manager.App._qFlash[type] = setTimeout(function() {
					$('.fade'+type).fadeOut();
				},delay);
				
			},
			removeNodeBuildDir: function(id,callback) {
				Manager.log('remove build ask');
				
				if(_.isFunction(id)) {
					return id('An ID is required');
				}
				
				if(!_.isFunction(callback)) {
					callback = function(){};
				}
				
				if(!id) {
					Manager.App.qFlash('error','Supply an ID to delete directory');
					return callback('An ID is required');
				}
				Manager.getDocById(id,function(err,doc) {
					Manager.App.modal({
							who:'remove build',
							children: <div className="center-content"><h3>Delete the build directory for {doc.name}?</h3></div>,
							confirm: true,
							class: 'modal-sm',
					}, function() {
						Manager.log('remove build');
							_this.setState({modal:false});
							if(Manager._nodes[id] && Manager._nodes[id].pid) {
								Manager.log('stop first');
								Manager._nodes[id].methods.endNode(function() {
									Manager.App.qFlash('loadingmessage','Node ' + doc.name + ' Stopped');
									Manager.App.removeNodeDir(id,callback);
								});
							
							} else {
								Manager.App.removeNodeDir(id,callback);
							}
					});
					
				});
				
				
			},
			removeNodeDir: function(id,callback) {
				var _this = this;
				Manager.log('call main remove method');
				Manager.removeNodeBuildDir(id,function(err,success) {
					Manager.log('removed callback err success',err,success);
					if(err) {
						Manager.App.qFlash('error',err);
						Manager.log(err);
						Manager.App.forceUpdate();
						return callback();
					}
					Manager.log('flash message now');
					Manager.App.qFlash('success','Directory deleted');
					Manager.App.forceUpdate();
					return callback();
				});	
			},
			stopNode: function(id,callback) {
				
				if(_.isFunction(id)) {
					return id('An ID is required');
				}
				
				if(!_.isFunction(callback)) {
					callback = function(){};
				}
				
				if(!id) {
					Manager.App.qFlash('error','Supply an ID to stop a Node');
					return callback('An ID is required');
				}
				// is this node running
				if(!Manager._nodes[id] || !_.isObject(Manager._nodes[id].methods)) {
					Manager.App.qFlash('error','Node was not running');
					Manager.App.forceUpdate();
					return callback('Node not running')
				}
				Manager.App.modal({
						who:'stop',
						children:  <div className="center-content"><h3>Stop node {Manager._nodes[id].name}?</h3></div>,
						confirm: true,
						class: 'modal-sm',
				}, function() {
					Manager._nodes[id].methods.endNode(function() {
						_this.setState({modal:false});
						Manager.App.qFlash('message','Node ' + Manager._nodes[id].name + ' stopping',2500);
						callback();
					});
				});
				
			},
			confirmDeleteProject: function(id) {
				var _this = this;
				
				if(!id) {
					Manager.App.qFlash('error','No ID specified');
				}
				Manager.getDocById(id,function(err,doc) {
					Manager.App.modal({
							who:'delete project',
							children: <div className="center-content"><h3>Really delete project {doc.name}?</h3></div>,
							confirm: true,
							class: '',
					}, function() {
						Manager.App.qFlash('success','Project ' + doc.name + ' deleted');
								_this.transitionTo('UnLoad',{unload:id});
					});
					
				});
				
				
			}.bind(this),
			/* new project */
			createProject: function(id) {
				var _this = this;
				
				Manager.App.modal({
						who:'create project',
						children: <div className="center-content"><h3>Create a new project?</h3></div>,
						confirm: true,
						class: 'modal-sm',
				},function() {	
					Manager.newDoc(function() {
						_this.transitionTo('Version');
					});
				});
				
			}.bind(this),
			modal: function(state,callback) {
				var _this = this;
				if(!_.isObject(state)) {
					return Manager.App.qFlash('error','Modal details required');
				}
				if(!state.who || state.who === '') {
					return Manager.App.qFlash('error','Modal name required');
				}
				_this.setState({
					modal: state
				});
				var customListener = function(status) {
					if(status.confirm === true) {
						_this.setState({modal:false}, function() {
							Manager.removeListener('modal ' + state.who,customListener);
							callback();
						});
					} 
				}
				Manager.on('modal ' + state.who,customListener);
				
			}.bind(this),
			/* new webkit window */
			openWindow: function(e) {
				e.preventDefault();
				var href = e.target.href || e.target.parentElement.href;
				var winname = e.target.dataset.window || e.target.parentElement.dataset.window || 'custom';
				if(href)Manager.openWindow(winname,href);
			},
			
			/* END Manager.App */
		}
		
		return {
			loading: true,
			animating: false,
			slidemenuOpen: false,
			slideOpen: false,
            page: <span />,
            menu: <span />,
            modal: false
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
			//Manager.log('will mount');
			checkInit();
		}
		
	},
	componentDidMount: function () {
		
		var menu = new Manager.contextMenu(/* pass cut, copy, paste labels if you need i18n*/);
		$(document).on("contextmenu", function(e) {
			e.preventDefault();
			menu.popup(e.originalEvent.x, e.originalEvent.y);
		});
		// tooltip breaks my webkit
		$(function () {
			//$('[data-toggle="tooltip"]').tooltip()
		});
		
	},
	/* sometimes my connection sucks so skip waiting... the events will send us to Version when they hit */
	skipLoad: function(e) {
		e.preventDefault();
		this.setState({loading:false});
	},
	showNodes: function(e) {
		if(e)e.preventDefault();
		this.slidePage(<SlideNodes key="Nodes"  />);
	},
	showMenu: function(e) {
		if(e)e.preventDefault();
		this.slideMenu(<SlideMenu />);
	},
	createDoc: function(e) {
		e.preventDefault();
		Manager.App.createProject();
	},
	startNode: function(e) {
		e.preventDefault();
		
			var _this = this;
			var id = Manager.doc.id;
			Manager.startNode(id,function() {
				_this.showNodes();
			});
		
	},
	stopNode: function(e) {
		e.preventDefault();
		var id = Manager.doc.id;
		Manager.App.stopNode(id);
	},
	removeNodeBuildDir: function(e) {
		e.preventDefault();
		
		var id = Manager.doc.id;
		
		Manager.App.removeNodeBuildDir(id);
	},
	render: function () {
		
		var _this = this;
		
		var v = Manager.doc && Manager.doc.doc ? Manager.doc.doc : false;
		
		var start = <span />;
		var rebuild = <span />;
		if(v) {
			start = Manager._nodes[v._id] && Manager._nodes[v._id].id ? <a href="#" onClick={_this.stopNode} data-id={v._id} ><span className="glyphicon glyphicon-stop text-success"  data-toggle="tooltip" data-placement="bottom" title="Stop the node" /></a> : (v.build && v.build.path) ? <a href="#" onClick={_this.startNode} data-id={v._id} ><span className="glyphicon glyphicon-play-circle text-warning"  data-toggle="tooltip" data-placement="bottom" title="Start the node" /></a> : v.temp ? <span /> : <Link to="Build" ><span className="glyphicon glyphicon-wrench"  data-toggle="tooltip" data-placement="bottom" title="Build this configuration" /></Link>;
			
			if(v.build && v.build.path) {
				rebuild = <a href="#" onClick={_this.removeNodeBuildDir} data-id={v._id} ><span className="glyphicon glyphicon-remove-circle text-muted"  data-toggle="tooltip" data-placement="bottom" title="Remove build directory" /></a> 
			}
			
		}
		var section = (this.getPathname() || '/Home').slice(1);
		
		var bClass = (Manager.doc.doc && !Manager.doc.doc.temp) ? '' : 'hidden';
		
		var lis = (
			<ul className="nav nav-pills nav-stacked">
			<li className={section === 'Version' ? 'active':''}><Link to="Version">Version</Link></li>
			<li className={section === 'Configuration' ? 'active':''}><Link to="Configuration">Configuration</Link></li>
			<li className={section === 'Modules' ? 'active':''}><Link to="Modules">Modules</Link></li>
			<li className={section === 'Models' ? 'active':''}><Link to="Models">Models</Link></li>
			<li className={section === 'Routes' ? 'active':''}><Link to="Routes">Routes</Link></li>
			<li className={section === 'Save' ? 'active':''}><Link to="Save">{Manager.doc.doc ? Manager.doc.doc.name : 'Save'}</Link></li>
			
			<li className={section === 'Build' ? 'active ' + bClass : bClass}><Link to="Build">Build</Link></li>
			</ul>
		);
		
		/* a quick loading screen */
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
		/* any _nodes */
		var running;
		var len = _.size(Manager._nodes);
		if(len) {
			running = (
				<div className="bg-primary nodes" onClick={this.showNodes}>
					{len} active {len > 1 ? ' Nodes' : ' Node'} <span className="glyphicon glyphicon-transfer transfer"></span>
				</div>
			);
		}
		
		/* the build logger panel */
		var slider = this.slideRender();
		/* menu panel */
		var menu = this.slideMenuRender();
		var menuOpener = this.state.slidemenuOpen ? "glyphicon glyphicon-chevron-left" : "glyphicon glyphicon-menu-hamburger" ;
		
		/* modal */
		var renderModal;		
			var modal = this.state.modal || {};
			var cancel = function() {
				_this.setState({modal:false});
			}
			var confirm = function() {
				if(_.isFunction(modal.confirm)) {
					modal.confirm();
				}
				_this.setState({modal:false});
			}
		renderModal = <Modal class={modal.class} animate={true} open={modal.who} cancel={cancel} who={modal.who} header={modal.header} confirm={true} buttons={modal.buttons}>{modal.children}</Modal>;
		
		return (
				<div id="wrap" className="">
					{renderModal}
					{slider}
					{menu}
					
					<div id="infoBar" className="">
						<div className="col-xs-3 " id="">
							<div className="list" style={{cursor:'pointer'}} >
								<div className="dashboard pull-left">
									<a href="#" onClick={this.showMenu} ><span  data-toggle="tooltip" data-placement="bottom" title="Change Builds" className={menuOpener}></span></a>
								</div>
								<div className="dashboard pull-right">
									<Link to="Dashboard"><span  data-toggle="tooltip" data-placement="bottom" title="Dashboard" className="glyphicon glyphicon-dashboard"></span></Link>
								</div>
								
								<div className="dashboard pull-right">
									<a href="#" onClick={this.createDoc} ><span  data-toggle="tooltip" data-placement="bottom" title="Start a new build" className="glyphicon glyphicon-plus-sign"></span></a>
								</div>
								
							</div>
				
						</div>
						<div className="col-xs-9  no-pad" id="">
							<div className="build col-xs-7 no-pad">
								<div className="pull-left play">{start}</div>
								<div className="pull-left play">{rebuild}</div>
								<div className="pull-left" style={{marginLeft:10}}><h3>{Manager.doc.doc ? Manager.doc.doc.name : 'Loading...'}</h3></div>
							</div>
							<div className="col-xs-2">
								
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
							<h3>{section}</h3>
							{route}
						</div>
					</div>
					
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
		<Route name="Load" path="Dashboard" handler={Load}/>
		<Route name="NewBuild" path="NewBuild/:newbuild" handler={Load}/>
		<Route name="Dashboard" path="Dashboard" handler={Load}/>
		
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
