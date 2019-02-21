/* Inside this file we're going to do some common setup that we need for every test
inside of our test suite.*/

jest.setTimeout(30000);

/* So now just by requiring this file in, it will execute the contents of that
file when jest starts up so mongoose will know what a user model is.*/
require('../models/User');

// we require in mongoose to make sure that it gets connected to our mongodb database.
const mongoose = require('mongoose');
/* NOTE: Remember, this project has the convention of requiring in the "keys.js" file
because the keys.js file will decide upon which of those other key files to require in
based on the current environment.*/
const keys = require('../config/keys');

/* By default, mongoose does not want to use its built in promise implementation
and wants us to tell it what implementation of promises we should use.
So here we're telling mongoose to make use of the nodeJS global promise object.*/
mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });
