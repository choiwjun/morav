import { test, expect } from '@playwright/test';

test.describe('5.2.10: 결제 실패 시 에러 표시', () => {
  test('결제 실패 페이지에 에러 메시지가 표시되어야 함', async ({ page }) => {
    // 에러 메시지와 함께 실패 페이지로 이동
    const errorMessage = '결제가 취소되었습니다.';
    await page.goto(`/payment/fail?error=${encodeURIComponent(errorMessage)}`);
    
    // 실패 아이콘 확인
    await expect(page.locator('text=결제에 실패했습니다')).toBeVisible();
    
    // 에러 메시지가 표시되는지 확인
    await expect(page.locator(`text=${errorMessage}`)).toBeVisible();
    
    // 에러 메시지 영역 확인 (빨간색 배경)
    const errorContainer = page.locator('text=결제에 실패했습니다').locator('..').locator('..');
    await expect(errorContainer).toBeVisible();
  });

  test('에러 메시지가 없을 때 기본 메시지가 표시되어야 함', async ({ page }) => {
    // 에러 파라미터 없이 실패 페이지로 이동
    await page.goto('/payment/fail');
    
    // 기본 에러 메시지 확인
    await expect(page.locator('text=결제에 실패했습니다')).toBeVisible();
    await expect(page.locator('text=알 수 없는 오류가 발생했습니다')).toBeVisible();
  });

  test('결제 실패 페이지에 안내 사항이 표시되어야 함', async ({ page }) => {
    await page.goto('/payment/fail?error=결제%20실패');
    
    // 안내 사항 섹션 확인
    await expect(page.locator('text=안내 사항')).toBeVisible();
    await expect(page.locator('text=카드 한도 초과 또는 잔액 부족일 수 있습니다')).toBeVisible();
    await expect(page.locator('text=카드 정보가 올바른지 확인해주세요')).toBeVisible();
    await expect(page.locator('text=문제가 지속되면 고객센터로 문의해주세요')).toBeVisible();
  });

  test('다시 시도 버튼을 클릭하면 플랜 선택 페이지로 이동해야 함', async ({ page }) => {
    await page.goto('/payment/fail?error=결제%20실패');
    
    // 다시 시도 버튼 클릭
    const retryButton = page.locator('button:has-text("다시 시도")');
    await retryButton.click();
    
    // 플랜 선택 페이지로 리다이렉트되었는지 확인
    await expect(page).toHaveURL('/payment/plans');
    await expect(page.locator('text=플랜 선택')).toBeVisible();
  });

  test('대시보드로 이동 버튼을 클릭하면 대시보드로 이동해야 함', async ({ page }) => {
    await page.goto('/payment/fail?error=결제%20실패');
    
    // 대시보드로 이동 버튼 클릭
    const dashboardButton = page.locator('button:has-text("대시보드로 이동")');
    await dashboardButton.click();
    
    // 대시보드로 리다이렉트되었는지 확인
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('URL 인코딩된 에러 메시지가 올바르게 디코딩되어 표시되어야 함', async ({ page }) => {
    // 한글 에러 메시지 테스트
    const koreanError = '카드 한도 초과로 인해 결제가 실패했습니다.';
    await page.goto(`/payment/fail?error=${encodeURIComponent(koreanError)}`);
    
    // 디코딩된 한글 메시지 확인
    await expect(page.locator(`text=${koreanError}`)).toBeVisible();
  });

  test('긴 에러 메시지가 잘리지 않고 표시되어야 함', async ({ page }) => {
    // 긴 에러 메시지
    const longError = '결제 처리 중 오류가 발생했습니다. 카드 정보를 확인하시고 다시 시도해주세요. 문제가 지속되면 고객센터로 문의해주세요.';
    await page.goto(`/payment/fail?error=${encodeURIComponent(longError)}`);
    
    // 긴 메시지가 표시되는지 확인
    await expect(page.locator(`text=${longError}`)).toBeVisible();
  });
});
