import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test("renders the Engineering Ecosystem dashboard", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "EQ-LABS Engineering Ecosystem",
      }),
    ).toBeVisible();

    await expect(page.getByText("Dashboard")).toBeVisible();
  });
});
