import { expect, test } from "@playwright/test";

test("shows the odds and opens a dismissible payment review", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Odds" })).toBeVisible();
  await page.getByRole("button", { name: "Start Now" }).click();

  const payment = page.getByRole("dialog", { name: "Review and pay" });
  await expect(payment).toBeVisible();
  await expect(payment.getByRole("button", { name: "Confirm" })).toBeVisible();

  await payment.getByRole("button", { name: "Close" }).click();
  await expect(payment).toBeHidden();
});

test("enters the preparation state after payment confirmation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Now" }).click();

  const payment = page.getByRole("dialog", { name: "Review and pay" });
  await payment.getByRole("button", { name: "Confirm" }).click();

  const preparing = page.getByRole("dialog", { name: "Preparing your pull" });
  await expect(preparing).toBeVisible();
  await expect(preparing.getByRole("progressbar", { name: "Preparing your pull" })).toBeVisible();
  await expect(preparing.getByText("Do Not Refresh")).toBeVisible();
});
