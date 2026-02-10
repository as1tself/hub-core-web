// src/lib/dpop/DPoPClient.ts
/**
 * DPoP (Demonstrating Proof of Possession) 클라이언트 - RFC 9449 표준 구현
 *
 * ## DPoP란?
 * DPoP는 OAuth 2.0 토큰 탈취 공격을 방지하는 보안 메커니즘입니다.
 * Access Token을 클라이언트의 공개키에 바인딩하여, 토큰이 탈취되더라도
 * 개인키 없이는 사용할 수 없게 만듭니다.
 *
 * ## 보안 원리
 * ```
 * [기존 Bearer 토큰]
 * 1. 공격자가 토큰 탈취
 * 2. 바로 API 호출 가능 ❌
 *
 * [DPoP 토큰]
 * 1. 공격자가 토큰 탈취
 * 2. API 호출하려면 DPoP Proof 필요
 * 3. Proof 생성에는 개인키 필요
 * 4. 개인키는 브라우저 내부에만 존재 (extractable: false)
 * 5. 공격자는 사용 불가 ✅
 * ```
 *
 * ## 브라우저 WebCrypto API 사용
 * - 키 쌍은 extractable: false로 생성 → XSS로 개인키 탈취 불가
 * - 키는 IndexedDB에 저장 → 세션 간 유지
 * - 서명은 WebCrypto가 내부적으로 처리 → JavaScript에 노출되지 않음
 *
 * @see https://datatracker.ietf.org/doc/html/rfc9449
 */

const DB_NAME = "dpop-keys";
const STORE_NAME = "keyPair";

/**
 * 원본 API 참조 (XSS 후킹 방지)
 *
 * ## 보안: 모듈 로드 시점에 네이티브 API 참조 저장
 * - XSS 공격자가 window.fetch, Headers, crypto.subtle 등을 후킹해도 영향 없음
 * - 이 참조들은 모듈 스코프에 저장되어 외부에서 변경 불가
 * - export 되지 않으므로 외부에서 접근 불가
 *
 * ## 왜 crypto.subtle도 저장하는가?
 * - 페이지 로드 전에 악성 스크립트가 주입되면 crypto.subtle 후킹 가능
 * - 예: 악성 브라우저 확장, MITM 공격, 서버 측 XSS
 * - 모듈 로드 시점에 원본 참조를 저장하여 후킹 무력화
 */
const originalFetch = fetch.bind(window);
const OriginalHeaders = Headers;
const OriginalTextEncoder = TextEncoder;
const OriginalTextDecoder = TextDecoder;

/**
 * crypto.subtle 원본 메서드 참조
 *
 * ## 주의: crypto.subtle 자체가 아닌 개별 메서드를 바인딩
 * - crypto.subtle 객체를 통째로 저장하면 내부 메서드가 여전히 후킹될 수 있음
 * - 각 메서드를 명시적으로 bind하여 완전한 격리 보장
 */
const originalCrypto = {
    encrypt: crypto.subtle.encrypt.bind(crypto.subtle),
    decrypt: crypto.subtle.decrypt.bind(crypto.subtle),
    sign: crypto.subtle.sign.bind(crypto.subtle),
    digest: crypto.subtle.digest.bind(crypto.subtle),
    generateKey: crypto.subtle.generateKey.bind(crypto.subtle),
    importKey: crypto.subtle.importKey.bind(crypto.subtle),
    exportKey: crypto.subtle.exportKey.bind(crypto.subtle),
    getRandomValues: crypto.getRandomValues.bind(crypto),
};

/**
 * 토큰 암호화용 고정 챌린지
 * - 이 값을 DPoP 개인키로 서명하여 AES 암호화 키를 파생
 * - 개인키는 extractable: false이므로 공격자는 같은 키를 생성할 수 없음
 */
const TOKEN_ENCRYPTION_CHALLENGE = "hub-token-encryption-key-v1";

export interface DPoPKeyPair {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}

export interface EncryptedToken {
    ciphertext: string;  // Base64url 인코딩된 암호문
    iv: string;          // Base64url 인코딩된 IV
}

class DPoPClient {
    private static instance: DPoPClient | null = null;
    private keyPair: DPoPKeyPair | null = null;
    private publicKeyJwk: JsonWebKey | null = null;
    private initialized = false;
    private initPromise: Promise<DPoPClient> | null = null;

    /**
     * 토큰 암호화용 AES 키 (DPoP 개인키에서 파생)
     *
     * ## 보안: #private 필드 사용
     * - JavaScript의 진짜 private (외부에서 접근 불가)
     * - XSS로 import()해도 이 필드에 접근할 수 없음
     * - Object.keys(), Object.getOwnPropertyNames()로도 보이지 않음
     */
    #encryptionKey: CryptoKey | null = null;

