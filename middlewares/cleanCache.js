/* Rather than putting some distinct line of code inside the request handler
itself to clear our cache, we instead will make a middleware that automatically
deletes all of the cache associated with a given user.
So then if we have any other request handlers like "app.post('/api/blogs'" (in blogRoutes.js)
where we always want to dump the cache after the request is complete. WE could use that
middleware to do it for us as opposed to having to actually write that line of code
in the request handler.*/
/* NOTE: To make sure "clearHash()" is working, we should be able to create a new blog post
and then come back to this blogs route(localhost:300/blogs) and immediately see
the new post appear on the screen. This is how we're going to bale to know that
it did work.*/

const { clearHash } = require('../services/cache'); // import "clearHash" from "cache.js"

// This function is going to be the middleware that's going to be ran automatically for us.

/* We're going to do a little trick, we're going to use "await next()" and we're going
to mark the function as being "async".
What this does is it makes sure that we call the "next()" function which is, in
this case, the route handler(in "blogRoutes.js") and we let the route handler to
everything that it needs to do. Then after the route handler is complete, execution
is going to come back over to this middleware. Then at this point in time, we will
do our work whichis to call a "clearHash()" and pass in "req.user.id".
So "await next()" is going to allow the handlers to run first, we're going to wait
for that to execute and then after it's all done we will clear pur cache.*/
module.exports = async (req, res, next) => {
  await next();

  clearHash(req.user.id);
};
