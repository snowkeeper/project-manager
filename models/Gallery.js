var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Gallery Model
 * =============
 */

var Gallery = new keystone.List('Gallery', {
	autokey: { from: 'name', path: 'key', unique: true }
});

Gallery.add({
	name: { type: String, required: true },
	publishedDate: { type: Date, default: Date.now },
	slug: { type: Types.Key },
	heroImage: { type: Types.CloudinaryImage, publicID:'slug' },
	images: { type: Types.CloudinaryImages }
});

Gallery.register();
