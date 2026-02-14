# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# 빌드 시 주입되는 환경변수 (Vite는 빌드 타임에 env 임베딩)
ARG VITE_BACKEND_API_BASE_URL=https://api.dev-personal.com

# 의존성 캐시 레이어
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:alpine

# 타임존 설정 (root로 실행 후 nginx 유저로 전환)
USER root
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone \
    && apk del tzdata

# 기본 nginx 설정 제거 후 커스텀 설정 복사
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/conf.d/security-headers.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# CSP 리포트 로그 파일 생성 (nginx 유저 쓰기 권한)
RUN touch /var/log/nginx/csp-reports.log \
    && chown nginx:nginx /var/log/nginx/csp-reports.log

# 빌드 산출물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# non-root 유저로 전환
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
