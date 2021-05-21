const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("when logged in", async () => {
  beforeEach(async () => {
    await page.login();

    await page.click("a.btn-floating");
  });

  it("shows form after login and clicking add blog", async () => {
    const label = await page.getContentsOf("form label");

    expect(label).toEqual("Blog Title");
  });

  describe("and using valid form inputs", async () => {
    beforeEach(async () => {
      await page.type('input[name="title"]', "test blog");
      await page.type('input[name="content"]', "test content");

      await page.click('button.teal[type="submit"]');
    });

    it("shows a confirmation page", async () => {
      const confirmationMessage = await page.getContentsOf("h5");

      expect(confirmationMessage).toEqual("Please confirm your entries");
    });
    it("shows the added blog after adding submit", async () => {
      await page.click("button.green");

      await page.waitFor(".card");

      const addedBlogTitle = await page.getContentsOf(".card-title");
      const addedBlogContent = await page.getContentsOf(".card-content p");

      expect(addedBlogTitle).toEqual("test blog");
      expect(addedBlogContent).toEqual("test content");
    });
  });

  describe("and using invalid form inputs", async () => {
    beforeEach(async () => {
      await page.click('button.teal[type="submit"]');
    });

    it("shows error messages below inputs", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("when not logged in", async () => {
  it("does not let user create blog post", async () => {
    const result = await page.evaluate(() => {
      return fetch("/api/blogs", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "test title", content: "test content" }),
      }).then((res) => res.json());
    });

    expect(result.error).toEqual("You must log in!");
  });

  it("does not let user get blog post", async () => {
    const result = await page.evaluate(() => {
      return fetch("/api/blogs", {
        method: "GET",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    });

    expect(result.error).toEqual("You must log in!");
  });
});
