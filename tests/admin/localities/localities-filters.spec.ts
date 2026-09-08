import { test, expect } from "@playwright/test";
import {
  applyLocalityFilters,
  filterCitySelect,
  localityRows,
  openLocalities,
  resetLocalityFilters,
} from "../../../pages/admin/localitiesPage";

test.describe("Admin Localities filters", () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    await openLocalities(page);
  });

  test("ADMIN-LOCALITIES-020 — city filter returns only localities in that city @smoke", async ({
    page,
  }) => {
    await applyLocalityFilters(page, { city: "Surat · Gujarat" });

    await expect(filterCitySelect(page).locator("option:checked")).toHaveText(
      "Surat · Gujarat",
    );
    expect(await localityRows(page).count()).toBeGreaterThan(0);
    const cities = await localityRows(page).locator("td:nth-child(2)").allInnerTexts();
    for (const city of cities) {
      expect(city.trim()).toBe("Surat");
    }
  });

  test("ADMIN-LOCALITIES-021 — name filter narrows the list", async ({ page }) => {
    await applyLocalityFilters(page, { name: "Piplod" });

    expect(await localityRows(page).count()).toBe(1);
    await expect(localityRows(page).first()).toContainText("Piplod");
  });

  test("ADMIN-LOCALITIES-022 — Hide inactive removes inactive localities", async ({
    page,
  }) => {
    await applyLocalityFilters(page, { hideInactive: true });

    const statuses = await localityRows(page).locator("td:nth-child(5)").allInnerTexts();
    for (const status of statuses) {
      expect(status.trim()).toBe("Active");
    }
  });

  test("ADMIN-LOCALITIES-023 — Reset clears city, name, and Hide inactive filters @smoke", async ({
    page,
  }) => {
    await applyLocalityFilters(page, {
      city: "Surat · Gujarat",
      name: "Piplod",
      hideInactive: true,
    });

    await resetLocalityFilters(page);

    await expect(filterCitySelect(page).locator("option:checked")).toHaveText(
      "All cities",
    );
    expect(await localityRows(page).count()).toBeGreaterThan(1);
  });
});
