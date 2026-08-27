import { test, expect, type Page } from "@playwright/test";
import { anonymousStorageState, signOut } from "../../../pages/user/auth";

// Real login/logout coverage must start without a reused session.
test.use({ storageState: anonymousStorageState });

const TEST_USER_EMAIL =
  process.env.TEST_USER_EMAIL || process.env.TEST_EMAIL;
const TEST_USER_PASSWORD =
  process.env.TEST_USER_PASSWORD || process.env.TEST_PASSWORD;

function requireCreds() {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error("Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env");
  }
  return {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };
}

function emailInput(page: Page) {
  return page.getByLabel("Email");
}

function passwordInput(page: Page) {
  return page.getByPlaceholder("At least 8 characters");
}

function signInButton(page: Page) {
  return page.getByRole("button", { name: "Sign in" });
}

function headerSignInLink(page: Page) {
  return page.getByRole("banner").getByRole("link", { name: "Sign in" });
}

async function openLogin(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
}

async function fillLogin(page: Page, email: string, password: string) {
  await emailInput(page).fill(email);
  await passwordInput(page).fill(password);
}

async function expectLoggedIn(page: Page) {
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
  await expect(headerSignInLink(page)).toHaveCount(0);
  await expect(page.getByRole("banner").locator('a[href="/profile"]')).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => /auth-token/i.test(cookie.name))).toBeTruthy();
}

async function expectOnLoginPage(page: Page) {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
}

async function expectLoginError(page: Page) {
  await expectOnLoginPage(page);
  await expect(page.getByText("Invalid login credentials")).toBeVisible({
    timeout: 15_000,
  });
  await expect(headerSignInLink(page)).toBeVisible();
}

async function nativeValidity(
  locator: ReturnType<Page["getByLabel"]>,
): Promise<Pick<ValidityState, "valid" | "valueMissing" | "typeMismatch" | "tooShort">> {
  return locator.evaluate((el) => {
    const input = el as HTMLInputElement;
    return {
      valid: input.validity.valid,
      valueMissing: input.validity.valueMissing,
      typeMismatch: input.validity.typeMismatch,
      tooShort: input.validity.tooShort,
    };
  });
}

