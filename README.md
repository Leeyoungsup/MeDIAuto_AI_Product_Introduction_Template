# MeDIAuto AI 제품 소개 페이지

기존 저장소에 프레임워크가 없어 HTML/CSS와 ES modules로 구현한 정적 페이지입니다. 런타임 외부 의존성과 외부 폰트 요청은 없습니다.

## 서버 없이 HTML로 열기

`MeDIAuto-AI.html` 파일을 더블클릭하면 브라우저에서 바로 열립니다. 이미지, 스타일, 스크립트를 모두 포함하므로 인터넷 연결이나 로컬 서버가 필요 없습니다. 파일 하나만 다른 컴퓨터로 복사해도 됩니다.

소스나 문의 설정을 수정한 뒤 `npm run standalone`을 실행하면 HTML 파일이 갱신됩니다.

## 개발 서버 실행

Node.js 18 이상:

```sh
npm ci
npm run dev
```

http://127.0.0.1:4173 에서 확인합니다. `PORT=8080 npm run dev`로 포트를 변경할 수 있습니다.

```sh
npm run build
npm run preview
```

배포 대상은 `dist/`입니다. `index.html`, `src/`, `public/`만 명시적으로 복사하며 ZIP, 테스트, 로그인 파일, Git 메타데이터 등은 포함하지 않습니다. 사이트 루트 및 `/products/mediauto/` 같은 하위 경로 모두 지원합니다. 하위 경로 URL 끝에는 `/`를 붙입니다.

## 구성

- `index.html`: 제품 소개, 검토, 플랫폼, 문의, FAQ
- `src/main.js`: manifest에서 기능/하위 항목 자동 구성, 필요 시 이미지 로딩
- `src/comparison.js`: 재사용 가능한 비교 컴포넌트. 두 이미지 디코딩 후 동시 표시, 로딩 요청 경쟁 방지, 실패/재시도, 포인터 및 키보드 조작
- `src/style.css`: 반응형 디자인, 동일 이미지 좌표계와 clip-path
- `src/content.js`: 기능별 설명 문구만 관리
- `src/config.js`: manifest URL과 문의 목적지 단일 설정
- `public/mediauto-ai/manifest.json`: 16개 비교 쌍 및 웹용 파생 경로의 단일 데이터 소스
- `public/mediauto-ai/images/`: 원본 PNG 32장(수정하지 않음), 동일 1600×1000 / WebP quality 90 파생 이미지
- `scripts/optimize-images.py`: Pillow를 이용한 선택적 파생 이미지 재생성
- `tests/page.spec.js`: 실제 Chrome 통합 검증

비교 자료는 작업 환경의 `/mnt/hdd1/Mediauto-studio_saas/artifacts/mediauto-ai-comparison.zip`에서 가져왔습니다. 첨부 `mediauto-ai-page-assets.zip`은 비교 쌍 형식이 아닌 화면 모음이므로 전문가 검토 이미지에만 사용했습니다. ZIP의 캡처 스크립트와 인증 자료는 프로젝트에 복사하지 않았습니다. manifest 촬영 정보는 UI에 렌더링하지 않습니다.

## 문의 연결

실제 문의 주소가 정해지면 `src/config.js`의 `contact.url`에 승인된 `https://` 문의 페이지 또는 `mailto:` 주소를 설정하세요. 기본값은 `null`이며, 연결 전에는 안내 대화상자만 표시합니다. 정보를 수집하거나 전송 성공을 표시하지 않습니다. 제출 API를 이용하려면 별도의 서버 처리 및 오류/성공 응답 연동이 필요합니다.

## 브라우저 검증

```sh
npm run build
npm test
```

기본 Chrome 경로는 `/usr/bin/google-chrome`입니다. 다른 환경에서는 `playwright.config.js`의 `executablePath`를 설치된 Chrome 경로로 변경하세요. 테스트는 자체 서버를 시작/종료하며, 데스크톱과 모바일 스크린샷을 `test-results/`에 남깁니다.

검증 범위: 16쌍 원본 해시/1600×1000 크기, manifest 등록 정보, 전체 기능과 영역 전환, 이미지 동일 화면 좌표, 0/50/100%, 방향키·마우스·터치, 지연 로딩, 이미지 실패/재시도 및 빠른 전환 경쟁, 모바일 넘침/비교 영역 높이 유지, 문의 안내, manifest 실패 복구, 내부 앵커, 콘솔 오류, 하위 배포 경로.
