import { test, expect } from '@playwright/test';

test.describe('플랜 선택 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 후 플랜 선택 페이지로 이동
    // TODO: 실제 인증 플로우가 완성되면 인증 로직 추가
    await page.goto('/payment/plans');
  });

  test('5.2.3: 사용자가 플랜 선택 가능', async ({ page }) => {
    // 플랜 카드들이 렌더링되는지 확인
    await expect(page.getByText('플랜 선택')).toBeVisible();
    await expect(page.getByText('사용량에 맞는 플랜을 선택하세요')).toBeVisible();

    // 모든 플랜 카드가 표시되는지 확인
    const planNames = ['무료', '라이트', '스탠다드', '프로', '무제한'];
    for (const planName of planNames) {
      await expect(page.getByText(planName)).toBeVisible();
    }

    // 라이트 플랜이 기본 선택되어 있는지 확인
    const lightPlanCard = page.locator('text=라이트').locator('..').locator('..');
    await expect(lightPlanCard).toHaveClass(/border-blue-500/);

    // 다른 플랜 클릭하여 선택 변경
    const standardPlan = page.locator('text=스탠다드').locator('..').locator('..').first();
    await standardPlan.click();

    // 스탠다드 플랜이 선택되었는지 확인
    await expect(standardPlan).toHaveClass(/border-blue-500/);

    // 블로그 수 선택 섹션이 표시되는지 확인 (무료 플랜이 아닌 경우)
    await expect(page.getByText('블로그 수 선택')).toBeVisible();

    // 블로그 수 선택 버튼들이 표시되는지 확인
    await expect(page.getByText('1개')).toBeVisible();
    await expect(page.getByText('2개')).toBeVisible();
    await expect(page.getByText('3개')).toBeVisible();

    // 블로그 수 변경
    const twoBlogsButton = page.getByText('2개').locator('..');
    await twoBlogsButton.click();

    // 선택된 블로그 수가 하이라이트되는지 확인
    await expect(twoBlogsButton).toHaveClass(/border-blue-500/);

    // 결제 요약 섹션에 선택한 정보가 표시되는지 확인
    await expect(page.getByText('스탠다드')).toBeVisible();
    await expect(page.getByText('2개 블로그')).toBeVisible();

    // 결제하기 버튼이 활성화되어 있는지 확인
    const checkoutButton = page.getByRole('button', { name: /결제하기/ });
    await expect(checkoutButton).toBeEnabled();

    // 결제하기 버튼 클릭 시 결제 페이지로 이동하는지 확인
    await checkoutButton.click();
    await expect(page).toHaveURL(/\/payment\/checkout/);
  });

  test('무료 플랜 선택 시 결제 버튼 비활성화', async ({ page }) => {
    // 무료 플랜 선택
    const freePlan = page.locator('text=무료').locator('..').locator('..').first();
    await freePlan.click();

    // 블로그 수 선택 섹션이 표시되지 않는지 확인
    await expect(page.getByText('블로그 수 선택')).not.toBeVisible();

    // 결제하기 버튼이 비활성화되어 있는지 확인
    const checkoutButton = page.getByRole('button', { name: /결제하기/ });
    await expect(checkoutButton).toBeDisabled();
  });

  test('플랜 카드 클릭 시 선택 상태 변경', async ({ page }) => {
    // 초기 상태: 라이트 플랜 선택됨
    const lightPlan = page.locator('text=라이트').locator('..').locator('..').first();
    await expect(lightPlan).toHaveClass(/border-blue-500/);

    // 프로 플랜 클릭
    const proPlan = page.locator('text=프로').locator('..').locator('..').first();
    await proPlan.click();

    // 프로 플랜이 선택되고 라이트 플랜은 선택 해제되는지 확인
    await expect(proPlan).toHaveClass(/border-blue-500/);
    await expect(lightPlan).not.toHaveClass(/border-blue-500/);
  });
});
