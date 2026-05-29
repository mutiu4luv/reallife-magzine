import { test, expect } from "@playwright/test";

const storyId = "a13a9991-9018-4f5b-bf38-48ad261f66aa";
const storyUrl = `http://localhost:5175/news/${storyId}`;

test("content detail supports readers, comments, and like", async ({ page }) => {
  await page.goto(storyUrl, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "E2E News Story" })).toBeVisible();
  await expect(page.getByText("Story details")).toBeVisible();
  await expect(page.getByText("Readers")).toBeVisible();

  await page.getByLabel("Your name").fill("Playwright Viewer");
  await page.getByLabel("Write a comment").fill("Playwright E2E comment");
  await page.getByRole("button", { name: "Post comment" }).click();

  await expect(page.getByText("Comment posted.")).toBeVisible();
  await expect(page.getByText("Playwright Viewer")).toBeVisible();
  await expect(page.getByText("Playwright E2E comment")).toBeVisible();

  await page.locator("button:has(svg)").last().click();
  await expect(page.getByText("1").first()).toBeVisible();
});
