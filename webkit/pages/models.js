
var moment = require('moment');

var React =  require('react');
var Router = require('react-router'); 
var Link = Router.Link;

var Models;
module.exports = Models =  React.createClass({
	
	saveValue: function(e) {
		var val = this.refs.model.getDOMNode().value;
		//console.log('save value',val);
		Manager.models.push(val);
		Manager.updateDoc({models:Manager.models});
		this.forceUpdate();
	},
	saveDefault: function(e) {
		
		var _this =this;
		var val = e.target.value;
		if(_.contains(Manager.models,val)) {
			Manager.models = _.without(Manager.models,val);
			if(val === 'Post')Manager.models = _.without(Manager.models,'PostCategory');
			Manager.updateDoc({models:Manager.models},function() {
				//console.log('save default',val,_.contains(Manager.models,val),Manager.models);
				_this.forceUpdate();
			});
			
		} else {
			Manager.models.push(val);
			if(val === 'Post')Manager.models.push('PostCategory');
			Manager.updateDoc({models:Manager.models},function() {
				_this.forceUpdate();
			});
		}
	},
	render: function() {
		var models = Manager.models.map(function(v){
			return (<p key={v}>{v}</p>);
		});
		return (
			<div id="Models" className="form">
				<p />
				<div  className="">
					
					<p />
					<div className="clearfix" />
				</div>
				<p />
				<h4>Predefined Models</h4>
				<div className="form-inline" >
					<div className="checkbox">
						<label>
							<input type="checkbox" onChange={this.saveDefault} value="User" defaultChecked={_.contains(Manager.models,'User')} /> User
						</label>
					</div>
					<div className="checkbox">
						<label>
							<input type="checkbox" onChange={this.saveDefault} value="Gallery"  defaultChecked={_.contains(Manager.models,'Gallery')} /> Gallery
						</label>
					</div>
					<div className="checkbox">
						<label>
							<input type="checkbox" onChange={this.saveDefault} value="Post"  defaultChecked={_.contains(Manager.models,'Post')} /> Blog
						</label>
					</div>
					<div className="checkbox">
						<label>
							<input type="checkbox" onChange={this.saveDefault} value="Enquiry"  defaultChecked={_.contains(Manager.models,'Enquiry')} /> Enquiry
						</label>
					</div>
				</div>
				<p />
				<div className="clearfix" />
				<div className="clearfix" />
				<p />
				<h4>Custom Model</h4>
				
				<div className="form-group">
					<label htmlFor="model" >Path to Model File or Directory of Files</label>
					<input type="text" className=" form-control"  ref="model" id="model" />
					
				</div>
				<div className="form-group">
					<div className="">
						<button type="button" className="btn btn-default" onClick={this.saveValue} >Add Model(s)</button>
					</div>
				</div>
				<p />
				<div className="clearfix" />
				<div className="form-group">
					<div className="">
						<h4>Included Models</h4>
						{models}
					</div>
				</div>
			</div>
		);
	}
});
