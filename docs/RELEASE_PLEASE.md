# Release Please 사용 안내

## 동작

- `master`에 푸시될 때마다 GitHub Actions가 [release-please](https://github.com/googleapis/release-please)를 실행합니다.
- [Conventional Commits](https://www.conventionalcommits.org/) 형식의 커밋이 쌓이면 **릴리즈 PR**이 열리거나 갱신됩니다.
- 그 PR을 머지하면 **`CHANGELOG.md` 갱신**, **`package.json` 버전 bump**, **`v*` 태그**, **GitHub Release**가 생성됩니다.

## 커밋 메시지 예시

- `feat: 종목 검색에 한글 별칭 추가`
- `fix: AI 요약 한글 형식 오류 수정`
- `chore: release-please 워크플로 추가`

## 릴리즈 PR에서 CI가 돌게 하려면 (선택)

`GITHUB_TOKEN`으로 생성된 PR/릴리즈는 다른 워크플로를 트리거하지 않을 수 있습니다.  
PR에서도 CI를 돌리려면 저장소에 **PAT 시크릿**(예: `RELEASE_PLEASE_TOKEN`)을 추가하고,  
`.github/workflows/release-please.yml`의 `token`을 `secrets.RELEASE_PLEASE_TOKEN`으로 바꾸면 됩니다.

## 현재 버전 소스

- 루트 패키지 버전은 `.release-please-manifest.json`의 `"."` 항목과 `package.json`의 `version`이 맞춰집니다.
