// NOTE: We have to "require()" this file in "index.js"

/* We're going to write some code that is going to try to hijack the
"Query.prototype.exec" function and try to run a little bit of custom logic
whenever a query is issued.*/

const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

// const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(keys.redisUrl);
// promisify our "client.get" function
client.hget = util.promisify(client.hget)
/* We want to get a reference to the existing default exec function that is
defined on a mongoose query. We're then going to overwrite that function and figure
out how we can manipulate or execute code whenever the query is executed.*/

/* This stores a reference to the original exec function, the untouched copy of it,
the copy of it that is suppose to be executed any time a query is executed.
Then immediately underneath that we are going to write a little bit of extra code
that tries to overwrite this function and add in some additional logic.*/

const exec = mongoose.Query.prototype.exec;

// create a chainable ".cache()" function
// so we can cache only the things with ".cache()" on them and not everything
// NOTE: We call ".cache()" in "blogRoutes.js"

// Nested Hashes
/*We are going to allow ourselves to more dynamically specify the top level key on
the fly so we don’t have to use a user id at all. We can instead, for example, use a
blog post id if we’re trying to record comments that have been cached against a
particular blog post or whatever.*/

/* We're going to make sure that whenever we call this cache function("cache"), we
have to specify some top level hash key to use for this caching operation. So that's
what is going to allow us to get some level of reusable code out of this so that
we won't be 100 percent pigeonholed into always using a user idea.
So we're going to assume that any time someone calls the cache function they should
also pass in an "options" object and default it to be an empty object("{}") just
in case someone doesn't pass anything into it.
Then we are going to assume that on this options object, whoever's making use of this
caching thing is going to provide a key property. So this is the key that's going to
be used as at the top level hash key. This is how we're going to make this reusable
for other projects.*/

 mongoose.Query.prototype.cache = function(options = {}) { // this is how we make the ".cache()" (used in blogRoutes.js)
   this.useCache = true;
   // "hashKey" is a made up name(we don't have to call it "hashKey")
   /* We're just saying that if we pass in a key("options.key") then we're going
   to assign it to "hashKey" so that we can then use it down inside of the exec
   function when we start setting and getting our data.*/
   // any key that we use must be a number or a string
   this.hashKey = JSON.stringify(options.key || '');
   /* To make sure it's the actual chainable function call(".cache()"),
   we return "this"*/
   return this;
 }


/* NOTE: notice we're using the "function" keyword and not an arrow function, that's
because an arrow function tries to mess around with the value of "this" inside the
function.
This is a function that's being assigned to the "prototype" property, so inside this
function if we were to write out "this" it should reference the query("Query") that
is being produced. That's why we don't use a arrow function in this situation.*/
mongoose.Query.prototype.exec = async function() {

/*If "!this.useCache" then we will run the original exec function and return the
result of it right away.*/
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }


  /* We're going to write a tiny bit of code that's going to somehow run before
  any query by mongoose.*/

  /* This console log is basically going to be our proof that we have the ability
  to hook into and execute some extra logic before any "exec" is called.*/
  console.log('IM ABOUT TO RUN A QUERY');
  /* We're going to run the original query and then right after that we're going
  to run the original "exec" function to get a good idea of how this thing works.*/
  /* "exec.apply(this, arguments)" is the code we would run to execute the original,
  untouched, pristine copy of "exec" that we have not messed around with. */

  // "this" is a reference to the current query that we are trying to execute
  /*For example, if we think back over to the "blogRoutes.js" file, we made
  the "const blogs = await Blog.find({ _user: req.user.id });" query and we
  eventually executed it.
  So in this case if we ran "this.getQuery()", we would expect to get back an
  object telling us that we are trying to find a user with some particular id
  because that is the way in which this query had been customized.*/
  // console.log(this.getQuery());

  /* We need to combine the "getQuery" and "mongooseCollection.name" objects together
  inside of one object. To do so we need to take the object returned from "getQuery()"
  and make a copy of it and then also add in the collection name to it as well.
  To do this we're going to use a function called "Object.assign()".*/

  /* "Object.assign()" is used to safely copy properties from one object to another.
  The first argument is the object that we're going to copy a bunch of properties to.
  So we're going to take the results of "getQuery", we're going to take all the
  properties that are on there and we're going to assign them to this empty object("{}").
  We're then going to take this other object("{ console.log(this.mongooseCollection.name); }")
  and copy it on the the empty object as well.*/
  const key = JSON.stringify( // turn the key into JSON
  Object.assign({}, this.getQuery(), {
    // to get access to the collection name
    collection: this.mongooseCollection.name
  })
);

  // See if we have a value for 'key' in redis

  /* instead of calling "get" we want to call "hget" which is what we use for pulling
  information out of a nested hash. And then the top level key that we're going to
  use id "this.hashKey".*/
  const cacheValue = await client.hget(this.hashKey, key);

