const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const cleanCache = require('../middlewares/cleanCache'); // import "cleanCache.js"

const Blog = mongoose.model('Blog');

module.exports = app => {
  // Route handler to get a single blog
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    });

    res.send(blog);
  });

  /* NOTE: We delete the code we wrote in the previous section because it will interfere
  with some of the caching setup that we're going to add into the "cache.js" file.*/
  // Route handler to get a list of all the blogs
  app.get('/api/blogs', requireLogin, async (req, res) => {
    /*inside of “.cache({})”, we can add in some property to use as the
    cache key(“key: req.user.id”). We’re saying that we want all of this user’s
    blog posts to be cached in a key of  req.user.id. So for this we’re using a
    top level “key” of “req.user.id”. This is how we cache all the user’s posts
    on one individual hash object.*/
    const blogs = await Blog.find({ _user: req.user.id }).cache({ key: req.user.id }); // now this query is caching because we use the ".cache()" call

    res.send(blogs);
  });

  // Route handler to create a new blog
  /* we add the "cleanCache" middleware to automatically clear cache after the handler 
  has been executed.*/
  app.post('/api/blogs', requireLogin, cleanCache, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }
    // clearHash(req.user.id) - refacteres with cleanCache middleware
  });
};
