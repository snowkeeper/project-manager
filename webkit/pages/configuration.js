
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Route = Router.Route,
	DefaultRoute = Router.DefaultRoute, 
	NotFoundRoute = Router.NotFoundRoute,
	RouteHandler =Router.RouteHandler ,
	Link = Router.Link;
	
var Configuration;
module.exports = Configuration = React.createClass({
		getInitialState: function() {
			return {
				help: false
			}
		},
		list: function() {
			
			var _this = this;
			
			return config.map(function(v) {
				var extra;
				if(!Manager.config[v.key])Manager.config[v.key] = {};
				if(Manager.config[v.key].type == 'bool') {
					if(Manager.config[v.key].value == true) {
						var input = (<input data-type="bool" type="checkbox" onChange={_this.saveValue} id={v.key} ref={v.key} value={Manager.config[v.key].value} defaultChecked />);
					} else {
						var input = (<input data-type="bool" type="checkbox" onChange={_this.saveValue} id={v.key} ref={v.key} value={Manager.config[v.key].value} />);
					}
				} else {
					var val = (Manager.config[v.key].value === false || Manager.config[v.key].value === 'false') ? '' : Manager.config[v.key].value;
					if(Manager.config[v.key].type === 'object') {
						var input = (<textarea rows="3" data-type={Manager.config[v.key].type} type="textarea" onChange={_this.saveValue} className={Manager.config[v.key].type + " form-control"}  value={val} ref={v.key} id={v.key} ></textarea>);
					} else {
						var input = (<input data-type={Manager.config[v.key].type} type="text" onChange={_this.saveValue} className={Manager.config[v.key].type + " form-control"}  ref={v.key} id={v.key} value={val} />);
					}
					
				}
				if(v.mixed) extra = v.mixed.map(function(t) {
					return (
							<div className="checkbox" key={t} style={{padding:5}}>
								<label>
									<input type="radio" name={v.key + 'Type'} data-field={v.key} onChange={_this.changeType} value={t} defaultChecked={t === Manager.config[v.key].type} /> {t}
								</label>
							</div>
					);
				});
				return (
					<div className="form-group" key={v.key}>
						<label htmlFor={v.key} className="col-sm-3 control-label">{v.key}</label>
							<div className="col-sm-9">
								{input}
								<div className="form-inline" >
									{extra}
								</div>
							</div>
					</div>
				);
			});
		}, 
		changeType: function(e) {
			var el = e.target;
			var merge = { };
			merge[el.dataset.field] = {
				type: el.value
			};
			Manager.config = _.merge(Manager.config,merge);
			Manager.updateDoc({config:Manager.config});
			this.forceUpdate();
		}, 
		saveValue: function(e) {
			var el = e.target;
			//console.log('save value',el.id,el.value);
			if(el.dataset.type === 'bool') {
				el.value = el.checked ? true : false;
			}
			var merge = { };
			merge[el.id] = {
				key: el.id,
				value: el.value,
				type: el.dataset.type || Manager.config[el.id].type || 'string'
			};
			Manager.config = _.merge(Manager.config,merge);
			Manager.updateDoc({config:Manager.config});
			this.forceUpdate();
		},
		help: function(e) {
			e.preventDefault();
			this.setState({help:!this.state.help});
		},
	  render: function () {
		var lists = this.list();
		var text = ("var keystone = require('keystone'); \r\n");
		text += ("var _ = require('underscore'); \r\n");
		text += (" \r\n");
		text += ("module.exports = { \r\n");
		text += (" \r\n");
		text += ("	nav: { \r\n");
		text += ("		'posts': ['posts', 'post-categories'], \r\n");
		text += ("		'galleries': 'galleries', \r\n");
		text += ("		'enquiries': 'enquiries', \r\n");
		text += ("		'users': 'users' \r\n");
		text += ("	}, \r\n");
		text += ("	locals : { \r\n");
		text += ("		_: require('underscore'), \r\n");
		text += ("		env: keystone.get('env'), \r\n");
		text += ("		utils: keystone.utils, \r\n");
		text += ("		editable: keystone.content.editable \r\n");
		text += ("	} \r\n");
		text += (" \r\n");
		text += ("} \r\n");
		
		if(this.state.help) {
			var help = (
				<div>
						<p>
							To supply values other than string or boolean you can use a helper module.  Provide the path to the module
							as you would in a require().  Then for each option with a blue border or <code>module</code> option, provide the key from the helper module you provided.
						</p>
						<p>
							The default is <code>helper module = webkit/pkg/helper.js</code>. You can then set option <code>nav = nav</code> with  <code>module</code> selected as the type.
						</p>
						<pre>
									{text}
									
						</pre>
						<p><a href="#" className="pull-right" onClick={this.help} >Hide configuration help</a><br /></p>
				</div>
			);
		} else {
			var help = (
				<div>
					<a className="" href="#" onClick={this.help} >View configuration help</a><br /><br />
				</div>
			);
		}
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
				<p />
			{help}
			
			<div className="keystone-lists">
				<form className="form-horizontal">			
					{lists}
					<div className="form-group">
						<div className="col-sm-offset-2 col-sm-10">
							
						</div>
					</div>
				</form>
			</div>
		</div>
		);
	  }
});
