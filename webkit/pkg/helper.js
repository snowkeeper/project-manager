var keystone = require('keystone');
var _ = require('underscore');

module.exports = {

	nav: {
		'posts': ['posts', 'post-categories'],
		'galleries': 'galleries',
		'enquiries': 'enquiries',
		'users': 'users'
	},
	locals : {
		_: require('underscore'),
		env: keystone.get('env'),
		utils: keystone.utils,
		editable: keystone.content.editable
	}


}