test.describe("Login", () => {
  test.describe.configure({ timeout: 45_000, mode: "serial" });
  test.describe("Login page / UI", () => {
    test("LOGIN-UI — login page loads with email, password, and sign-in controls", async ({
      page,
    }) => {
      await openLogin(page);

      await expect(page).toHaveTitle(/Sign in/i);
      await expect(emailInput(page)).toBeVisible();
      await expect(passwordInput(page)).toBeVisible();
      await expect(signInButton(page)).toBeVisible();
      await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Email" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Mobile OTP" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Show password" })).toBeVisible();
    });

    test("LOGIN-UI — email and password fields accept input", async ({ page }) => {
      await openLogin(page);

      await emailInput(page).fill("buyer@example.com");
      await passwordInput(page).fill("sample-pass");

      await expect(emailInput(page)).toHaveValue("buyer@example.com");
      await expect(passwordInput(page)).toHaveValue("sample-pass");
    });

    test("LOGIN-011 — password characters are masked", async ({ page }) => {
      await openLogin(page);

      await passwordInput(page).fill("sample-pass");
      await expect(passwordInput(page)).toHaveAttribute("type", "password");
      await expect(passwordInput(page)).not.toHaveAttribute("type", "text");
    });

    test("LOGIN-UI — show password reveals the typed value", async ({ page }) => {
      await openLogin(page);

      await passwordInput(page).fill("sample-pass");
      await page.getByRole("button", { name: "Show password" }).click();

      await expect(passwordInput(page)).toHaveAttribute("type", "text");
      await expect(passwordInput(page)).toHaveValue("sample-pass");
      await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();
    });

    test("LOGIN-UI — Sign in stays enabled when fields are empty", async ({
      page,
    }) => {
      await openLogin(page);

      // Observed UI: the button is enabled; empty submit is blocked by HTML5 required.
      await expect(signInButton(page)).toBeEnabled();
    });

    test("LOGIN-UI — Mobile OTP tab shows phone field and Send OTP", async ({
      page,
    }) => {
      await openLogin(page);

      await page.getByRole("button", { name: "Mobile OTP" }).click();

      await expect(page.getByLabel("Mobile number")).toBeVisible();
      await expect(page.getByPlaceholder("10-digit mobile")).toBeVisible();
      await expect(page.getByRole("button", { name: "Send OTP" })).toBeVisible();
      await expect(signInButton(page)).toHaveCount(0);
    });

    // Blocked E2E OTP: no TEST_OTP_PHONE / TEST_OTP_CODE (or route-mock) harness
    // in .env. Keep UI assertions above; do not invent a fake OTP success path.
    test("LOGIN-OTP — full Mobile OTP login is blocked without OTP harness", async () => {
      test.skip(
        true,
        "No OTP test strategy (env phone+code or route mocking). UI tab coverage remains in LOGIN-UI Mobile OTP.",
      );
    });
  });

  test.describe("Successful login", () => {
    test("LOGIN-001 — user can login with valid credentials @smoke", async ({ page }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click();

      await expectLoggedIn(page);
      await expect(page.getByText("Invalid login credentials")).toHaveCount(0);
    });

    test("LOGIN-002 — user can submit login using Enter", async ({ page }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await passwordInput(page).press("Enter");

      await expectLoggedIn(page);
    });

    test("LOGIN-005 — email with leading and trailing spaces still logs in", async ({
      page,
    }) => {
      const { email, password } = requireCreds();
      await openLogin(page);

      await emailInput(page).click();
      await emailInput(page).pressSequentially(`  ${email}  `);
      await passwordInput(page).fill(password);
      await signInButton(page).click();

      await expectLoggedIn(page);
    });

    test("LOGIN-006 — uppercase email still logs in", async ({ page }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email.toUpperCase(), password);
      await signInButton(page).click();

      await expectLoggedIn(page);
    });
  });

  test.describe("Email validation", () => {
    test("LOGIN-003 — email validation appears when email is empty", async ({
      page,
    }) => {
      const { password } = requireCreds();
      await openLogin(page);
      await passwordInput(page).fill(password);
      await signInButton(page).click();

      await expectOnLoginPage(page);
      const validity = await nativeValidity(emailInput(page));
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
    });

    for (const invalidEmail of ["abc", "abc@", "abc.com@", "@domain.com"]) {
      test(`LOGIN-004 — invalid email format is rejected (${invalidEmail})`, async ({
        page,
      }) => {
        const { password } = requireCreds();
        await openLogin(page);
        await fillLogin(page, invalidEmail, password);
        await signInButton(page).click();

        await expectOnLoginPage(page);
        const validity = await nativeValidity(emailInput(page));
        expect(validity.valid).toBe(false);
        expect(validity.typeMismatch).toBe(true);
      });
    }

    test("LOGIN-007 — very long email does not break the login page", async ({
      page,
    }) => {
      const { password } = requireCreds();
      const longEmail = `${"a".repeat(300)}@example.com`;
      await openLogin(page);
      await fillLogin(page, longEmail, password);
      await signInButton(page).click();

      await expectOnLoginPage(page);
      await expect(emailInput(page)).toBeVisible();
      await expect(signInButton(page)).toBeVisible();
    });

    test("LOGIN-013 — invalid email with valid password does not log in", async ({
      page,
    }) => {
      const { password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, "nobody-qa@example.com", password);
      await signInButton(page).click();

      await expectLoginError(page);
    });
  });

  test.describe("Password validation", () => {
    test("LOGIN-008 — password validation appears when password is empty", async ({
      page,
    }) => {
      const { email } = requireCreds();
      await openLogin(page);
      await emailInput(page).fill(email);
      await signInButton(page).click();

      await expectOnLoginPage(page);
      const validity = await nativeValidity(passwordInput(page));
      expect(validity.valueMissing).toBe(true);
      expect(validity.valid).toBe(false);
    });

    test("LOGIN-009 — incorrect password prevents login", async ({ page }) => {
      const { email } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, "WrongPass123!");
      await signInButton(page).click();

      await expectLoginError(page);
    });

    test("LOGIN-010 — password with special characters is submitted", async ({
      page,
    }) => {
      const { email } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, "P@ssw0rd!#");
      await signInButton(page).click();

      // This account's password is not this value; the field must still submit it.
      await expectLoginError(page);
    });
  });

  test.describe("Invalid credential combinations", () => {
    test("LOGIN-012 — valid email and wrong password stays on login", async ({
      page,
    }) => {
      const { email } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, "NotThePassword1");
      await signInButton(page).click();

      await expectLoginError(page);
    });

    test("LOGIN-014 — invalid email and invalid password does not log in", async ({
      page,
    }) => {
      await openLogin(page);
      await fillLogin(page, "nobody-qa@example.com", "WrongPass123!");
      await signInButton(page).click();

      await expectLoginError(page);
    });

    test("LOGIN-015 — non-existing user cannot authenticate", async ({ page }) => {
      await openLogin(page);
      await fillLogin(page, "no-such-user-qa@example.com", "SomePass1234");
      await signInButton(page).click();

      await expectLoginError(page);
    });

    test("LOGIN-021 — invalid credentials error is shown and login fails", async ({
      page,
    }) => {
      const { email } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, "WrongPass123!");
      await signInButton(page).click();

      await expect(page.getByText("Invalid login credentials")).toBeVisible();
      await expectOnLoginPage(page);
      await expect(
        page.getByRole("heading", { name: "Discover your next home, verified." }),
      ).toHaveCount(0);
    });
  });

  test.describe("Login button behavior", () => {
    test("LOGIN-016 — both fields empty stay on login with required validation", async ({
      page,
    }) => {
      await openLogin(page);
      await signInButton(page).click();

      await expectOnLoginPage(page);
      const emailValidity = await nativeValidity(emailInput(page));
      expect(emailValidity.valueMissing).toBe(true);
      expect(emailValidity.valid).toBe(false);
    });

    test("LOGIN-017 — email filled and password empty shows password validation", async ({
      page,
    }) => {
      const { email } = requireCreds();
      await openLogin(page);
      await emailInput(page).fill(email);
      await signInButton(page).click();

      await expectOnLoginPage(page);
      const validity = await nativeValidity(passwordInput(page));
      expect(validity.valueMissing).toBe(true);
    });

    test("LOGIN-018 — password filled and email empty shows email validation", async ({
      page,
    }) => {
      const { password } = requireCreds();
      await openLogin(page);
      await passwordInput(page).fill(password);
      await signInButton(page).click();

      await expectOnLoginPage(page);
      const validity = await nativeValidity(emailInput(page));
      expect(validity.valueMissing).toBe(true);
    });

    test("LOGIN-019 — multiple Sign in clicks still result in a single login", async ({
      page,
    }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, password);

      await signInButton(page).click();
      await signInButton(page)
        .click({ timeout: 1000 })
        .catch(() => {
          // Button may already be in a loading state or navigation started.
        });

      await expectLoggedIn(page);
    });

    test("LOGIN-020 — Sign in shows a loading state while authenticating", async ({
      page,
    }) => {
      const { email, password } = requireCreds();

      let delayedPost = false;
      await page.route("**/login", async (route) => {
        if (route.request().method() === "POST" && !delayedPost) {
          delayedPost = true;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        await route.continue();
      });

      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click({ noWaitAfter: true });

      await expect(page.locator('form button[type="submit"]')).toBeDisabled();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
      await expectLoggedIn(page);
    });
  });

  test.describe("API and network failures", () => {
    test("LOGIN-022 — authentication API failure does not crash the login page", async ({
      page,
    }) => {
      const { email, password } = requireCreds();

      await page.route("**/login", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ ok: false, error: "Internal server error" }),
          });
          return;
        }
        await route.continue();
      });

      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click();

      // Observed UI: POST /login 500 is caught by the page error boundary.
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { name: "Something broke" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
      await expect(headerSignInLink(page)).toBeVisible();
    });

    test("LOGIN-023 — network failure during login is handled without leaving login", async ({
      page,
    }) => {
      const { email, password } = requireCreds();

      await page.route("**/login", async (route) => {
        if (route.request().method() === "POST") {
          await route.abort("internetdisconnected");
          return;
        }
        await route.continue();
      });

      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click({ noWaitAfter: true });

      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /Welcome back|Something broke/ }),
      ).toBeVisible();
      await expect(headerSignInLink(page)).toBeVisible();
    });
  });

  test.describe("Forgot password", () => {
    test("LOGIN-024 — Forgot password opens the reset page", async ({ page }) => {
      await openLogin(page);
      await page.getByRole("link", { name: "Forgot password?" }).click();

      await expect(page).toHaveURL(/\/forgot-password/);
      await expect(
        page.getByRole("heading", { name: "Reset your password" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
    });

    test("LOGIN-025 — Send reset link stays disabled when email is empty", async ({
      page,
    }) => {
      await page.goto("/forgot-password");

      await expect(page.getByLabel("Email")).toHaveValue("");
      await expect(page.getByRole("button", { name: "Send reset link" })).toBeDisabled();
    });

    test("LOGIN-026 — invalid forgot-password email is rejected", async ({
      page,
    }) => {
      await page.goto("/forgot-password");
      await page.getByLabel("Email").fill("abc");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(page).toHaveURL(/\/forgot-password/);
      const validity = await nativeValidity(page.getByLabel("Email"));
      expect(validity.valid).toBe(false);
      expect(validity.typeMismatch).toBe(true);
      await expect(page.getByText("Check your inbox")).toHaveCount(0);
    });

    test("LOGIN-027 — valid forgot-password email shows confirmation", async ({
      page,
    }) => {
      await page.goto("/forgot-password");
      await page.getByLabel("Email").fill("qa-reset@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(page.getByText("Check your inbox")).toBeVisible();
      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });

  test.describe("Sign up", () => {
    test("LOGIN-028 — Sign up navigates to the registration page", async ({
      page,
    }) => {
      await openLogin(page);
      await page.getByRole("link", { name: "Sign up" }).click();

      await expect(page).toHaveURL(/\/signup/);
      await expect(
        page.getByRole("heading", { name: "Create your account" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    });
  });

  test.describe("Authentication / session", () => {
    test("LOGIN-029 — protected route without login redirects to login", async ({
      page,
    }) => {
      await page.goto("/profile");

      await expect(page).toHaveURL(/\/login\?next=/);
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    });

    test("LOGIN-030 — session remains after refresh", async ({ page }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click();
      await expectLoggedIn(page);

      await page.reload();

      await expectLoggedIn(page);
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile/);
      await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    });

    test("LOGIN-031 — logout returns the user to a logged-out state", async ({
      page,
    }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click();
      await expectLoggedIn(page);

      await signOut(page);

      await expect(headerSignInLink(page)).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole("heading", { name: "Discover your next home, verified." }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
    });

    test("LOGIN-032 — protected route after logout redirects to login", async ({
      page,
    }) => {
      const { email, password } = requireCreds();
      await openLogin(page);
      await fillLogin(page, email, password);
      await signInButton(page).click();
      await expectLoggedIn(page);

      await signOut(page);
      await expect(headerSignInLink(page)).toBeVisible({ timeout: 15_000 });

      await page.goto("/profile");
      await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    });
  });
});
