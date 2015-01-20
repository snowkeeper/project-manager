module.exports = [
	{
		key: 'helper module',
		value: 'webkit/pkg/helper.js',
		type: 'ignore'
	},
	{
		key: 'name',
		value: 'Keystone',
		type: 'string'
	},
	{
		key: 'brand',
		value: 'KeystoneJS',
		type: 'string'
	},
	{
		key: 'auth',
		value: true,
		type: 'bool',
		mixed: ['object','bool'],
		always: true
	},
	{
		key: 'user model',
		value: 'User',
		type: 'string'
	},
	{
		key: 'auto update',
		value: true,
		type: 'bool',
		always: true
	},
	{
		key: 'cookie secret',
		value: 'asdfasdf8Q3V24QQ54VRTVTYGQ7oasduk',
		type: 'string'
	},
	{
		key: 'nav',
		value: false,
		type: 'module',
		mixed: ['object','module'],
		option: 2
	},
	{
		key: 'csv field delimiter',
		value: false,
		type: 'string'
	},
	{
		key: 'env',
		value: 'development',
		type: 'string'
	},
	{
		key: 'port',
		value: 3000,
		type: 'number'
	},
	{
		key: 'host',
		value: 'localhost',
		type: 'string'
	},
	{
		key: 'views',
		value: '/templates/views',
		type: 'string'
	},
	
	{
		key: 'view engine',
		value: 'jade',
		type: 'string'
	},
	{
		key: 'custom engine',
		value: false,
		type: 'module',
		mixed: ['object','module']
	},
	{
		key: 'view cache',
		value: false,
		type: 'bool'
	},
	{
		key: 'locals',
		value: false,
		type: 'module',
		mixed: ['object','module'],
		option: 1
		
	},
	{
		key: 'static',
		value: 'public',
		type: 'string'
	},
	{
		key: 'static options',
		value: false,
		type: 'module',
		mixed: ['object','module']
	},
	{
		key: 'less',
		value: 'public',
		type: 'string'
	},
	{
		key: 'less options',
		value: false,
		type: 'module',
		mixed: ['object','module']
	},
	
	{
		key: 'sass',
		value: false,
		type: 'string'
	},
	{
		key: 'sass options',
		value: false,
		type: 'module',
		mixed: ['object','module']
	},
	{
		key: 'favicon',
		value: '/public/favicon.ico',
		type: 'string'
	},
	{
		key: 'compress',
		value: true,
		type: 'bool',
		always: true
	},
	{
		key: 'logger',
		value: false,
		type: 'string'
	},
	{
		key: 'trust proxy',
		value: true,
		type: 'bool',
		always: true
	},
	{
		key: 'ssl',
		value: false,
		type: 'bool',
		mixed: ['bool','string']
	},
	{
		key: 'ssl key',
		value: false,
		type: 'string'
	},
	{
		key: 'ssl cert',
		value: false,
		type: 'string'
	},
	{
		key: 'ssl ca',
		value: false,
		type: 'string'
	},
	{
		key: 'ssl port',
		value: false,
		type: 'number'
	},
	{
		key: 'ssl host',
		value: false,
		type: 'string'
	},
	
	{
		key: 'mongo',
		value: false,
		type: 'string'
	},
	{
		key: 'mongo prefix',
		value: false,
		type: 'string'
	},
	{
		key: 'session options',
		value: JSON.stringify({ key: "keystone.sid" }),
		type: 'object'
	},
	{
		key: 'session store',
		value: false,
		type: 'bool',
		mixed: ['string','bool']
	},
	{
		key: 'session store options',
		value: false,
		type: 'module',
		mixed: ['object','module']
	},
	{
		key: 'cloudinary config',
		value: JSON.stringify({ cloud_name: 'keystone-demo', api_key: '333779167276662', api_secret: '_8jbSi9FB3sWYrfimcl8VKh34rI' }),
		type: 'object',
		mixed: ['string','object','module']
	},
	{
		key: 'cloudinary secure',
		value: false,
		type: 'bool'
	},
	{
		key: 'mandrill api key',
		value: 'NY8RRKyv1Bure9bdP8-TOQ',
		type: 'string'
	},
	{
		key: 'mandrill username',
		value: false,
		type: 'string'
	},
	{
		key: 'back url',
		value: false,
		type: 'string'
	},
	{
	 	key: 'signin url',
		value: false,
		type: 'string'
	},
	{
		key: 'signin redirect',
		value: false,
		type: 'string'
	},
	{
		key: 'signout url',
		value: false,
		type: 'string'
	},
	{
		key: 'signout redirect',
		value: false,
		type: 'string'
	},
]
