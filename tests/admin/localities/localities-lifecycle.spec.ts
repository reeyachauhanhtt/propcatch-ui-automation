import { test, expect } from "@playwright/test";
import {
  cleanupQaProjectByName,
  createProject,
  localitySelect,
  openNewProject,
  uniqueQaProjectName,
} from "../../../pages/admin/projectsPage";
import {
  applyLocalityFilters,
  createLocality,
  localityRowByName,
  openLocalities,
  setLocalityActive,
  uniqueQaLocalityName,
} from "../../../pages/admin/localitiesPage";

/**
 * Localities cannot be deleted. The cleanup leaves each QA locality inactive,
 * so it is hidden by the normal active-only project-locality dropdown.
 */
test.describe("Admin Localities create, status, and Project visibility", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  let localityName = "";
  let projectName = "";

  test.afterEach(async ({ page }) => {
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
    }
    if (localityName) {
      await openLocalities(page);
      await applyLocalityFilters(page, { name: localityName });
      if ((await localityRowByName(page, localityName).count()) > 0) {
        await setLocalityActive(page, localityName, false);
      }
      localityName = "";
    }
  });

  test("ADMIN-LOCALITIES-070 — new locality is visible in new and edit Project locality dropdowns @smoke", async ({
    page,
  }) => {
    localityName = uniqueQaLocalityName();
    projectName = uniqueQaProjectName("Locality");
    await openLocalities(page);
    await createLocality(page, {
      city: "Ahmedabad · Gujarat",
      name: localityName,
    });

    await createProject(page, {
      name: projectName,
      city: "Ahmedabad",
      locality: localityName,
    });
    await expect(localitySelect(page).locator("option:checked")).toHaveText(
      localityName,
    );

    await openNewProject(page);
    await page.locator("#city_id").selectOption({ label: "Ahmedabad" });
    await expect(
      localitySelect(page).getByRole("option", { name: localityName, exact: true }),
    ).toBeAttached({ timeout: 15_000 });
  });

  test("ADMIN-LOCALITIES-071 — a QA locality can be deactivated and reactivated", async ({
    page,
  }) => {
    localityName = uniqueQaLocalityName();
    await openLocalities(page);
    await createLocality(page, {
      city: "Ahmedabad · Gujarat",
      name: localityName,
    });

    await setLocalityActive(page, localityName, false);
    await setLocalityActive(page, localityName, true);
    await expect(localityRowByName(page, localityName)).toHaveAttribute(
      "data-active",
      "true",
    );
  });
});
