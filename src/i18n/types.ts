// src/i18n/types.ts

export type LocaleMode = "system" | "ko" | "en";
export type ResolvedLocale = "ko" | "en";

export interface TranslationKeys {
    // 공통
    common: {
        login: string;
        logout: string;
        register: string;
        search: string;
        prev: string;
        next: string;
        settings: string;
        noData: string;
        loading: string;
        continue: string;
        or: string;
        edit: string;
        delete: string;
        cancel: string;
        save: string;
        confirm: string;
    };

    // 네비게이션
    nav: {
        home: string;
        myInfo: string;
        notifications: string;
        clearAll: string;
        noNotifications: string;
        viewProfile: string;
        openApiIssue: string;
        apiHistory: string;
        loginRequired: string;
        checkingLogin: string;
    };

    // 대시보드
    dashboard: {
        title: string;
        subtitle: string;
        totalRequests: string;
        successRate: string;
        activeUsers: string;
        perMonth: string;
        uptime: string;
        currentlyOnline: string;
        recentApiCalls: string;
        viewAll: string;
        status: string;
        method: string;
        path: string;
        latency: string;
        time: string;
        ok: string;
        created: string;
        error: string;
    };

    // API 내역
    apiHistory: {
        title: string;
        seq: string;
        status: string;
        method: string;
        path: string;
        clientIp: string;
        elapsed: string;
        timestamp: string;
        sort: string;
        newest: string;
        oldest: string;
        searchPlaceholder: string;
    };

    // 프로필/내 정보
    user: {
        title: string;
        subtitle: string;
        systemAdmin: string;
        editInfo: string;
        userId: string;
        nickname: string;
        email: string;
        socialLogin: string;
        connected: string;
        notConnected: string;
        securitySettings: string;
        changePassword: string;
        changePasswordDesc: string;
        socialUserCannotChange: string;
        twoFactorAuth: string;
        twoFactorDesc: string;
        comingSoon: string;
        change: string;
    };

    // 로그인/회원가입
    auth: {
        loginTitle: string;
        username: string;
        password: string;
        enterCredentials: string;
        wrongCredentials: string;
        continueWithGoogle: string;
        continueWithNaver: string;
        registerTitle: string;
        nicknamePlaceholder: string;
        emailPlaceholder: string;
        usernamePlaceholder: string;
        passwordPlaceholder: string;
        checkDuplicate: string;
        checking: string;
        usernameTaken: string;
        usernameAvailable: string;
        registering: string;
        validationError: string;
        registerError: string;
        noAccount: string;
        hasAccount: string;
    };

    // 사이드바
    sidebar: {
        changelog: string;
        notice: string;
    };

    // 시간 포맷
    time: {
        justNow: string;
        minutesAgo: (n: number) => string;
        hoursAgo: (n: number) => string;
        daysAgo: (n: number) => string;
    };

    // 토큰/인증 에러
    tokenError: {
        alreadyRotated: string;
        sessionInvalidated: string;
        reuseDetected: string;
        unknown: string;
    };
}
