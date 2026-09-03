import { test, expect } from "@playwright/test";
import { openUserContext } from "../../pages/crossPlatform";
import {
  cleanupQaProjectByName,
  createProject,
  projectIdFromUrl,
  uniqueQaProjectName,
} from "../../pages/admin/projectsPage";
import {
  availabilityStatusInput,
  basePriceInput,
  carpetAreaInput,
  cleanupQaUnitByNumber,
  configurationInput,
  createUnit,
  openEditFromDetail,
  saveUnitChanges,
  uniqueQaUnitNumber,
} from "../../pages/admin/unitsPage";
import {
  factValue,
  projectName as userProjectHeading,
} from "../../pages/user/projectDetailsPage";

/**
 * Admin unit create/edit → public user project detail key facts
 * (Configuration / Area range / Price derived from inventory).
 */
test.describe("Admin → User unit visibility", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  let projectName = "";
  let projectId = "";
  let unitNumber = "";

  test.afterEach(async ({ page }) => {
    if (unitNumber) {
      await cleanupQaUnitByNumber(page, unitNumber);
      unitNumber = "";
    }
    if (projectName) {
      await cleanupQaProjectByName(page, projectName);
      projectName = "";
      projectId = "";
    }
  });

  test("XAPP-UNIT-001 — unit config, area, and price appear on user project detail @smoke", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    unitNumber = uniqueQaUnitNumber();

    await createProject(page, {
      name: projectName,
      city: "Ahmedabad",
      locality: "SG Highway",
    });
    projectId = projectIdFromUrl(page.url());

    await createUnit(page, {
      unitNumber,
      project: projectName,
      configuration: "3 BHK",
      availabilityStatus: "available",
      carpetArea: "1200",
      basePrice: "2500000",
    });

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      await expect(factValue(userPage, "Configuration")).toHaveText("3 BHK");
      await expect(factValue(userPage, "Area range")).toHaveText(/1200\s*sqft/i);
      await expect(factValue(userPage, "Price")).toHaveText(/25\.0\s*L/);
      await expect(userPage.getByText(/STARTING AT/i)).toBeVisible();
      await expect(userPage.getByText(/25\.0\s*L/).first()).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("XAPP-UNIT-002 — edited unit fields update user project detail", async ({
    page,
    browser,
  }) => {
    projectName = uniqueQaProjectName();
    unitNumber = uniqueQaUnitNumber();

    await createProject(page, {
      name: projectName,
      city: "Ahmedabad",
      locality: "SG Highway",
    });
    projectId = projectIdFromUrl(page.url());

    await createUnit(page, {
      unitNumber,
      project: projectName,
      configuration: "3 BHK",
      availabilityStatus: "available",
      carpetArea: "1200",
      basePrice: "2500000",
    });

    await openEditFromDetail(page);
    await configurationInput(page).fill("4 BHK");
    await availabilityStatusInput(page).fill("booked");
    await carpetAreaInput(page).fill("1500");
    await basePriceInput(page).fill("3500000");
    await saveUnitChanges(page);

    const { context, page: userPage } = await openUserContext(browser);
    try {
      await userPage.goto(`/p/${projectId}`);
      await expect(userProjectHeading(userPage)).toHaveText(projectName);
      await expect(factValue(userPage, "Configuration")).toHaveText("4 BHK");
      await expect(factValue(userPage, "Area range")).toHaveText(/1500\s*sqft/i);
      await expect(factValue(userPage, "Price")).toHaveText(/35\.0\s*L/);
    } finally {
      await context.close();
    }
  });
});
