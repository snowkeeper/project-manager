
var React =  require('react/addons');
var Node = require('./node');

var Nodes;
module.exports = Nodes = React.createClass({

	mixins: [React.PureRenderMixin],
	
	componentWillMount: function() {
		this.componentWillUpdate();
	},
	componentWillUpdate: function() {
		var nodes = this.props.nodes ? this.props.nodes : Manager && _.size(Manager._nodes) > 0 ? Manager._nodes : false;
		if(!nodes)Manager.App.slidePage(false,'close');
	},
	shouldComponentUpdate: function() {
		return !this.props.norender;
	},
	render: function() {
		var nodes = this.props.nodes ? this.props.nodes : Manager && _.size(Manager._nodes) > 0 ? Manager._nodes : false;
		// list any started builds
		var running = [];
		_.each(nodes,function(node) {
			running.push(<div key={node.id} ><Node node={node} /></div>);
		},this);
		
		// show stacked or columned
		if(this.props.single) {
			
			var ret = running;		
		
		} else {
			
			var ret = [];
			_.each(running,function(node) {
				var send = (
					<div className="col-xs-12 col-sm-6 nodes" key={hat()}>
						{node}
					</div>
				);
				ret.push(send);
			},this);
		
		}
		
		return (
				<div id="Nodes">
					{ret}
				</div>	
			);		
	}
	
});
