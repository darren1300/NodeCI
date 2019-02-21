// const puppeteer = require('puppeteer'); - now defined in "page.js"
// const sessionFactory = require('./factories/sessionFactory') - now defined in "page.js"
// const userFactory = require('./factories/userFactory'); - now defined in "page.js"
const Page = require('./helpers/page');

/*
test('Adds two numbers', () => {
  const sum = 1 + 2;

  /* We make an assertion and verify that some value that some value that has
  been produced inside of our test is the value that we expect. To do so, we can
  write "expect(sum)" then "toEqual()" and then whatever value we expect it to
  equal which in this case is "3"*/
  // NOTE: "expect()" works the same as "assert()"
  // expect(sum).toEqual(3);
// });

let page;

// The code inside the beforeEach will be executed automatically whenever another test is going to run.
beforeEach(async () => {

  /* We're going to use the "page" object to try to navigate to our running
  application.*/
  page = await Page.build();
  await page.goto('http://localhost:3000/blogs');
});

// automatically close any running chromium instances that are still open.
afterEach(async () => {
  await page.close();
});

test('The header has the correct text', async () => {
  /* The function "el => el.innerHTML" actually get turned to text and communicated
  over to the chromium instance.
  When we feed puppeteer a function(like "el => el.innerHTML"), This function is
  NOT somehow being passed to chromium as a javascript function. Puppeteer internally
  turns it into a string then sends it over to the chromium instance. That string then
  gets turned back into an actual function, executed, and then whatever gets returned
  is turned into a string as well and communicated back over to our running nodeJS
  runtime.
  In short, that's why this API(this line of code) looks a little bit stranger, it's
  because of the way we are communicating with puppeteer behind the scenes.*/
  // NOTE: There is nothing special about the "$" in "$eval"
  const text = await page.getContentsOf('a.brand-logo');

  expect(text).toEqual("Blogster");
});


/* We're going to add another test statement to assert that if we click in the button
on the right hand side, it kicks us into the OAuth flow. */
/* "page.click()" is the function that we're going to use to somehow manipulate content
displyed on the screen.
In particular, we're going to want to attempt to click the "log in with google button"
that is located inside the header.
To use "page.click()", we call the function and pass in the selector of the element that
we want to click.*/
/* A way that we could assert that we have property have been kicked into our OAuth flow
is by looking the URL and writing an assertion that the "accounts.google.com" is present
inside the URL. // NOTE: we use "accounts.google.com" because it is consistent and not
likely to change overtime.*/
test('clicking login starts oauth flow', async () => {
  await page.click('.right a');
  // "page.url()" gets the url of the current page that chromium is currently looking at.
  const url = await page.url();

  // check to see if certain words are present in thew url.
  /* "toMatch()" is used any time that we want to check that a string contains some
  particular value. It's going to test some regular expression that we pass in as well.
  We're going to pass in a regular expression that's going to look for the
  text "accounts.google.com".*/
  expect(url).toMatch(/accounts\.google\.com/);
});

// Generating Sessions and Signatures:
/* We're going to say that we're going to attempt to sign into our application inside
of our test suite and then all we have to do is verify that a logout button appeard
inside the header. */
test('When signed in, shows logout button', async () => {
  // const id = '5be4660453f119cd583d4a2a';

  // we can now just use "page.login()" instead of writing out all the logic (moved to page.js)
  await page.login();

  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
  expect(text).toEqual('Logout');
});
