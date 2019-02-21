const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000/blogs');
});

afterEach(async () => {
  await page.close();
});

// NOTE: selector classes start with “.”

describe('When logged in', async () => {
  // This beforeEach will be executed for all nested describe statements
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('can see blog create form', async () => {
    const label = await page.getContentsOf('form label');

    expect(label).toEqual('Blog Title');
  });



  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'My Title');
      await page.type('.content input', 'My Content')
      await page.click('form button');
    });

    test('Submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');

      expect(text).toEqual('Please confirm your entries');
    });

    test('Submitting then saving adds blog to index page', async() => {
      /* After we click on this button, which saves the blog posts, it takes some
      amount of time to automatically navigate over to that page and see that new
      blog post appear on the screen.
      So the rule of thumb here is that any time we make an ajax request to some
      backend api, which occurs when we click on this button, we will have to wait for
      that action to be completed. So we have to use a "waitFor" statement here
      because we are clicking on this button and we have to wait for that request
      to go to our backend server, save the post, and then the navigation to occur
      as well.*/
      await page.click('button.green');
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('My Title');
      expect(content).toEqual('My Content');
    });
  });



  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('the form shows an error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });
});




describe('User is not logged in', async() => {
  test('User cannot create blog posts', async() => {
    const result = await page.evaluate(() => {

        return fetch('/api/blogs', { // return the result of "fetch"
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: 'My Title', content: 'My Content' })
        }).then(res => res.json());

      }
    );
    expect(result).toEqual({ error: 'You must log in!' });
  });

  test('User cannot get a list of posts', async() => {
    const result = await page.evaluate(() => {
      return fetch('/api/blogs', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
      }).then(res => res.json());
    });
    expect(result).toEqual({ error: 'You must log in!' });
  });
});