// NOTE: Case where "cacheValue" is a single object

  // If we do, return that
  //if (cacheValue) {
    /* To take the JSON data that pulled out of redis and actually turn it into a
    documentary model instance that can be used correctly throughout our application,
    we can call "new this.model(cacheValue)"*/
    /* NOTE: "this.model" is a reference to the model that this query is attatched to("mongoose.Query.prototype.exec").
    We can create a new instance of that model by calling new, the model class itself, and
    then pass in the properties we want to assign to that model.*/
    /* Same as...
      new Blog({
        title: 'Hi',
        content: 'There'
    })
  }
    */
    //const doc = new this.model(JSON.parse(cacheValue));
    /* return the "cacheValue" and remember, anything that comes out of redis is going to
    be in JSON from. So we need to parse it before we return it from this caching function.*/
    //return doc;
  //}


  // NOTE: Case where "cacheValue" is an array of records(whenever we try to fetch a list blog post) or a single object.

  /* We need do something slightly differently depending upon whether or not we are attempting
  to deal with an array of records or a single record.*/
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    // check to see if "doc" is an array or just a simple object
    // If "doc" is an array of records then "isArray" is going to return true, otherwise it's going to return false.
    // if it's true, return "it's an array" : "it's an object"
    // true = "doc.map(d => new this.model(d))" : false = "new this.model(doc);"
    return Array.isArray(doc)
    /* map over the array of "doc" and for every record inside of it we're going to
    call "new this.model" and we're going to return a doc instance ("d"). */

    /* NOTE: No matter whether we are working with an array of records or a single
    record, this entire terinary expression is going to correctly parse/hydrate all
    of those values.*/
    ? doc.map(d => new this.model(d))
    : new this.model(doc);
  }

  // Otherwise, issue the query and store the result in redis

  /* We use the apply function so that we can pass in automatically any "arguments"
  that are passed into "exec" as well.*/
  const result = await exec.apply(this, arguments);

  /* This is going to take the result that we got back, turn it into JSON data and
  then set it inside of redis at that particular key.*/


  /* NOTE: it may seem like the expiration is not working because when we use the
  "set()" it only applies to future sets and since we've already set a value of two,
  setting the expiration time is not somehow retroactive until we set this blog post
  value again, we're not going to see that new value to appear. However if we go
  create a brand new account and start creating posts tied to that one, then we will
  be resetting the cache and the expiration is going to kick in.*/
  client.hmset(this.hashKey, key, JSON.stringify(result), 'EX', 10); // before store the result inside of redis, we need to first turn it into JSON
  /* We can return "result" right away and everything will work inside of our
  application as we expect because "result" is the actual document instance that
  is what is expected to be returned from the "exec()" function.*/
  return result;

  //console.log(result);
  /* result:
  { _id: 5c11c9ea1ebc14071c75edbb,
   googleId: '113333763055207824910',
   displayName: 'Darren Fuller',
   __v: 0 }
   */

   /* With this we now have to ability to inject some extra logic that will be
   executed before a query is actually sent off to MongoDB which means we can somehow
   intercept that query, check to see if the query has already been fetched,
   and if it has, return the data from redis as opposed to actually sending the
   query of to Mongo.*/
}


/* We are now storing all of our blog posts inside of rentes nested on a hash where
the key is the user id. The next thing we're going to do is figure out some way to
forcibly clear out that hash. We're going to actually remove the data that sits on
that hash key inside of our "cache.js" file but we're going to call it from other
locations inside of our code base.*/

/* We're going to define a function down at the bottom of the file and export it.
The purpose of this function is going to be soley to delete data that is nested
on a particular hash key.*/
/* NOTE: In theory, we might end up exporting mutiple functiond from this file
besides just "clearHash" that's why we nested it inside this object("= {}").*/
module.exports = {
  /* "clearHash" is going to take the hash key that we want to delete inside of redis
  and then we're going to add a little bit of logic to look into our redis into our
  redis instance and delete whatever data is stored. To delete all the information
  associated with the given key, we write "client.del()" and then we pass in the given key.
  Remember, this "hashKey" might accidentially be provided as an array or an object or
  something like that so to avoid any type of error we're going to pass in "hashKey"
  after stringifying it.*/
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
