import { test, expect } from '@playwright/test';

test.describe('결제 실패 페이지', () => {
  test('5.2.10: 결제 실패 시 에러 표시', async ({ page }) => {
    // 에러 메시지와 함께 결제 실패 페이지로 이동
    const errorMessage = '카드 한도 초과로 결제가 실패했습니다.';
    await page.goto(`/payment/fail?error=${encodeURIComponent(errorMessage)}`);

    // 실패 아이콘이 표시되는지 확인
    const failIcon = page.locator('svg').filter({ hasText: /XCircle|X/ }).first();
    await expect(failIcon).toBeVisible();

    // 제목이 표시되는지 확인
    await expect(page.getByText('결제에 실패했습니다')).toBeVisible();

    // 에러 메시지가 표시되는지 확인
    const errorBox = page.locator('text=' + errorMessage);
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toHaveClass(/text-red-700/);

    // 설명 텍스트가 표시되는지 확인
    await expect(
      page.getByText('결제가 완료되지 않았습니다. 다시 시도해주시거나 고객센터로 문의해주세요.')
    ).toBeVisible();

    // 안내 사항이 표시되는지 확인
    await expect(page.getByText('안내 사항')).toBeVisible();
    await expect(page.getByText('카드 한도 초과 또는 잔액 부족일 수 있습니다')).toBeVisible();
    await expect(page.getByText('카드 정보가 올바른지 확인해주세요')).toBeVisible();
    await expect(page.getByText('문제가 지속되면 고객센터로 문의해주세요')).toBeVisible();

    // 버튼들이 표시되는지 확인
    await expect(page.getByRole('button', { name: /대시보드로 이동/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /다시 시도/ })).toBeVisible();

    // 다시 시도 버튼 클릭 시 플랜 선택 페이지로 이동하는지 확인
    await page.getByRole('button', { name: /다시 시도/ }).click();
    await expect(page).toHaveURL(/\/payment\/plans/);
  });

  test('에러 메시지가 없을 때 기본 메시지 표시', async ({ page }) => {
    // 에러 파라미터 없이 결제 실패 페이지로 이동
    await page.goto('/payment/fail');

    // 기본 에러 메시지가 표시되는지 확인
    await expect(page.getByText('알 수 없는 오류가 발생했습니다.')).toBeVisible();
  });

  test('다양한 에러 메시지 형식 처리', async ({ page }) => {
    const errorMessages = [
      '결제가 취소되었습니다.',
      '카드 정보가 올바르지 않습니다.',
      '네트워크 오류가 발생했습니다.',
    ];

    for (const errorMsg of errorMessages) {
      await page.goto(`/payment/fail?error=${encodeURIComponent(errorMsg)}`);
      await expect(page.getByText(errorMsg)).toBeVisible();
    }
  });

  test('대시보드로 이동 버튼 동작', async ({ page }) => {
    await page.goto('/payment/fail?error=테스트 에러');

    // 대시보드로 이동 버튼 클릭
    await page.getByRole('button', { name: /대시보드로 이동/ }).click();

    // 대시보드로 이동하는지 확인
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
