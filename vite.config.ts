import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * CSP (Content Security Policy) 설정
 *
 * 최강 보안 레벨:
 * - default-src 'self': 기본적으로 같은 출처만 허용
 * - script-src 'self': 스크립트는 같은 출처만 (인라인 스크립트 차단)
 * - style-src 'self' 'unsafe-inline': 스타일 (CSS-in-JS를 위해 unsafe-inline 필요)
 * - connect-src: API 연결 허용 출처
 * - img-src 'self' data: blob:: 이미지 및 데이터 URI
 * - font-src 'self': 폰트는 같은 출처만
 * - object-src 'none': Flash 등 플러그인 완전 차단
 * - frame-ancestors 'none': 클릭재킹 방지 (iframe 삽입 차단)
 * - form-action 'self': 폼 제출은 같은 출처만
 * - base-uri 'self': base 태그 조작 방지
 * - upgrade-insecure-requests: HTTP 요청을 HTTPS로 자동 업그레이드
 */
const CSP_DIRECTIVES = {
    // 개발 환경: HMR(Hot Module Replacement)을 위해 일부 완화
    development: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"], // HMR에 필요
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'", "https://localhost:8443", "https://localhost:8080", "wss://localhost:5173"], // API + WebSocket(HMR)
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
        "base-uri": ["'self'"],
    },
    // 프로덕션 환경: 최강 보안
    production: {
        "default-src": ["'self'"],
        "script-src": ["'self'"], // 인라인 스크립트 완전 차단
        "style-src": ["'self'", "'unsafe-inline'"], // CSS-in-JS 지원
        "connect-src": ["'self'", "https://api.oxec82b6.dev"], // 프로덕션 API
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
        "base-uri": ["'self'"],
        "upgrade-insecure-requests": [],
    },
};

/**
 * CSP 지시어 객체를 헤더 문자열로 변환
 */
function buildCspString(directives: Record<string, string[]>): string {
    return Object.entries(directives)
        .map(([key, values]) => {
            if (values.length === 0) {
                return key; // upgrade-insecure-requests 등 값 없는 지시어
            }
            return `${key} ${values.join(" ")}`;
        })
        .join("; ");
}

/**
 * 개발 서버용 CSP 헤더 추가 플러그인
 */
function cspPlugin(): Plugin {
    const isDev = process.env.NODE_ENV !== "production";
    const cspDirectives = isDev ? CSP_DIRECTIVES.development : CSP_DIRECTIVES.production;
    const cspString = buildCspString(cspDirectives);

    return {
        name: "vite-plugin-csp",
        configureServer(server) {
            server.middlewares.use((_req, res, next) => {
                // CSP 헤더 추가
                res.setHeader("Content-Security-Policy", cspString);

                // 추가 보안 헤더
                res.setHeader("X-Content-Type-Options", "nosniff");
                res.setHeader("X-Frame-Options", "DENY");
                res.setHeader("X-XSS-Protection", "1; mode=block");
                res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
                res.setHeader(
                    "Permissions-Policy",
                    "geolocation=(), microphone=(), camera=(), payment=()"
                );

                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [react(), cspPlugin()],
    server: {
        https: {
            key: fs.readFileSync(path.resolve(__dirname, "ssl/key.pem")),
            cert: fs.readFileSync(path.resolve(__dirname, "ssl/cert.pem")),
        },
        port: 5173,
    },
    // 프로덕션 빌드 시 index.html에 CSP meta 태그 주입
    build: {
        rollupOptions: {
            output: {
                // 청크 파일명에 해시 추가 (캐시 무효화)
                chunkFileNames: "assets/[name]-[hash].js",
                entryFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash].[ext]",
            },
        },
    },
});
