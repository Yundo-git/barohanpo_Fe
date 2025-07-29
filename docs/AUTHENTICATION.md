# 인증 시스템 아키텍처

이 문서는 애플리케이션의 인증 시스템 아키텍처와 구현 세부사항을 설명합니다.

## 개요

인증 시스템은 JWT(JSON Web Tokens)를 사용하여 사용자 인증을 처리합니다. 보안을 강화하기 위해 다음 전략을 사용합니다:

- **Access Token**: 클라이언트 측 메모리(Redux 상태)에 저장
- **Refresh Token**: HTTP-only, Secure, SameSite 쿠키에 저장
- **자동 토큰 갱신**: Access Token 만료 시 자동으로 갱신

## 주요 컴포넌트

### 1. 인증 서비스 (`authService.ts`)

모든 인증 관련 API 호출을 추상화한 서비스 계층입니다.

```typescript
// 주요 기능
- login(email, password): 사용자 로그인 처리
- logout(): 로그아웃 처리
- refreshToken(): Access Token 갱신
```

### 2. Redux 상태 관리 (`userSlice.ts`)

인증 상태와 사용자 정보를 관리하는 Redux 슬라이스입니다.

```typescript
// 상태 구조
{
  user: User | null;      // 사용자 정보
  accessToken: string | null;  // Access Token
  refreshToken: string | null; // Refresh Token (주로 사용되지 않음)
  expiresIn: number | null;    // 토큰 만료 시간(초)
}

// 주요 액션
- setAuth: 로그인 시 사용자 정보와 토큰 설정
- clearAuth: 로그아웃 시 상태 초기화
- updateAccessToken: Access Token 갱신
```

### 3. 인증 훅 (`useAuth.ts`)

애플리케이션 전반에서 인증 상태를 관리하는 커스텀 훅입니다.

주요 기능:
- 앱 마운트 시 토큰 복원 로직
- Axios 인터셉터를 통한 토큰 자동 주입
- 토큰 만료 시 자동 갱신
- 401 에러 처리 및 자동 로그아웃

### 4. 로그인 훅 (`useLogin.ts`)

로그인 기능을 처리하는 커스텀 훅입니다.

```typescript
// 사용 예시
const { login } = useLogin();
const handleSubmit = async () => {
  const result = await login({ email, password });
  if (result.success) {
    // 로그인 성공 처리
  } else {
    // 에러 처리
  }
};
```

## 인증 흐름

### 1. 로그인
1. 사용자가 이메일/비밀번호로 로그인
2. 서버에서 Access Token과 Refresh Token 발급
3. Access Token은 Redux 상태에, Refresh Token은 HTTP-only 쿠키에 저장
4. 사용자 정보와 함께 로그인 성공 처리

### 2. 토큰 갱신
1. Access Token이 만료되면 401 에러 발생
2. Axios 인터셉터가 에러를 감지
3. Refresh Token을 사용하여 새로운 Access Token 요청
4. 새로운 Access Token으로 원래 요청 재시도
5. 토큰 갱신 실패 시 자동 로그아웃

### 3. 로그아웃
1. 서버에 로그아웃 요청 전송
2. Redux 상태 초기화
3. 쿠키에서 Refresh Token 제거

## 보안 고려사항

1. **XSS 방지**
   - Access Token을 메모리에만 저장
   - HTTP-only 쿠키 사용으로 JavaScript 접근 차단

2. **CSRF 방어**
   - SameSite=Strict 쿠키 정책 사용
   - CSRF 토큰 사용 (필요시)

3. **토큰 만료**
   - Access Token: 짧은 수명(예: 15분)
   - Refresh Token: 상대적으로 긴 수명(예: 7일)

4. **보안 헤더**
   - 모든 API 응답에 보안 헤더 적용
   - HSTS, CSP 등 추가 보안 조치 고려

## 테스트 가이드

1. **로그인 테스트**
   - 유효한 자격 증명으로 로그인 확인
   - 잘못된 자격 증명으로 로그인 시도 시 적절한 에러 메시지 확인

2. **토큰 갱신 테스트**
   - Access Token 만료 후 자동 갱신 확인
   - 만료된 Refresh Token으로 갱신 시도 시 로그아웃 처리 확인

3. **보안 테스트**
   - JavaScript로 Access Token 접근 시도 차단 확인
   - CSRF 공격 시도 차단 확인

## 문제 해결

### 로그인 실패 시
1. 네트워크 연결 확인
2. 서버 응답 확인 (개발자 도구 > 네트워크 탭)
3. 쿠키 설정 확인 (개발자 도구 > 애플리케이션 탭)

### 토큰 갱신 실패 시
1. Refresh Token 유효성 확인
2. 서버 로그 확인
3. 쿠키 도메인 설정 확인
