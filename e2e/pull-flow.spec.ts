import { expect, test, type Page } from "@playwright/test";

/**
 * The CTA ships in the server-rendered HTML, so it is clickable before the flow
 * island has hydrated and an early click is simply dropped. Retry until the
 * payment dialog actually opens instead of assuming the first click took.
 */
async function openPayment(page: Page) {
  const cta = page.getByRole("button", { name: "Start Now" }).first();
  const payment = page.getByRole("dialog", { name: "Review and pay" });
  await expect(async () => {
    await cta.click();
    await expect(payment).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
  return payment;
}

test("shows the odds and opens a dismissible payment review", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Odds" })).toBeVisible();
  const payment = await openPayment(page);

  await expect(payment.getByRole("button", { name: "Confirm" })).toBeVisible();

  await payment.getByRole("button", { name: "Close" }).click();
  await expect(payment).toBeHidden();
});

test("explains the odds in a dialog that closes again", async ({ page }) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "How odds work" });
  const dialog = page.getByRole("dialog", { name: "Odds" });
  await expect(async () => {
    await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });

  await expect(dialog.getByText("Fair market value", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("enters the preparation state after payment confirmation", async ({ page }) => {
  await page.goto("/");
  const payment = await openPayment(page);

  await payment.getByRole("button", { name: "Confirm" }).click();

  const preparing = page.getByRole("dialog", { name: "Preparing your pull" });
  await expect(preparing).toBeVisible();
  await expect(preparing.getByRole("progressbar", { name: "Preparing your pull" })).toBeVisible();
  await expect(preparing.getByText("Do Not Refresh")).toBeVisible();
});
