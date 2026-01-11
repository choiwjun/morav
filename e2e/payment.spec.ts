import { test, expect } from '@playwright/test';

test.describe('결제 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 실제 인증 구현 후 로그인 처리
    // await page.goto('/auth/login');
    // await page.fill('input[type="email"]', 'test@example.com');
    // await page.fill('input[type="password"]', 'password123');
    // await page.click('button[type="submit"]');
    // await page.waitForURL('/dashboard');
  });

  test('5.2.3: 사용자가 플랜 선택 가능', async ({ page }) => {
    // 플랜 선택 페이지로 이동
    await page.goto('/payment/plans');
    
    // 페이지가 로드되었는지 확인
    await expect(page.locator('h1')).toContainText('플랜 선택');
    
    // 플랜 카드들이 표시되는지 확인
    const planCards = page.locator('[data-testid^="plan-card-"]');
    const cardsCount = await planCards.count();
    expect(cardsCount).toBeGreaterThan(0);
    
    // 라이트 플랜 카드 찾기 및 선택
    const lightPlanCard = page.locator('[data-testid="plan-card-light"]');
    await expect(lightPlanCard).toBeVisible();
    await lightPlanCard.click();
    
    // 선택된 플랜이 하이라이트되는지 확인 (border-2 border-blue-500 클래스)
    await expect(lightPlanCard).toHaveClass(/border-2/);
    
    // 블로그 수 선택 섹션이 표시되는지 확인 (무료 플랜이 아닌 경우)
    const blogCountSection = page.locator('text=블로그 수 선택');
    await expect(blogCountSection).toBeVisible();
    
    // 블로그 수 선택 버튼 (2개) 찾기 및 클릭
    const blogCountButtons = page.locator('button:has-text("2개"), button:has-text("개")');
    const blogCount2 = page.locator('text=/^2개$/').first();
    
    if (await blogCount2.isVisible()) {
      await blogCount2.click();
    } else {
      // 대안: 블로그 수 선택 버튼 중 두 번째 버튼 클릭
      const blogButtons = page.locator('button:has-text("개")');
      const buttonCount = await blogButtons.count();
      if (buttonCount >= 2) {
        await blogButtons.nth(1).click();
      }
    }
    
    // 선택된 플랜 정보가 요약 섹션에 표시되는지 확인
    const summarySection = page.locator('text=월 결제 금액');
    await expect(summarySection).toBeVisible();
    
    // 결제하기 버튼이 활성화되어 있는지 확인
    const checkoutButton = page.locator('button:has-text("결제하기")');
    await expect(checkoutButton).toBeEnabled();
    
    // 결제하기 버튼 클릭 시 결제 페이지로 이동하는지 확인
    await checkoutButton.click();
    await expect(page).toHaveURL(/.*\/payment\/checkout/);
  });

  test('5.2.5: 결제 위젯이 올바르게 렌더링됨', async ({ page }) => {
    // 플랜 선택 페이지에서 결제 페이지로 이동
    await page.goto('/payment/plans');
    
    // 페이지가 로드되었는지 확인
    await expect(page.locator('h1')).toContainText('플랜 선택');
    
    // 라이트 플랜 카드 선택
    const lightPlanCard = page.locator('[data-testid="plan-card-light"]');
    await expect(lightPlanCard).toBeVisible();
    await lightPlanCard.click();
    
    // 결제하기 버튼 클릭
    const checkoutButton = page.locator('button:has-text("결제하기")');
    await expect(checkoutButton).toBeEnabled();
    await checkoutButton.click();
    
    // 결제 페이지로 이동했는지 확인
    await expect(page).toHaveURL(/.*\/payment\/checkout/);
    await expect(page.locator('h1')).toContainText('결제하기');
    
    // 주문 정보 섹션이 표시되는지 확인
    const orderInfoSection = page.locator('text=주문 정보');
    await expect(orderInfoSection).toBeVisible();
    
    // 결제 수단 선택 섹션이 표시되는지 확인
    const paymentMethodSection = page.locator('text=결제 수단 선택');
    await expect(paymentMethodSection).toBeVisible();
    
    // 결제 위젯 컨테이너가 존재하는지 확인 (#payment-widget)
    // 토스페이먼츠 위젯은 iframe으로 렌더링되므로, 부모 요소의 존재를 확인
    const paymentWidgetContainer = page.locator('#payment-widget');
    await expect(paymentWidgetContainer).toBeVisible({ timeout: 10000 });
    
    // 약관 동의 섹션이 표시되는지 확인
    const termsLabel = page.locator('text=/이용약관.*개인정보처리방침/');
    await expect(termsLabel).toBeVisible();
    
    // 약관 동의 체크박스가 표시되는지 확인 (초기에는 체크되지 않음)
    const termsCheckbox = page.locator('input[type="checkbox"]');
    await expect(termsCheckbox).toBeVisible();
    await expect(termsCheckbox).not.toBeChecked();
    
    // 결제하기 버튼이 표시되는지 확인 (초기에는 약관 미동의로 비활성화)
    const paymentButton = page.locator('button:has-text("결제하기")');
    await expect(paymentButton).toBeVisible();
    await expect(paymentButton).toBeDisabled();
    
    // 결제 금액이 표시되는지 확인
    const totalAmount = page.locator('text=/₩.*결제하기/');
    await expect(totalAmount).toBeVisible();
    
    // SSL 안내 문구가 표시되는지 확인
    const sslNotice = page.locator('text=/SSL 보안 연결/');
    await expect(sslNotice).toBeVisible();
  });

  test('5.2.10: 결제 실패 시 에러 표시', async ({ page }) => {
    // 결제 실패 페이지로 직접 이동 (에러 메시지 포함)
    const errorMessage = '결제가 취소되었습니다.';
    await page.goto(`/payment/fail?error=${encodeURIComponent(errorMessage)}`);
    
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 실패 아이콘이 표시되는지 확인 (XCircle 아이콘)
    const failIcon = page.locator('[class*="bg-red-100"]').first();
    await expect(failIcon).toBeVisible();
    
    // 실패 메시지가 표시되는지 확인
    const failTitle = page.locator('h1:has-text("결제에 실패했습니다")');
    await expect(failTitle).toBeVisible();
    
    // 에러 메시지가 표시되는지 확인 (에러 메시지 영역)
    const errorDisplay = page.locator('[class*="bg-red-50"]');
    await expect(errorDisplay).toBeVisible();
    await expect(errorDisplay).toContainText(errorMessage);
    
    // 설명 텍스트가 표시되는지 확인
    const description = page.locator('text=결제가 완료되지 않았습니다');
    await expect(description).toBeVisible();
    
    // 안내 사항이 표시되는지 확인
    const guideSection = page.locator('text=안내 사항');
    await expect(guideSection).toBeVisible();
    
    // 다시 시도 버튼이 표시되고 활성화되어 있는지 확인
    const retryButton = page.locator('button:has-text("다시 시도")');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();
    
    // 대시보드로 이동 버튼이 표시되고 활성화되어 있는지 확인
    const dashboardButton = page.locator('button:has-text("대시보드로 이동")');
    await expect(dashboardButton).toBeVisible();
    await expect(dashboardButton).toBeEnabled();
    
    // 다시 시도 버튼 클릭 시 플랜 선택 페이지로 이동하는지 확인
    await retryButton.click();
    await expect(page).toHaveURL(/.*\/payment\/plans/);
  });
});
