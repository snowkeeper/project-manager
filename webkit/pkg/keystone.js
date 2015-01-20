// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone');

// We may require a helper here
##HELPER##

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init(##INIT##);

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

##OPTIONS1##

// Load your project's Routes

##ROUTES##


##OPTIONS2##


// Start Keystone to connect to your database and initialise the web server

keystone.start();
