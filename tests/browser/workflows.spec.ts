import { test, expect, type BrowserContext } from "@playwright/test";
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    for (const role of [
      "chairman",
      "principal",
      "teacher",
      "student",
      "parent",
      "ustadh",
      "finance",
    ])
      localStorage.setItem(`sanad.tour.${role}`, "done");
  });
});
async function seat(context: BrowserContext, persona: string) {
  await context.addCookies([
    {
      name: "persona",
      value: persona,
      url: process.env.SANAD_TEST_URL ?? "http://127.0.0.1:3214",
    },
  ]);
}

test("principal finance, mobile navigation and read-only assistant", async ({
  page,
  context,
}) => {
  await seat(context, "principal-gulberg");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/portal/finance");
  await expect(
    page.getByRole("heading", { name: "Every rupee, accounted for" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Payroll", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "September payroll" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page.getByRole("button", { name: "Summarise finance" }).click();
  await expect(
    page.getByText(/Finance summary \(fictional records/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close assistant" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(
    page
      .getByRole("dialog", { name: "All sections" })
      .getByRole("link", { name: "Access locks" }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "All sections" })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/finance-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("expense approval separates maker and reviewer and prevents repeat payment", async ({
  context,
  page,
}) => {
  await seat(context, "finance-gulberg");
  const created = await context.request.post("/api/finance", {
    data: {
      action: "create",
      vendor: "QA supplier",
      description: "Books for lower primary",
      category: "Learning materials",
      amount: 1234,
    },
  });
  expect(created.ok()).toBeTruthy();
  const { id } = await created.json();
  expect(
    (
      await context.request.post("/api/finance", {
        data: { id, action: "approve" },
      })
    ).status(),
  ).toBe(400);
  await seat(context, "principal-gulberg");
  expect(
    (
      await context.request.post("/api/finance", {
        data: { id, action: "approve" },
      })
    ).ok(),
  ).toBeTruthy();
  await seat(context, "finance-gulberg");
  expect(
    (
      await context.request.post("/api/finance", {
        data: { id, action: "pay" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await context.request.post("/api/finance", {
        data: { id, action: "pay" },
      })
    ).status(),
  ).toBe(400);
  await page.goto("/portal/finance");
  await page.getByRole("button", { name: "Expenses", exact: true }).click();
  await expect(page.getByText("QA supplier ·", { exact: false })).toBeVisible();
  expect(
    (await context.request.get("/api/finance?export=csv")).headers()[
      "content-type"
    ],
  ).toContain("text/csv");
});

test("appraisal review and teacher response", async ({ page, context }) => {
  await seat(context, "principal-gulberg");
  await page.goto("/portal/hr");
  await page.getByLabel("Staff member").selectOption("review-t-hina-raza");
  await page
    .getByRole("button", { name: "Finalise review & notify teacher" })
    .click();
  await expect(page.getByText("reviewed", { exact: true })).toBeVisible();
  await seat(context, "teacher-maths");
  await page.goto("/portal/hr");
  await page
    .getByLabel("Your response · acknowledgement is not agreement")
    .fill("I will bring annotated work samples to our next review.");
  await page
    .getByRole("button", { name: "Submit response & acknowledge" })
    .click();
  await expect(page.getByText("acknowledged", { exact: true })).toBeVisible();
});

test("primary draft, publication, observation and learner view", async ({
  page,
  context,
}) => {
  await seat(context, "teacher-primary");
  await page.goto("/portal/teaching");
  await page
    .getByRole("combobox", { name: "Class", exact: true })
    .selectOption("gulberg-g3a");
  await page
    .getByRole("button", { name: "Create editable lesson draft" })
    .click();
  await page
    .getByRole("textbox", { name: "Lesson title", exact: true })
    .fill("QA number bonds lesson");
  await page.getByRole("button", { name: "Publish reviewed lesson" }).click();
  await expect(
    page.getByRole("heading", { name: "QA number bonds lesson" }),
  ).toBeVisible();
  await page
    .getByLabel("What did the learner do?")
    .fill("Used counters independently to show two groups totalling ten.");
  await page.getByRole("button", { name: "Save observation" }).click();
  await expect(
    page.getByText(
      "Used counters independently to show two groups totalling ten.",
    ),
  ).toBeVisible();
  await seat(context, "student-primary");
  await page.goto("/portal/learning");
  await expect(
    page.getByRole("heading", { name: "QA number bonds lesson" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Used counters independently to show two groups totalling ten.",
    ),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("assistant confirms draft tool and role boundaries hold", async ({
  page,
  context,
}) => {
  await seat(context, "teacher-montessori");
  await page.goto("/portal/teaching");
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page
    .getByRole("button", { name: "Create lesson draft", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm: create draft" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm: create draft" }).click();
  await expect(
    page.getByText(/Created an editable lesson draft/),
  ).toBeVisible();
  await seat(context, "student-primary");
  expect((await context.request.get("/api/finance")).status()).toBe(403);
  expect(
    (
      await context.request.post("/api/hr", { data: { action: "review" } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post("/api/assess/papers", {
        data: { code: "4024" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post("/api/assistant", {
        data: {
          execute: "create_lesson_draft",
          confirmed: true,
          classId: "gulberg-g3a",
        },
      })
    ).status(),
  ).toBe(400);
});

test("Hifz untranscribed audio is not simulated assessment", async ({
  context,
  page,
}) => {
  await seat(context, "student-zaid");
  const unavailable = await context.request.post("/api/hifz/check", {
    data: { mode: "audio", surah: 1, from: 1, to: 7 },
  });
  expect(unavailable.status()).toBe(422);
  expect((await unavailable.json()).error).toContain("No score was created");
  const simulated = await context.request.post("/api/hifz/check", {
    data: { mode: "simulated", surah: 1, from: 1, to: 7, variant: "perfect" },
  });
  expect(simulated.ok()).toBeTruthy();
  const result = await simulated.json();
  expect(result.result.source).toBe("simulated");
  expect(result.unit).toBeNull();
  await page.goto("/portal/hifz/recite");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
