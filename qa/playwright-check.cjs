const { chromium } = require('playwright');

const baseUrl = 'http://127.0.0.1:8000/design/app.html';
const results = [];
function check(condition, name, detail = '') {
  if (!condition) throw new Error(name + (detail ? ' — ' + detail : ''));
  results.push('PASS  ' + name);
}
async function waitForScreen(page, file) {
  await page.waitForFunction(
    (expected) => document.querySelector('#screen')?.contentWindow?.location.pathname.endsWith(expected),
    file,
  );
  return page.frameLocator('#screen');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('icheonQaFreshStart')) {
      localStorage.clear();
      sessionStorage.setItem('icheonQaFreshStart', 'true');
    }
  });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl + '#intro', { waitUntil: 'networkidle' });
    let screen = await waitForScreen(page, '00-intro.html');
    check((await screen.locator('main').getAttribute('aria-label'))?.includes('인트로'), '인트로 화면 로드');

    await page.locator('[data-step="signup"]').click();
    screen = await waitForScreen(page, '00-profile.html');
    check(await screen.getByText('연령대', { exact: true }).count() === 1, '회원가입 라벨이 “연령대”');
    const ageOptions = await screen.locator('button').evaluateAll((buttons) =>
      buttons.map((button) => button.textContent.trim()).filter((text) => /^(10대|20대|30대|40대|50대|60대 이상)$/.test(text)),
    );
    check(JSON.stringify(ageOptions) === JSON.stringify(['10대', '20대', '30대', '40대', '50대', '60대 이상']), '연령대 선택지 6개');
    check(await page.locator('[data-step="map"]').isDisabled(), '회원가입 전 모험지도 단계 잠김');
    check(await page.locator('[data-step="qr"]').isDisabled(), '회원가입 전 QR 인증 단계 잠김');
    check(await page.locator('[data-step="journey"]').isDisabled(), '회원가입 전 전체 여정 단계 잠김');

    await screen.locator('#adventureId').fill('도자기대장');
    await screen.locator('#startMap').click();
    screen = await waitForScreen(page, '01-home-hub.html');
    await page.waitForFunction(() => !document.querySelector('[data-step="map"]').disabled);
    check(await page.evaluate(() => Boolean(localStorage.getItem('icheonAdventureProfile'))), '가입 완료 상태 저장');
    await page.waitForFunction(() => {
      const child = document.querySelector('#screen')?.contentDocument;
      const images = child ? [...child.querySelectorAll('.spot-photo img')] : [];
      return images.length === 12 && images.every((image) => image.complete && image.naturalWidth > 0);
    });
    const mapCard = screen.locator('[data-card="east"]');
    const photoStatus = await mapCard.locator('.spot-photo img').evaluateAll((images) =>
      images.map((image) => ({ loaded: image.complete && image.naturalWidth > 0, height: image.getBoundingClientRect().height })),
    );
    check(photoStatus.length === 3 && photoStatus.every((photo) => photo.loaded), '다음 여정의 장소 사진 3장 로드');
    check(photoStatus.every((photo) => photo.height >= 90), '장소 사진이 QA 최소 높이 90px 이상');
    const cardLayout = await mapCard.evaluate((card) => {
      const photos = [...card.querySelectorAll('.spot-photo')];
      const cta = card.querySelector('.cta');
      const sheet = document.querySelector('.sheet');
      return {
        ctaAfterPhotos: cta.getBoundingClientRect().top > Math.max(...photos.map((photo) => photo.getBoundingClientRect().bottom)),
        sheetScrollable: sheet.scrollHeight > sheet.clientHeight,
      };
    });
    check(cardLayout.ctaAfterPhotos, '첫 장소 정보 확인 버튼이 사진 아래에 배치');
    check(cardLayout.sheetScrollable, '다음 여정 시트가 아래로 스크롤 가능');
    await screen.locator('#nextCourse').click();
    await page.waitForTimeout(350);
    const nextCourseState = await screen.locator('.cards').evaluate((cards) => ({
      scrollLeft: cards.scrollLeft,
      northSelected: cards.querySelector('[data-card="north"]').classList.contains('selected'),
      northFullyVisible: (() => {
        const card = cards.querySelector('[data-card="north"]').getBoundingClientRect();
        const box = cards.getBoundingClientRect();
        return card.left >= box.left && card.right <= box.right;
      })(),
    }));
    check(nextCourseState.northSelected && nextCourseState.northFullyVisible && nextCourseState.scrollLeft > 0, '다음 버튼으로 북쪽 서희 카드 전환');
    await screen.locator('[data-card="east"]').click();
    await screen.locator('.b-north').click();
    await page.waitForTimeout(350);
    check(await screen.locator('[data-card="north"]').evaluate((card) => card.classList.contains('selected')), '북쪽 섬 터치로 서희 카드 전환');

    await page.locator('[data-step="journey"]').click();
    screen = await waitForScreen(page, '05-my-continue.html');
    check((await screen.locator('#resumeProgress').textContent()).trim() === '0/3', '첫 방문 이어하기는 도자 예술맵 0/3 표시');
    check((await screen.locator('#todayState').textContent()).includes('시작 전'), '첫 방문에 완료 기록이 표시되지 않음');

    await page.locator('[data-step="qr"]').click();
    screen = await waitForScreen(page, '02-qr-scanner.html');
    await screen.locator('#scanButton').click();
    screen = await waitForScreen(page, '02-qr-complete.html');
    check((await screen.locator('#progressText').textContent()).trim() === '1 / 3', '첫 QR 후 진행도 1/3');
    await screen.locator('#continueLink').click();
    screen = await waitForScreen(page, '02-qr-scanner.html');
    await screen.locator('#scanButton').click();
    screen = await waitForScreen(page, '02-qr-complete.html');
    check((await screen.locator('#progressText').textContent()).trim() === '2 / 3', '두 번째 QR 후 진행도 2/3');
    await screen.locator('#continueLink').click();
    screen = await waitForScreen(page, '02-qr-scanner.html');
    check((await screen.locator('#scanButton').textContent()).includes('지도 완성'), '남은 마지막 장소에서 지도 완성 CTA 표시');
    await screen.locator('#scanButton').click();
    screen = await waitForScreen(page, '02-qr-complete.html');
    check((await screen.locator('#progressText').textContent()).trim() === '3 / 3', '마지막 QR 후 진행도 3/3');
    check((await screen.locator('#completeTitle').textContent()).includes('완성'), '도자기 복원 완료 카피 표시');
    check((await screen.locator('.restore').count()) === 1, '도자기 복원 시각 요소 존재');
    check(await page.evaluate(() => localStorage.getItem('icheonSecretUnlocked') === 'true'), '비밀맵 해금 상태 저장');

    await screen.locator('#continueLink').click();
    screen = await waitForScreen(page, '01-home-hub.html');
    check(await screen.locator('body').evaluate((body) => body.classList.contains('secret-unlocked')), '모험지도에 해금 상태 적용');
    check((await screen.locator('[data-card="west"] .state').textContent()).includes('비밀맵 해금'), '서쪽 카드가 비밀맵 해금으로 전환');
    check(await screen.locator('[data-card="west"] .cta').evaluate((button) => !button.disabled), '비밀맵 시작 버튼 활성화');
    check((await screen.locator('#infoTitle').textContent()).includes('비밀맵'), '해금 후 비밀맵 자동 선택');
    check((await screen.locator('.unlock-banner').textContent()).includes('안개가 걷혔어요'), '비밀맵 해금 안내 표시');

    await page.locator('[data-step="journey"]').click();
    screen = await waitForScreen(page, '05-my-continue.html');
    check((await screen.locator('#resumeTitle').textContent()).includes('비밀맵'), '해금 후 이어하기가 비밀맵으로 전환');
    check((await screen.locator('#resumeProgress').textContent()).trim() === '0/3', '해금 후 이어하기가 새 비밀맵 0/3 표시');
    check((await screen.locator('#todayState').textContent()).includes('3/3'), '도자 예술맵 완료 기록이 3/3으로 갱신');

    console.log(results.join('\n'));
    console.log('\n총 ' + results.length + '개 QA 검증 통과');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error('QA FAILED\n' + error.stack);
  process.exit(1);
});