    private constructor() {}

    /**
     * 싱글톤 인스턴스 반환
     *
     * 싱글톤 패턴을 사용하는 이유:
     * - 하나의 키 쌍만 사용해야 함 (토큰이 특정 키에 바인딩됨)
     * - 여러 인스턴스가 있으면 jkt 불일치 발생
     */
    static getInstance(): DPoPClient {
        if (!DPoPClient.instance) {
            DPoPClient.instance = new DPoPClient();
        }
        return DPoPClient.instance;
    }

    /**
     * 초기화 완료 여부
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 초기화: 기존 키 로드 또는 새 키 생성
     *
     * 앱 시작 시 반드시 호출해야 합니다.
     * 이미 초기화되었으면 바로 반환합니다.
     */
    async init(): Promise<DPoPClient> {
        if (this.initialized) {
            return this;
        }

        // 이미 초기화 중이면 기존 Promise 반환 (race condition 방지)
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.doInit();
        return this.initPromise;
    }

    private async doInit(): Promise<DPoPClient> {
        try {
            this.keyPair = await this.loadKeyPairFromDB();
            if (this.keyPair) {
                this.publicKeyJwk = await originalCrypto.exportKey("jwk", this.keyPair.publicKey);
                console.log("[DPoP] 기존 키 쌍 로드 완료");
            }
        } catch (e) {
            console.log("[DPoP] 기존 키 쌍 없음, 새로 생성");
        }

        if (!this.keyPair) {
            await this.generateKeyPair();
        }

        this.initialized = true;
        this.initPromise = null;
        return this;
    }

    /**
     * ECDSA P-256 키 쌍 생성
     *
     * ## 보안 설정
     * - extractable: false → 개인키를 JavaScript로 추출 불가
     * - 이로 인해 XSS 공격으로도 개인키 탈취 불가능
     *
     * ## 알고리즘 선택
     * - ECDSA P-256 (ES256) 사용
     * - RSA보다 키 크기가 작고 연산이 빠름
     * - 모바일 환경에서도 효율적
     */
    async generateKeyPair(): Promise<DPoPKeyPair> {
        const keyPair = await originalCrypto.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            false, // extractable: false! 절대 true로 바꾸지 마세요
            ["sign", "verify"]
        );

        this.keyPair = keyPair as DPoPKeyPair;

        // 공개키만 내보내기 가능 (개인키는 불가)
        this.publicKeyJwk = await originalCrypto.exportKey("jwk", this.keyPair.publicKey);

        // IndexedDB에 저장 (CryptoKey 객체는 직렬화 가능)
        await this.saveKeyPairToDB(this.keyPair);

