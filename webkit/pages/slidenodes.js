
var React =  require('react');

var Nodes = require('../components/nodes');

var SlideNodes;
module.exports = SlideNodes = React.createClass({
    
    getInitialState: function () {
		return {
			nodesViewList: _.size(Manager._nodes) > 0 ? false : true,
			norender: this.props.norender
		}
		
	},
	getDefaultProps: function () {
		return {
			norender: false,
			position: 'left',
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
		Manager.App.slidePage(<SlideNodes key="Nodes" norender={true}  />);
	},
	wideNodes: function(e) {
		if(e)e.preventDefault();
		Manager.App.slidePage(<SlideNodes key="Nodes" norender={true} />,'wide');
	},
	changeView: function(e) {
		if(e)e.preventDefault();
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
				<div >
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
