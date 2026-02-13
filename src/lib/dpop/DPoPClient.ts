const DB_NAME = "dpop-keys";
const STORE_NAME = "keyPair";

const originalFetch = fetch.bind(window);
const OriginalHeaders = Headers;
const OriginalTextEncoder = TextEncoder;
const OriginalTextDecoder = TextDecoder;

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

const TOKEN_ENCRYPTION_CHALLENGE = "hub-token-encryption-key-v1";

export interface DPoPKeyPair {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
}

export interface EncryptedToken {
    ciphertext: string;
    iv: string;
}

class DPoPClient {
    private static instance: DPoPClient | null = null;
    private keyPair: DPoPKeyPair | null = null;
    private publicKeyJwk: JsonWebKey | null = null;
    private initialized = false;
    private initPromise: Promise<DPoPClient> | null = null;
    #encryptionKey: CryptoKey | null = null;

    private constructor() {}

    static getInstance(): DPoPClient {
        if (!DPoPClient.instance) {
            DPoPClient.instance = new DPoPClient();
        }
        return DPoPClient.instance;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    async init(): Promise<DPoPClient> {
        if (this.initialized) {
            return this;
        }

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
        } catch {
            console.log("[DPoP] 기존 키 쌍 없음, 새로 생성");
        }

        if (!this.keyPair) {
            await this.generateKeyPair();
        }

        this.initialized = true;
        this.initPromise = null;
        return this;
    }

    async generateKeyPair(): Promise<DPoPKeyPair> {
        const keyPair = await originalCrypto.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            false,
            ["sign", "verify"]
        );

        this.keyPair = keyPair as DPoPKeyPair;
        this.publicKeyJwk = await originalCrypto.exportKey("jwk", this.keyPair.publicKey);
        await this.saveKeyPairToDB(this.keyPair);

        console.log("[DPoP] 새 키 쌍 생성 완료");
        return this.keyPair;
    }

    async createProof(method: string, url: string): Promise<string> {
        return this.createProofInternal(method, url, null);
    }

    async createProofWithAth(method: string, url: string, accessToken: string): Promise<string> {
        return this.createProofInternal(method, url, accessToken);
    }

    private async createProofInternal(method: string, url: string, accessToken: string | null): Promise<string> {
        if (!this.keyPair || !this.publicKeyJwk) {
            throw new Error("[DPoP] 키 쌍이 초기화되지 않았습니다. init()을 먼저 호출하세요.");
        }

        const header = {
            typ: "dpop+jwt",
            alg: "ES256",
            jwk: this.publicKeyJwk,
        };

        const payload: Record<string, string | number> = {
            jti: crypto.randomUUID(),
            htm: method.toUpperCase(),
            htu: url,
            iat: Math.floor(Date.now() / 1000),
        };

        if (accessToken) {
            payload.ath = await this.calculateAccessTokenHash(accessToken);
        }

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const dataToSign = `${encodedHeader}.${encodedPayload}`;

        const signature = await originalCrypto.sign(
            { name: "ECDSA", hash: "SHA-256" },
            this.keyPair.privateKey,
            new OriginalTextEncoder().encode(dataToSign)
        );

        const encodedSignature = this.base64UrlEncode(signature);

        return `${dataToSign}.${encodedSignature}`;
    }

    private async calculateAccessTokenHash(accessToken: string): Promise<string> {
        const encoder = new OriginalTextEncoder();
        const data = encoder.encode(accessToken);
        const hashBuffer = await originalCrypto.digest("SHA-256", data);
        return this.base64UrlEncode(hashBuffer);
    }

    async clearKeyPair(): Promise<void> {
        this.keyPair = null;
        this.publicKeyJwk = null;
        this.#encryptionKey = null;
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

    async #deriveEncryptionKey(): Promise<CryptoKey> {
        if (this.#encryptionKey) {
            return this.#encryptionKey;
        }

        if (!this.keyPair) {
            throw new Error("[DPoP] 키 쌍이 초기화되지 않았습니다.");
        }

        const challengeBytes = new OriginalTextEncoder().encode(TOKEN_ENCRYPTION_CHALLENGE);
        const signature = await originalCrypto.sign(
            { name: "ECDSA", hash: "SHA-256" },
            this.keyPair.privateKey,
            challengeBytes
        );

        const keyMaterial = new Uint8Array(signature).slice(0, 32);

        this.#encryptionKey = await originalCrypto.importKey(
            "raw",
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );

        return this.#encryptionKey;
    }

    async encryptToken(token: string): Promise<EncryptedToken> {
        const encryptionKey = await this.#deriveEncryptionKey();
        const iv = originalCrypto.getRandomValues(new Uint8Array(12));
        const tokenBytes = new OriginalTextEncoder().encode(token);

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

    async #decryptToken(encryptedToken: EncryptedToken): Promise<string> {
        const encryptionKey = await this.#deriveEncryptionKey();
        const ciphertextBytes = this.base64UrlDecode(encryptedToken.ciphertext);
        const ivBytes = this.base64UrlDecode(encryptedToken.iv);
        const ivBuffer = new Uint8Array(ivBytes).buffer as ArrayBuffer;
        const ciphertextBuffer = new Uint8Array(ciphertextBytes).buffer as ArrayBuffer;

        const decrypted = await originalCrypto.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            encryptionKey,
            ciphertextBuffer
        );

        return new OriginalTextDecoder().decode(decrypted);
    }

    async authenticatedFetch(
        encryptedToken: EncryptedToken,
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const method = options.method || "GET";
        const token = await this.#decryptToken(encryptedToken);
        const proof = await this.createProofWithAth(method, url, token);

        const headers = new OriginalHeaders(options.headers as HeadersInit);
        headers.set("Authorization", `X-Proof ${token}`);
        headers.set("X-Proof", proof);

        return originalFetch(url, {
            ...options,
            headers,
        });
    }

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

    async isTokenExpiring(encryptedToken: EncryptedToken, bufferSeconds = 10): Promise<boolean> {
        try {
            const token = await this.#decryptToken(encryptedToken);
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
            return true;
        }
    }

    private base64UrlEncode(data: string | ArrayBuffer | Uint8Array): string {
        let base64: string;
        if (typeof data === "string") {
            base64 = btoa(data);
        } else if (data instanceof Uint8Array) {
            base64 = btoa(String.fromCharCode(...data));
        } else {
            base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
        }
        return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    private base64UrlDecode(data: string): Uint8Array {
        let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
        const padding = (4 - (base64.length % 4)) % 4;
        base64 += "=".repeat(padding);
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

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
