const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("can see blog create form", async () => {
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using valid inputs", async () => {
    beforeEach(async () => {
      await page.type(".title input", "my title test");
      await page.type(".content input", "my content test");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const confirmTitle = await page.getContentsOf("h5");
      expect(confirmTitle).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");
      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");
      expect(title).toEqual("my title test");
      expect(content).toEqual("my content test");
    });
  });

  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("the form shows an error message", async () => {
      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("User is not logged in", async () => {
  const actions = [
    {
      method: "get",
      path: "/api/blogs"
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "title",
        content: "content"
      }
    }
  ];

  //   xtest("User cannot create blog posts", async () => {
  //     const result = await page.post("/api/blogs", {
  //       title: "My title",
  //       content: "My content"
  //     });
  //     expect(result).toEqual({ error: "You must log in!" });
  //   });

  //   xtest("User cannot get a list of blogs", async () => {
  //     const result = await page.get("/api/blogs");
  //     expect(result).toEqual({ error: "You must log in!" });
  //   });

  test("Blog related actions are prohibited", async () => {
    const results = await page.execRequests(actions);
    for (let result of results) {
      expect(result).toEqual({ error: "You must log in!" });
    }
  });
});
