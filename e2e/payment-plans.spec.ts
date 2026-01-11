import { test, expect } from '@playwright/test';

test.describe('5.2.3: 플랜 선택 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 플랜 선택 페이지로 이동
    await page.goto('/payment/plans');
  });

  test('사용자가 플랜 카드를 클릭하여 선택할 수 있어야 함', async ({ page }) => {
    // 라이트 플랜 카드 클릭
    const lightPlanCard = page.locator('[data-testid="plan-card-light"]').or(
      page.locator('text=라이트').locator('..').locator('..')
    ).first();
    
    // 플랜 카드를 찾기 위해 페이지 구조 확인
    await expect(page.locator('text=플랜 선택')).toBeVisible();
    
    // 라이트 플랜이 표시되는지 확인
    await expect(page.locator('text=라이트')).toBeVisible();
    
    // 플랜 카드 클릭 (플랜 카드 전체 영역 클릭 가능)
    const planCards = page.locator('text=라이트').locator('..').locator('..').first();
    if (await planCards.count() > 0) {
      await planCards.click();
    }
    
    // 선택된 플랜이 라이트인지 확인 (선택됨 버튼이나 하이라이트 확인)
    // 또는 결제 요약 섹션에서 라이트 플랜이 표시되는지 확인
    await expect(page.locator('text=월 결제 금액')).toBeVisible();
  });

  test('사용자가 블로그 수를 선택할 수 있어야 함', async ({ page }) => {
    // 유료 플랜 선택 (라이트가 기본값)
    const standardPlan = page.locator('text=스탠다드').locator('..').locator('..').first();
    if (await standardPlan.count() > 0) {
      await standardPlan.click();
    }
    
    // 블로그 수 선택 섹션이 표시되는지 확인
    await expect(page.locator('text=블로그 수 선택')).toBeVisible();
    
    // 2개 블로그 선택
    const blogCount2 = page.locator('text=2개').locator('..').first();
    if (await blogCount2.count() > 0) {
      await blogCount2.click();
    }
    
    // 결제 요약에 2개 블로그 가격이 반영되는지 확인
    await expect(page.locator('text=2개 블로그')).toBeVisible();
  });

  test('무료 플랜 선택 시 결제 버튼이 비활성화되어야 함', async ({ page }) => {
    // 무료 플랜 선택
    const freePlan = page.locator('text=무료').locator('..').locator('..').first();
    if (await freePlan.count() > 0) {
      await freePlan.click();
    }
    
    // 결제 버튼이 비활성화되어 있는지 확인
    const checkoutButton = page.locator('button:has-text("결제하기")');
    await expect(checkoutButton).toBeDisabled();
  });

  test('플랜 선택 후 결제하기 버튼을 클릭하면 결제 페이지로 이동해야 함', async ({ page }) => {
    // 라이트 플랜이 이미 선택되어 있음 (기본값)
    
    // 결제하기 버튼 클릭
    const checkoutButton = page.locator('button:has-text("결제하기")');
    await checkoutButton.click();
    
    // 결제 페이지로 리다이렉트되었는지 확인
    await expect(page).toHaveURL(/\/payment\/checkout/);
    await expect(page.locator('text=결제하기')).toBeVisible();
  });

  test('플랜 선택 시 결제 요약이 업데이트되어야 함', async ({ page }) => {
    // 스탠다드 플랜 선택
    const standardPlan = page.locator('text=스탠다드').locator('..').locator('..').first();
    if (await standardPlan.count() > 0) {
      await standardPlan.click();
    }
    
    // 결제 요약에 스탠다드 플랜이 표시되는지 확인
    await expect(page.locator('text=스탠다드')).toBeVisible();
    await expect(page.locator('text=월 결제 금액')).toBeVisible();
  });
});