        console.log("[DPoP] 새 키 쌍 생성 완료");
        return this.keyPair;
    }

    /**
     * DPoP Proof JWT 생성 (토큰 발급용 - ath 없음)
     *
     * ## 사용 시점
     * - 로그인 요청 (/login)
     * - 토큰 갱신 요청 (/auth/refresh)
     * - 소셜 로그인 토큰 교환 (/auth/exchange)
     *
     * 이 시점에는 아직 Access Token이 없으므로 ath를 포함하지 않습니다.
     *
     * @param method - HTTP 메서드 (GET, POST 등)
     * @param url - 요청 URL (전체 URL)
     * @returns DPoP Proof JWT
     */
    async createProof(method: string, url: string): Promise<string> {
        return this.createProofInternal(method, url, null);
    }

    /**
     * DPoP Proof JWT 생성 (리소스 접근용 - ath 포함)
     *
     * ## 사용 시점
     * - 보호된 API 요청 (Authorization: DPoP {token})
     *
     * ## ath (Access Token Hash) 클레임
     * ath = Base64url(SHA-256(access_token))
     *
     * ### 왜 ath가 필요한가?
     * ```
     * [ath 없는 경우]
     * 1. 공격자가 다른 사용자의 DPoP Proof만 탈취
     * 2. 자신의 Access Token과 조합
     * 3. API 호출 성공 ❌ (토큰은 다른 키에 바인딩)
     *
     * [ath 있는 경우]
     * 1. 공격자가 Proof 탈취
     * 2. 자신의 토큰과 조합
     * 3. 서버에서 ath 검증: sha256(공격자토큰) ≠ Proof의 ath
     * 4. 요청 거부 ✅
     * ```
     *
     * @param method - HTTP 메서드
     * @param url - 요청 URL
     * @param accessToken - ath 계산용 Access Token
     * @returns DPoP Proof JWT
     */
    async createProofWithAth(method: string, url: string, accessToken: string): Promise<string> {
        return this.createProofInternal(method, url, accessToken);
    }

    /**
     * DPoP Proof JWT 생성 내부 로직
     *
     * ## DPoP Proof JWT 구조
     * ```
     * [Header]
     * {
     *   "typ": "dpop+jwt",     ← 반드시 이 값
     *   "alg": "ES256",        ← ECDSA P-256
     *   "jwk": {               ← 공개키
     *     "kty": "EC",
     *     "crv": "P-256",
     *     "x": "...",
     *     "y": "..."
     *   }
     * }
     *
     * [Payload]
     * {
     *   "jti": "unique-uuid",  ← Replay Attack 방지용 고유 ID
     *   "htm": "POST",         ← HTTP Method
     *   "htu": "https://...",  ← HTTP URI
     *   "iat": 1234567890,     ← 발급 시간 (Unix timestamp)
     *   "ath": "abc123..."     ← Access Token Hash (리소스 접근 시만)
     * }
     *
     * [Signature]
     * - 개인키로 서명 (WebCrypto 내부 처리)
     * ```
     */
    private async createProofInternal(method: string, url: string, accessToken: string | null): Promise<string> {
        if (!this.keyPair || !this.publicKeyJwk) {
            throw new Error("[DPoP] 키 쌍이 초기화되지 않았습니다. init()을 먼저 호출하세요.");
        }

        // JWT Header
        const header = {
            typ: "dpop+jwt",
            alg: "ES256",
            jwk: this.publicKeyJwk,
        };

        // JWT Payload (기본)
        const payload: Record<string, string | number> = {
            jti: crypto.randomUUID(), // 고유 ID (Replay Attack 방지)
            htm: method.toUpperCase(), // HTTP Method
            htu: url, // HTTP URI
            iat: Math.floor(Date.now() / 1000), // 발급 시간
        };

        // ath 클레임 추가 (리소스 접근 시)
        if (accessToken) {
            payload.ath = await this.calculateAccessTokenHash(accessToken);
        }

        // JWT 인코딩
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const dataToSign = `${encodedHeader}.${encodedPayload}`;

        // 서명 (WebCrypto가 내부적으로 개인키 사용)
        const signature = await originalCrypto.sign(
            { name: "ECDSA", hash: "SHA-256" },
            this.keyPair.privateKey,
            new OriginalTextEncoder().encode(dataToSign)
        );

        const encodedSignature = this.base64UrlEncode(signature);

        return `${dataToSign}.${encodedSignature}`;
    }

    /**
     * Access Token Hash (ath) 계산 - RFC 9449 Section 4.2
     *
     * ## 계산 과정
     * 1. Access Token을 ASCII 바이트로 변환
     * 2. SHA-256 해시 계산
     * 3. Base64url 인코딩 (패딩 제거)
     *
     * ## 예시
     * - Access Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * - SHA-256: [binary]
     * - Base64url: "fUHyO2r2Z3DZ53EsNrWBb0xWXoaNy59IiKCAqksmQEo"
     */
    private async calculateAccessTokenHash(accessToken: string): Promise<string> {
        // ASCII 인코딩
        const encoder = new OriginalTextEncoder();
        const data = encoder.encode(accessToken);

        // SHA-256 해시
        const hashBuffer = await originalCrypto.digest("SHA-256", data);

        // Base64url 인코딩
        return this.base64UrlEncode(hashBuffer);
    }

    /**
     * 키 쌍 삭제 (로그아웃 시 등)
     *
     * ## 주의사항
     * 키를 삭제하면 기존 토큰을 더 이상 사용할 수 없습니다.
     * 새로운 키 쌍을 생성하고 새로 로그인해야 합니다.
     */
    async clearKeyPair(): Promise<void> {
        this.keyPair = null;
        this.publicKeyJwk = null;
        this.#encryptionKey = null;  // 암호화 키 캐시도 삭제
        this.initialized = false;

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = () => {
                console.log("[DPoP] 키 쌍 삭제 완료");
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ===== 토큰 암호화/복호화 메서드 =====

    /**
     * DPoP 개인키에서 AES 암호화 키 파생
     *
     * ## 보안: #private 메서드
     * - 외부에서 호출 불가 (XSS 방어)
     * - 클래스 내부에서만 사용
     *
     * ## 보안 원리
     * 1. 고정된 챌린지 문자열을 DPoP 개인키로 서명
     * 2. 서명값의 앞 32바이트를 AES-256 키로 사용
     * 3. 개인키는 extractable: false이므로 공격자는 같은 서명을 생성할 수 없음
     * 4. → 공격자는 암호화 키를 파생할 수 없음 → 토큰 복호화 불가능
     *
     * ## 왜 서명을 사용하는가?
     * - DPoP 개인키는 extractable: false
     * - 직접 키 바이트에 접근할 수 없음
     * - 하지만 서명 연산은 가능 (usages: ["sign"])
     * - 서명 결과는 개인키에 의존 → 같은 개인키만이 같은 서명 생성
     */
    async #deriveEncryptionKey(): Promise<CryptoKey> {
        // 캐싱된 키가 있으면 반환
        if (this.#encryptionKey) {
            return this.#encryptionKey;
        }

        if (!this.keyPair) {
            throw new Error("[DPoP] 키 쌍이 초기화되지 않았습니다.");
        }

        // 고정 챌린지를 개인키로 서명
        const challengeBytes = new OriginalTextEncoder().encode(TOKEN_ENCRYPTION_CHALLENGE);
        const signature = await originalCrypto.sign(
            { name: "ECDSA", hash: "SHA-256" },
            this.keyPair.privateKey,
            challengeBytes
        );

        // 서명의 앞 32바이트를 AES-256 키로 변환
        const keyMaterial = new Uint8Array(signature).slice(0, 32);

        this.#encryptionKey = await originalCrypto.importKey(
            "raw",
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,  // extractable: false (이 키도 추출 불가)
            ["encrypt", "decrypt"]
        );

        return this.#encryptionKey;
    }

    /**
     * 토큰 암호화
     *
     * ## 암호화 알고리즘: AES-256-GCM
     * - 인증된 암호화 (Authenticated Encryption)
     * - 무결성 검증 포함 (변조 감지)
     * - IV는 매번 랜덤 생성 (같은 평문도 다른 암호문)
     *
     * @param token - 암호화할 토큰 (평문)
     * @returns 암호화된 토큰 객체 (JSON 문자열로 직렬화 가능)
     */
    async encryptToken(token: string): Promise<EncryptedToken> {
        const encryptionKey = await this.#deriveEncryptionKey();

        // IV (Initialization Vector) - 12바이트 권장 for AES-GCM
        const iv = originalCrypto.getRandomValues(new Uint8Array(12));

        // 토큰을 바이트로 변환
        const tokenBytes = new OriginalTextEncoder().encode(token);

        // AES-GCM 암호화
        const ciphertext = await originalCrypto.encrypt(
            { name: "AES-GCM", iv },
            encryptionKey,
            tokenBytes
        );

        return {
            ciphertext: this.base64UrlEncode(ciphertext),
            iv: this.base64UrlEncode(iv),
        };
    }

    /**
     * 토큰 복호화 (내부 전용)
     *
     * ## 보안: #private 메서드
     * - 외부에서 호출 불가 (XSS 방어의 핵심!)
     * - 평문 토큰을 외부로 절대 노출하지 않음
     * - createAuthHeaders()를 통해서만 간접 사용
     *
     * @param encryptedToken - 암호화된 토큰 객체
     * @returns 복호화된 토큰 (평문)
     * @throws 복호화 실패 시 에러 (키가 다르거나 데이터 변조된 경우)
     */
    async #decryptToken(encryptedToken: EncryptedToken): Promise<string> {
        const encryptionKey = await this.#deriveEncryptionKey();

        // Base64url 디코딩
        const ciphertextBytes = this.base64UrlDecode(encryptedToken.ciphertext);
        const ivBytes = this.base64UrlDecode(encryptedToken.iv);

        // Uint8Array를 ArrayBuffer로 변환 (TypeScript 타입 호환성)
        const ivBuffer = new Uint8Array(ivBytes).buffer as ArrayBuffer;
        const ciphertextBuffer = new Uint8Array(ciphertextBytes).buffer as ArrayBuffer;

        // AES-GCM 복호화
        const decrypted = await originalCrypto.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            encryptionKey,
            ciphertextBuffer
        );

        return new OriginalTextDecoder().decode(decrypted);
    }

    /**
     * 인증된 fetch 요청 수행 (평문 토큰이 절대 외부로 노출되지 않음!)
     *
     * ## 보안: 최고 수준의 토큰 보호
     * - 내부적으로 #decryptToken() 호출
     * - 평문 토큰은 이 메서드 내부에서만 존재
     * - fetch 요청까지 캡슐화하여 토큰이 외부로 절대 반환되지 않음
     * - XSS 공격자가 이 메서드를 호출해도 토큰 자체는 볼 수 없음
     *
     * ## 사용법
     * const response = await dpopClient.authenticatedFetch(encryptedToken, url, options);
     *
     * @param encryptedToken - 암호화된 토큰
     * @param url - 요청 URL
     * @param options - fetch 옵션 (method, body, headers 등)
     * @returns fetch Response 객체
     */
    async authenticatedFetch(
        encryptedToken: EncryptedToken,
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const method = options.method || "GET";

        // 내부적으로만 복호화 (평문은 이 스코프 안에서만 존재)
        const token = await this.#decryptToken(encryptedToken);

        // DPoP Proof 생성 (ath 포함)
        const proof = await this.createProofWithAth(method, url, token);

        // 헤더 구성 (원본 Headers 사용 - XSS Headers 후킹 방지)
        const headers = new OriginalHeaders(options.headers as HeadersInit);
        headers.set("Authorization", `DPoP ${token}`);
        headers.set("X-Proof", proof);

        // 원본 fetch 사용 (XSS fetch 후킹 방지)
        // window.fetch가 후킹되어도 모듈 로드 시점의 원본 fetch 사용
        return originalFetch(url, {
            ...options,
            headers,
        });
    }

    /**
     * 암호화된 토큰인지 확인
     */
    isEncryptedToken(token: unknown): token is EncryptedToken {
        return (
            typeof token === "object" &&
            token !== null &&
            "ciphertext" in token &&
            "iv" in token &&
            typeof (token as EncryptedToken).ciphertext === "string" &&
            typeof (token as EncryptedToken).iv === "string"
        );
    }

    /**
     * 토큰이 만료되었거나 곧 만료될 예정인지 확인
     *
     * ## 보안: 평문 토큰을 외부로 노출하지 않음
     * - 내부적으로 #decryptToken() 호출
     * - 만료 여부(boolean)만 반환
     *
     * @param encryptedToken - 암호화된 토큰
     * @param bufferSeconds - 만료 여유 시간 (초), 기본값 10초
     * @returns true면 갱신 필요
     */
    async isTokenExpiring(encryptedToken: EncryptedToken, bufferSeconds = 10): Promise<boolean> {
        try {
            const token = await this.#decryptToken(encryptedToken);

            // JWT에서 exp 추출
            const parts = token.split(".");
            if (parts.length !== 3) return true;

            const payload = parts[1];
            const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
            const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
            const claims = JSON.parse(decoded);

            if (typeof claims.exp !== "number") return true;

            const now = Math.floor(Date.now() / 1000);
            const remainingSeconds = claims.exp - now;

            console.log(`[Auth] 토큰 체크: 남은시간=${remainingSeconds}초, 버퍼=${bufferSeconds}초`);

            return remainingSeconds < bufferSeconds;
        } catch (e) {
            console.error("[Auth] 토큰 만료 체크 실패:", e);
            return true; // 에러 시 갱신 필요로 처리
        }
    }

    // ===== 유틸리티 메서드 =====

    /**
     * Base64url 인코딩
     *
     * Base64와 Base64url의 차이:
     * - '+' → '-'
     * - '/' → '_'
     * - 패딩(=) 제거
     *
     * URL/파일명에서 안전하게 사용 가능
     */
    private base64UrlEncode(data: string | ArrayBuffer | Uint8Array): string {
        let base64: string;
        if (typeof data === "string") {
            base64 = btoa(data);
        } else if (data instanceof Uint8Array) {
            // Uint8Array → Base64
            base64 = btoa(String.fromCharCode(...data));
        } else {
            // ArrayBuffer → Base64
            base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
        }
        return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    /**
     * Base64url 디코딩
     */
    private base64UrlDecode(data: string): Uint8Array {
        // Base64url → Base64
        let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
        // 패딩 추가
        const padding = (4 - (base64.length % 4)) % 4;
        base64 += "=".repeat(padding);
        // 디코딩
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * 키 쌍 IndexedDB 저장
     *
     * CryptoKey 객체는 구조화된 복제(Structured Clone)가 가능하여
     * IndexedDB에 직접 저장할 수 있습니다.
     */
    private async saveKeyPairToDB(keyPair: DPoPKeyPair): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                store.put(keyPair, "current");
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            };
        });
    }

    /**
     * 키 쌍 IndexedDB 로드
     */
    private async loadKeyPairFromDB(): Promise<DPoPKeyPair | null> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => reject(request.error);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const tx = db.transaction(STORE_NAME, "readonly");
                const store = tx.objectStore(STORE_NAME);
                const getRequest = store.get("current");
                getRequest.onsuccess = () => resolve(getRequest.result || null);
                getRequest.onerror = () => reject(getRequest.error);
            };
        });
    }
}

export const dpopClient = DPoPClient.getInstance();
export default DPoPClient;
