
/* We're going to create a MongoDB instance through a third party service
called mLab.com and we're going to relace the default keys with our own personal
keys.*/
module.exports = {
  googleClientID:
    '964808011168-29vqsooppd769hk90kjbjm5gld0glssb.apps.googleusercontent.com',
  googleClientSecret: 'KnH-rZC23z4fr2CN4ISK4srN',
  mongoURI: 'mongodb://darren:july1595@ds155903.mlab.com:55903/blog_dev_1300',
  /* We generally replace the cookieKey when we start to deploy our application
  to a production enviroment.
  So for example, in the "prod.js", which is where all of our enviroment variables
  are for production enviroments, we'll notice that now the value is going to come from
  some enviroment variable("process.env.COOKIE_KEY").
  So when we actually*/
  cookieKey: '123123123',
  redisUrl: 'redis://127.0.0.1:6379'
};
