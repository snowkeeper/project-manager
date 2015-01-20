
var React =  require('react');

var BuildState;
module.exports = BuildState = React.createClass({
	render: function() {
		
		var message = this.props.children;
		
		if(this.props.working) {
			var gly = <span className="glyphicon glyphicon-dashboard" />;
			var cl = "text-info";
			var message = this.props.working !== true ? this.props.working : message;
		} else if(this.props.error) {
			var gly = <span className="glyphicon glyphicon-remove" />;
			var cl = "text-danger";
			var message = this.props.error;
		} else if(this.props.success) {
			var gly = <span className="glyphicon glyphicon-ok" />;
			var cl = "text-success";
			var message = this.props.success !== true ? this.props.success : message;
		} else {
			var gly = <span className="glyphicon glyphicon-minus" />;
			var cl = "text-muted";
		}
		
		return (
			<div className={cl + "col-xs-12"}>
				<div className={cl + " col-xs-1"}>{gly} </div>
				<div  className={cl + " col-xs-11"} style={{float:'left',maxHeight:200,overflow:'auto'}} dangerouslySetInnerHTML={{__html: message}} />
				<div className="clearfix" />
			</div>		
		);		
	}
	
});
