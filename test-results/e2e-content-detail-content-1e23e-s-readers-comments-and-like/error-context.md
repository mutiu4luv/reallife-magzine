# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-content-detail.spec.js >> content detail supports readers, comments, and like
- Location: e2e-content-detail.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'E2E News Story' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'E2E News Story' })

```

```yaml
- banner:
  - img "Logo"
  - button "Home"
  - button "About"
  - button "Services"
  - button "Contact"
  - button "Profile"
  - button "Blog"
  - button "News"
  - button "Events"
- link "Back":
  - /url: /news
- progressbar:
  - img
- progressbar:
  - img
- paragraph: RL
- paragraph: Loading Article
- paragraph: Fetching the full story from the backend.
- contentinfo:
  - paragraph: RealityLife Magazine
  - paragraph: Telling real stories that inspire, educate, and connect cultures. We spotlight authentic voices, leadership journeys, and impactful human experiences.
  - paragraph: Quick Links
  - link "Home":
    - /url: /home
  - link "About":
    - /url: /about
  - link "Gallery":
    - /url: /gallery
  - link "Contact":
    - /url: /contact
  - paragraph: Contact
  - paragraph: "Email: realitylifemagazine@gmail.com"
  - paragraph: "Phone: +234 706 612 2290"
  - link:
    - /url: https://www.facebook.com/share/1CUNo19Xzi/
  - link:
    - /url: https://x.com/realitylifemag?t=gUS7S5Z3qKFaC7YhmO8qAA&s=09
  - link:
    - /url: https://www.instagram.com/realitylifemag
  - link:
    - /url: https://www.youtube.com/@Realitylifemagazine
  - link:
    - /url: https://www.linkedin.com/in/oghenemairo-adegeye-a5a34892
  - link:
    - /url: https://wa.me/message/JW2BTKJVKKI6K1
  - link:
    - /url: mailto:realitylifemagazine@gmail.com
  - separator
  - paragraph: © 2026 RealityLife Magazine. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const storyId = "a13a9991-9018-4f5b-bf38-48ad261f66aa";
  4  | const storyUrl = `http://localhost:5175/news/${storyId}`;
  5  | 
  6  | test("content detail supports readers, comments, and like", async ({ page }) => {
  7  |   await page.goto(storyUrl, { waitUntil: "networkidle" });
  8  | 
> 9  |   await expect(page.getByRole("heading", { name: "E2E News Story" })).toBeVisible();
     |                                                                       ^ Error: expect(locator).toBeVisible() failed
  10 |   await expect(page.getByText("Story details")).toBeVisible();
  11 |   await expect(page.getByText("Readers")).toBeVisible();
  12 | 
  13 |   await page.getByLabel("Your name").fill("Playwright Viewer");
  14 |   await page.getByLabel("Write a comment").fill("Playwright E2E comment");
  15 |   await page.getByRole("button", { name: "Post comment" }).click();
  16 | 
  17 |   await expect(page.getByText("Comment posted.")).toBeVisible();
  18 |   await expect(page.getByText("Playwright Viewer")).toBeVisible();
  19 |   await expect(page.getByText("Playwright E2E comment")).toBeVisible();
  20 | 
  21 |   await page.locator("button:has(svg)").last().click();
  22 |   await expect(page.getByText("1").first()).toBeVisible();
  23 | });
  24 | 
```