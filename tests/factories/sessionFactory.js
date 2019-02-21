  const Buffer = require('safe-buffer').Buffer;
  // Now that we have our session, we need to use keygrip to generate the signature.
  const Keygrip = require('keygrip');
  /* We also require in our "keys.js" file. The purpose of the keys.js file is to
  correctly require in a different key file depending on which enviroment we are in.
  So in practice, we require in the "keys.js" file rather than the "dev.js"(which is where our cookieKey is)
  or "prod.js" files.*/
  const keys = require('../../config/keys'); // "../../" - means go up 2 directories
  /* now we can use keygrip and the keys that we just required in to generate a new
  keygrip instance. */
  const keygrip = new Keygrip([keys.cookieKey]);

// This is the function we're going to call whenever we want to create a new session.

/* We're going to pass in a newly created user model, a mongoose model, into this function.
We will accept it as an argument called "user".*/
module.exports = (user) => { // we will receive an id from "user" which we'll use to make a new session that represents that user.
  const sessionObject = {
    passport: {
      /* NOTE: When we are working with mongoose models(which is what "user" is in this case),
      we always have this "_id" property. However, the mongoose model "_id" property
      is not actually a string. It's actually a javascript object that contains the
      user's id. So if we take the sessionObject as we have formed it up
      right now(without "toString") and then tried to stringify it with "JSON.stringify",
      it would also try to stringify the object that contains the user's id(user._id).
      So "user._id" is actually a javascript object.
      Before we try to turn it into JSON, we have to turn that object into a string.
      When we call "toString()" on it, it takes the string out of the object and it
      just prints that string by itself.*/
      user: user._id.toString()
    }
  };

  // Now we use the "Buffer" library to turn the sessionObject into a string.
  /* We take the "sessionObject" we just created, we turn it into a string
  with JSON.stringify, we feed it into "Buffer", and then call "toString('base64')"
  which turns it all into a base64 string.*/
  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');

  /* take our session string and the keygrip library and sign the actual session to
  generate or signature.*/ // NOTE: 'session=' - is just apart of the library format.
  const sig = keygrip.sign('session=' + session);

  return { session, sig };
};
