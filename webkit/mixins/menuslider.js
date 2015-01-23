var React =  require('react/addons');

var MenuSlider;
module.exports = MenuSlider = {
    slideMenu: function (menu,open) {
        var state = open === 'closed' ? false : open ? true : this.state.slidemenuOpen
        if(menu) {
			menu.props.position = state === 'right' ? 'right' : state ? 'left' : 'center';
			menu.props.slideOpen = state !== 'right' ? !this.state.slidemenuOpen : this.state.slidemenuOpen;
        }
        this.setState({slidemenuOpen: !this.state.slidemenuOpen, menu: menu});
    },
    slideMenuRender: function () {
        return (
			<div className="pageslider-container" >
				{this.state.menu}
			</div>
		);
    }
}
