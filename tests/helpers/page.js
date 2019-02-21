const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property] || browser[property] || page[property]; // "browser[property]" must come before "page[property]"
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();

    const { session, sig } = sessionFactory(user);

    // Assembling the Pieces
    // How we manipulate cookies on a running browser instance
    // use the "setCookie" function to set a new cookie on our page.
    /* We then have to pass in a name property and the value for it as well.
    // NOTE: Whenever we define a value inside of a cookie we are defining a
    key-value pair. So we have to actually specify the name of the cookie we want to use.*/
    // we'll give it a name of 'session' and the value will be our session string.
    // NOTE: 'session' and 'session.sig' are the expected names coming from the request
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    /* After we set the cookies we have to refresh the page. We're going to refresh the
    page so it simulates us actually logging into the application. If we just set the
    cookies, it's not going to actually change any of the content on the screen.*/
    await this.page.goto('http://localhost:3000/blogs');
    /*When we call “waitFor”, we pass in a selector for some element, puppeteer we’ll
    then wait until it is able to see that element on the screen and once it is actually
    visible, it will then resume execution of all of the other steps that we have laid
    out for it.*/
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  /* We're going to make a new function whose sole purpose is going to be to make
  that "$eval" function more clear than it is right now.
  So we're going to say "async getContentsOf()" and we're going to call it
  with a "selector".*/
  /* So the idea here is that rather than calling "$eval" or any of thaty nasty stuff,
  we're just going to just have to call this "getContentsOf" function and we're going
  to pass in only the selector and then inside this function we'll take care of all
  the things neccessary to clear up the "$eval" stuff.
  So now back inside of "header.test.js", we can just put "await page.getContentsOf('a.brand-logo')"*/
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }
}

module.exports = CustomPage;
