# 04. Code Quality (Readability & Maintainability)

이 문서는 리팩토링 과정에서 **코드 가독성과 유지보수성**을 확보하기 위한 기준 문서이다.
대상은 동료 개발자(혹은 미래의 나)이며, 코드를 읽는 사람이 **의도를 추측하지 않아도 되는 상태**를 목표로 한다.

---

## 1. 네이밍 규칙

### 1-1. 이름은 “의도(intent)”를 드러내야 한다

* 이벤트 중심 네이밍(handle~)은 의미가 약하다
* “무엇을 하는지”가 드러나는 도메인 기반 네이밍을 우선한다

❌ 지양

* `handleClick`
* `doSomething`
* `data`, `temp`, `value`
* `fn`, `a`, `b`

✅ 권장

* `submitOrder`
* `createUser`
* `fetchPosts`
* `toggleSidebar`
* `validatePhoneNumber`

---

### 1-2. Boolean 값은 질문 형태로 작성한다

❌ 지양

```ts
open, error, submitable
```

✅ 권장

```ts
isOpen, hasError, canSubmit, shouldRefetch
```

---

### 1-3. 함수 네이밍은 동사 + 목적어 구조를 따른다

| 목적 | 접두어                  |
| -- | -------------------- |
| 조회 | fetch / get / load   |
| 생성 | create / add         |
| 변경 | update / set / patch |
| 삭제 | remove / delete      |
| 검증 | validate             |
| 변환 | parse / map / format |

예시:

* `formatPrice`
* `parseQueryParams`
* `updateProfileImage`

---

## 2. 매직 넘버 / 매직 스트링 제거

### 2-1. 의미 있는 리터럴은 반드시 상수화한다

* 숫자/문자열이 의미를 가지면 상수로 선언한다
* status, role, tab, page size는 전부 상수화 대상

❌ 금지

```ts
if (status === 3) return
if (role === 'ADMIN') ...
const LIMIT = 20 // 파일마다 중복
```

✅ 권장

```ts
export const STATUS = {
  IDLE: 0,
  LOADING: 1,
  SUCCESS: 2,
  ERROR: 3,
} as const

if (status === STATUS.ERROR) return
```

---

### 2-2. 문자열 상수는 타입과 함께 관리한다

```ts
export const USER_ROLE = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE]
```

---

### 2-3. UI 텍스트도 관리 대상이다

* 에러 메시지 / 버튼 라벨이 여기저기 흩어지면 유지보수 비용이 급증한다

✅ 권장

* `copy.ts`, `messages.ts` 파일로 분리
* 서버 에러 코드는 `errorMap`으로 매핑

---

## 3. 타입 안전성 (TypeScript)

### 3-1. `any`는 최후의 수단이다

* `any`를 쓰는 순간 타입 시스템을 포기한 것이다
* 기본 전략: `unknown` + 타입 가드

❌ 지양

```ts
const res: any = await api()
```

✅ 권장

```ts
const res: unknown = await api()

if (isApiResponse(res)) {
  // 안전하게 사용
}
```

---

### 3-2. API 응답 타입은 단일 출처로 관리한다

* 타입이 여러 파일에 흩어지면 불일치가 생긴다

✅ 권장 구조

* `src/types/api.ts`
* `src/schemas/*.ts` (zod)
* `src/lib/api/client.ts`

---

### 3-3. `as` 캐스팅 남발 금지

* `as`는 타입 에러를 숨기는 행위
* 2번 이상 등장하면 구조를 의심한다

❌ 지양

```ts
const user = data as User
```

✅ 권장

```ts
if (!isUser(data)) return
```

---

## 4. 함수 길이와 책임

### 4-1. 함수는 한 가지 일만 해야 한다

* 30줄 이상이면 분리 대상
* if / try-catch 중첩이 많으면 분리 대상

---

### 4-2. 조건 분기는 early return으로 단순화한다

❌ 지양

```ts
if (a) {
  if (b) {
    if (c) {
      doSomething()
    }
  }
}
```

✅ 권장

```ts
if (!a) return
if (!b) return
if (!c) return

doSomething()
```

---

## 5. 리팩토링 체크리스트

리팩토링 시 아래 순서로 점검한다.

1. 이름만 봐도 의도가 드러나는가?
2. 매직 넘버/스트링이 남아있는가?
3. any / as가 숨어있는가?
4. 함수가 한 가지 책임만 가지는가?
5. 타입 정의가 흩어져 있지는 않은가?
6. 읽는 사람이 추측해야 하는 코드가 있는가?

---

## 6. 기준 요약

* 네이밍은 의도 중심
* 상수화는 기본
* 타입은 단일 출처
* any/as는 경고 신호
* 읽기 쉬운 코드 = 유지보수 가능한 코드

이 문서를 기준으로 모든 리팩토링과 PR 리뷰를 진행한다.
