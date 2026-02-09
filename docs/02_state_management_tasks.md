# 02_state_management.md 기반 작업 목록 (Task List)

## 적용 범위 (이번 PR 기준)
- [x] 02 상태 관리
- [ ] 01 컴포넌트 구조 및 의존성 (이번 PR 제외)
- [ ] 03 성능 최적화 (이번 PR 제외)
- [ ] 05 UX / 접근성 (이번 PR 제외)
- [ ] 06 테스트 (이번 PR 제외)

---

## 0. 준비 (상태 진단)
- [ ] 이번 PR의 Primary 대상(주 대상) 컴포넌트 1개 선택
- [ ] Secondary(연관 컴포넌트) 목록 작성 (원칙: 수정 금지, 타입/임포트 깨짐만 최소 수정 허용)
- [ ] Primary 컴포넌트에서 상태/데이터 소스 전부 나열
  - [ ] useState / useReducer 목록
  - [ ] Zustand store 사용 목록
  - [ ] React Query(useQuery/useMutation) 사용 목록
  - [ ] API 호출(fetch/axios) + useEffect 사용 목록
- [ ] 각 항목을 아래 3가지 중 하나로 분류
  - [ ] 서버 상태 (TanStack Query로 관리되어야 함)
  - [ ] UI 상태 (useState/Zustand)
  - [ ] 파생 상태 (변수/useMemo)

---

## 1. 파생 상태(derived state) 제거
> 원칙: “계산 가능하면 상태 아님”, “파생 값은 useState 금지”

- [ ] 파생 상태 후보 식별 (예: count, filtered, computedXXX)
- [ ] 파생 값을 useState로 저장하는 코드 제거
  - [ ] `useEffect(() => setX(derived), [deps])` 패턴 제거
- [ ] 대체 방식 적용
  - [ ] 단순 계산은 변수로 치환
  - [ ] 계산 비용이 큰 경우에만 useMemo 적용
- [ ] 파생 상태 제거 후에도 화면 동작 동일한지 수동 확인

---

## 2. 서버 상태를 TanStack Query로 일원화
> 원칙: “서버 데이터는 useState로 복사 금지”, “fetch+useEffect 패턴 금지”

### 2-1) 서버 상태 식별
- [ ] API로부터 가져오는 데이터 목록화
- [ ] 새로고침 시 다시 받아야 하는 데이터 식별
- [ ] 다른 사용자/서버에 의해 변경될 수 있는 데이터 식별
- [ ] 캐싱이 필요한 데이터 식별

### 2-2) 금지 패턴 제거
- [ ] 서버 데이터를 useState로 저장하는 코드 제거
  - [ ] `fetchX().then(setX)` / `axios...then(setX)` 제거
- [ ] `fetch/axios + useEffect`로 서버 데이터를 주입하는 패턴 제거

### 2-3) Query로 이전
- [ ] useQuery로 서버 상태 이전
  - [ ] queryKey를 “의미 단위”로 정의
  - [ ] queryFn을 fetch 함수로 분리(가능하면)
- [ ] 변경(생성/수정/삭제)이 있으면 useMutation으로 이전
  - [ ] 성공 시 invalidate/optimistic update 전략 결정(간단히 invalidate 우선)

---

## 3. UI 상태(useState/Zustand) 정리
> 원칙: “Zustand는 UI 상태만”, “서버 데이터는 Zustand 금지”

### 3-1) useState로 유지할 UI 상태 확인
- [ ] 컴포넌트 내부에서만 쓰이는지 확인
- [ ] 생명주기가 짧은 상태인지 확인
- [ ] 다른 컴포넌트와 공유가 필요 없는지 확인

### 3-2) Zustand 사용 재점검
- [ ] Zustand에 서버 데이터가 들어가 있는지 확인 → 있으면 제거/이전
- [ ] 여러 컴포넌트가 공유하는 UI 상태만 남기기
- [ ] 페이지 언마운트 시 초기화가 필요한 UI 상태인지 확인(필요 시 reset 액션 존재 여부 체크)

---

## 4. 상태 변경 단일 책임(SSoT) 점검
> 원칙: “같은 상태를 두 군데서 변경 금지”

- [ ] 동일 상태를 변경하는 코드 위치가 2곳 이상인지 확인
- [ ] 상태 변경 책임을 한 곳으로 통합
  - [ ] 훅(또는 store)에서만 변경되도록 정리
- [ ] setter를 여러 레벨로 전달하며 여기저기서 변경하는 흐름이 있는지 확인 → 단일 지점으로 모으기

---

## 5. 최종 Gate 체크 (상태 관리 기준)
- [ ] 파생 상태 useState 0건
- [ ] 서버 상태를 useState로 복사 0건
- [ ] 서버 데이터가 Zustand에 저장된 케이스 0건
- [ ] fetch+useEffect로 서버 상태 주입 0건
- [ ] 동일 상태 변경 지점 1곳 유지
- [ ] 리팩토링 전/후 화면 동작 동일(수동 확인)
- [ ] 변경 사항 요약 3줄 작성 (PR 설명용)

---

## PR 완료 조건 (Gate)
- 서버 상태 복사(useState/Zustand 저장) 0건
- 파생 상태(useState 저장) 0건
- 상태 변경 단일 책임 위반 0건
- 기능 동작 동일
