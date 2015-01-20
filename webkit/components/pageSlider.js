var React =  require('react/addons');

var PageSlider;
module.exports = Nodes = {
    componentDidUpdate: function() {
        
    },
    slidePage: function (page,open) {
        var state = open === 'closed' ? false : open === 'wide' ? 'left' : open ? true : this.state.slideOpen
        if(page) {
			page.props.position = state === 'left' ? 'left' : state ? 'right' : 'center';
			page.props.slideOpen = state !== 'left' ? !this.state.slideOpen : this.state.slideOpen;
        }
        this.setState({slideOpen: !this.state.slideOpen, page: page, animating: true});
    },
    slideRender: function () {
        return (
			<div className="pageslider-container" >
				{this.state.page}
			</div>
		);
    }
}
