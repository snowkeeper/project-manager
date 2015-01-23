var React =  require('react');

var Modal;
module.exports = Modal = React.createClass({
    getInitialState: function() {
		return {
			modalIsOpen: false,
		}
	},
	componentWillReceiveProps: function(p) {
		if(p.open) {
			this.openModal();
		}
	},
	componentDidMount: function() {
		var _this = this;
		$('#theModal').on('hide.bs.modal', function (e) {
			if(_this.props.cancel) _this.props.cancel();
		})
	},
	openModal: function() {
		this.setState({modalIsOpen: true});
		$('#theModal').modal('show')
	},

	closeModal: function() {
		this.setState({modalIsOpen: false});
		$('#theModal').modal('hide')
	},
	
	confirm: function() {
		Manager.emit('modal ' + this.props.who,{who:this.props.who,confirm:true});
		this.closeModal();
		if('function' === typeof this.props.confirm) this.props.confirm();
	},
	
	cancel: function() {
		Manager.emit('modal ' + this.props.who,{who:this.props.who,confirm:false});
		this.closeModal();
		if(this.props.cancel) this.props.cancel();
	},

	render: function() {
		
		var modalClass = 'modal animate ';
		var dialogClass = 'modal-dialog ' + (this.props.class ? ' ' + this.props.class : '');
		var head = <span className="glyphicon glyphicon-question-sign" />;
		if(this.props.header) {
			head = (<h3 className="modal-title">{this.props.header}</h3>);
		}
		
		var confirm = <span />;
		if(this.props.confirm) {
			confirm = (<button type="button" className="btn btn-warning pull-left" onClick={this.confirm}>OK</button>);
		}
		return (
			<div>
				<div className={modalClass} id="theModal">
					<div className={dialogClass}>
						<div className="modal-content">
							<div className="modal-header">
								<button type="button" className="close" onClick={this.cancel}><span aria-hidden="true">&times;</span></button>
								{head}
							</div>
							<div className="modal-body">
								{this.props.children}
							</div>
							<div className="modal-footer">
								{confirm}
								{this.props.buttons}
								<button type="button" className="btn btn-default" onClick={this.cancel}>cancel</button>
							</div>
						</div>
					</div>
				</div>
				<div className="modal-backdrop"></div>
			</div>
		);
	}

});
