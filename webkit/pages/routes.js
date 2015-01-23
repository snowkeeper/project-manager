
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Link = Router.Link;

var Routes;
module.exports = Routes = React.createClass({
	
	saveValue: function(e) {
		var file = this.refs.file.getDOMNode().value;
		var code = this.refs.code.getDOMNode().value;
		//console.log('save value',val,key);
		Manager.routes.push({file:file,code:code});
		Manager.updateDoc({routes:Manager.routes});
		this.forceUpdate();
	},
	deleteItem: function(e) {
		e.preventDefault();
		var el = $(e.target).closest('a');
		var _this = this;
		
		Manager.App.modal({
			who:'delete route',
			children: <div className="center-content"><h3>Delete Route?</h3></div>,
			confirm: true,
			class: 'modal-sm',
		}, function() {
			var newRoutes = [];
			_.each(Manager.routes,function(v) {
				if(v.routeKey === el[0].dataset.routeKey && v.route === el[0].dataset.route) {
					// weird
				} else {
					newRoutes.push(v);
				}					
			},this);
			Manager.routes = newRoutes;
			Manager.updateDoc({routes:Manager.routes},function() {
				_this.forceUpdate();
				Manager.App.qFlash('message','Route removed',2000);
			});
			
		});
		
	},
	render: function() {
		var _this = this;
		var routes = Manager.routes.map(function(v){
			return (<div key={v}>
				<div className="col-xs-1"><a onClick={_this.deleteItem} href="#" data-route={v.route} data-routeKey={v.routeKey}><span className="glyphicon glyphicon-trash" /></a></div>
				<div className="col-xs-3"><b>{v.routeKey}</b></div>
				<div className="col-xs-8">{v.route}</div>
			</div>);
		});
		return (
			<div>
				<p />
				<div  className="">
					
					<p />
					<div className="clearfix" />
				</div>
				<p />
				<div className="clearfix" />
				<p />
				<div className="form-group">
					<label htmlFor="routeKey" >Add a file</label>
					<input type="text" className=" form-control" id="file" ref="file"  />
				
				</div>
				<h4>or Custom Route</h4>
				<div className="form-group">
					<label htmlFor="routeid" >Full Route Function</label>
					<pre>
						{"//Will be wrapped \r\nfunction(app) { \r\n    ...\r\n    your code blocks\r\n    app.get(\r\n        '/route',\r\n        function(req, res, next){\r\n             next();\r\n        },\r\n        function(req, res) {\r\n        \r\n        }\r\n     );\r\n    ...\r\n}\r\n"}
					</pre>
					<textarea  className=" form-control" rows="6" id="code" ref="code"  />
				</div>
				<div className="form-group">
					<div className="">
						<button type="button" className="btn btn-default" onClick={this.saveValue} >Add Route(s)</button>
					</div>
				</div>
				<div className="form-group">
					<div className="">
						<h4>Routes</h4>
						{routes}
					</div>
				</div>
				<p>
					<br />
					<br />
					<br />
				</p>
				<p />
			</div>
		);
	}
});
