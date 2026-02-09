# 02. State Management

프론트엔드 버그의 대부분은 **상태(state)를 잘못 정의하거나, 잘못된 위치에서 관리**하면서 발생한다.
이 문서는 리팩토링 과정에서 상태를 재정의하고, 버그를 줄이기 위한 **상태 관리 기준 문서**이다.

---

## 1. 상태 관리의 기본 원칙

### 원칙 1. 상태는 최소한만 존재해야 한다

* 상태는 많을수록 버그 가능성이 기하급수적으로 증가한다
* 계산 가능한 값(derived state)은 상태로 만들지 않는다

❌ 잘못된 예

```tsx
const [items, setItems] = useState<Item[]>([])
const [count, setCount] = useState(0)

useEffect(() => {
  setCount(items.length)
}, [items])
```

✅ 올바른 예

```tsx
const [items, setItems] = useState<Item[]>([])
const count = items.length
```

---

### 원칙 2. 상태는 역할에 따라 분리해야 한다

상태는 반드시 아래 3가지 중 하나로 분류되어야 한다.

| 분류       | 의미         | 예시           | 도구                 |
| -------- | ---------- | ------------ | ------------------ |
| 서버 상태    | 서버에서 온 데이터 | 게시글, 유저, 리스트 | TanStack Query     |
| 클라이언트 상태 | UI 상태      | 모달 열림, 탭 선택  | useState / Zustand |
| 파생 상태    | 계산된 값      | 총 개수, 필터 결과  | 변수 / useMemo       |

서버 상태와 클라이언트 상태를 **절대 섞지 않는다**.

---

### 서버 상태와 UI 상태 혼재 예시 (중요)

❌ 잘못된 예: 서버 데이터와 UI 상태 섞임

```tsx
const [posts, setPosts] = useState([])
const [selectedId, setSelectedId] = useState(null)

useEffect(() => {
  fetchPosts().then(setPosts)
}, [])
```

* 서버 데이터(posts)가 로컬 상태로 복사됨
* refetch, 캐시, 동기화 모두 불가능

✅ 올바른 예: 서버 상태는 query, UI 상태는 local

```tsx
const { data: posts } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

const [selectedId, setSelectedId] = useState<number | null>(null)
```

* 서버 상태는 React Query가 책임진다
* UI 상태만 컴포넌트가 관리한다

---

## 2. 서버 상태 관리 기준 (TanStack Query)

### 언제 서버 상태인가?

다음 조건 중 하나라도 만족하면 서버 상태이다.

* API로부터 가져온 데이터
* 새로고침 시 다시 받아야 하는 데이터
* 다른 사용자에 의해 바뀔 수 있는 데이터
* 캐싱이 필요한 데이터

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

---

### 금지 패턴

❌ 서버 데이터를 useState로 복사

```tsx
const [posts, setPosts] = useState([])

useEffect(() => {
  fetchPosts().then(setPosts)
}, [])
```

이 패턴은 **동기화 버그의 근원**이다.

---

## 3. 클라이언트 상태 관리 기준

### useState를 써도 되는 경우

* 컴포넌트 내부에서만 쓰는 상태
* 생명주기가 짧은 상태
* 다른 컴포넌트와 공유하지 않는 상태

```tsx
const [isOpen, setIsOpen] = useState(false)
```

---

### 전역 상태(Zustand)를 써야 하는 경우

* 여러 컴포넌트가 동시에 사용하는 상태
* 페이지 이동 후에도 유지되어야 하는 상태
* URL, 서버 상태와 동기화되는 UI 상태

```ts
const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggle: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

📌 **중요 원칙**

서버 데이터는 Zustand가 아닌 **React Query 캐시**에 둔다.
Zustand는 오직 **UI 상태와 클라이언트 상태**만 관리한다.

---

## 4. 파생 상태 (Derived State)

파생 상태는 **절대 useState로 만들지 않는다**.

❌ 불필요한 파생 상태 저장

```tsx
const [filtered, setFiltered] = useState([])

useEffect(() => {
  setFiltered(items.filter(i => i.done))
}, [items])
```

✅ 올바른 예

```tsx
const filtered = useMemo(() => {
  return items.filter(i => i.done)
}, [items])
```

기본 원칙:

* 계산 가능하면 상태 아님
* 원본이 바뀌면 자동으로 바뀌어야 함

---

## 5. 상태 변경 단일 책임 원칙 (Single Source of Truth)

상태 변경은 반드시 **한 곳에서만** 일어나야 한다.

* 훅
* 스토어
* 컨텍스트

여러 위치에서 동일 상태를 변경하면
버그 재현이 불가능해지고, 디버깅 비용이 폭증한다.

---

## 6. 리팩토링 체크리스트

리팩토링 시 아래 순서로 점검한다.

1. 이 값은 정말 상태인가?
2. 다른 상태로부터 계산 가능한가?
3. 서버 상태인데 useState로 관리하고 있지는 않은가?
4. UI 상태가 서버 데이터와 섞여 있지는 않은가?
5. 전역 상태가 과도하지 않은가?
6. 상태 변경이 한 곳에서만 일어나는가?

---

## 7. 실무 기준 요약

* 상태는 **적을수록 좋다**
* 서버 상태는 React Query
* UI 상태는 useState / Zustand
* 파생 상태는 변수 또는 useMemo
* 복사된 상태는 버그의 시작이다

이 문서를 기준으로 모든 리팩토링과 PR 리뷰를 진행한다.