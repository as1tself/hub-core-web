// src/hooks/useLocale.ts
import { useEffect } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import { toggleLocale, setLocale, initializeLocale } from "../store/slices/localeSlice";
import type { LocaleMode } from "../store/slices/localeSlice";
import { translations } from "../i18n/translations";

export const useLocale = () => {
    const dispatch = useAppDispatch();
    const { mode, resolvedLocale } = useAppSelector((state) => state.locale);

    useEffect(() => {
        dispatch(initializeLocale());
    }, [dispatch]);

    // 번역 텍스트 가져오기
    const t = translations[resolvedLocale];

    return {
        locale: resolvedLocale,
        mode,
        isKorean: resolvedLocale === "ko",
        isEnglish: resolvedLocale === "en",
        t,
        toggleLocale: () => dispatch(toggleLocale()),
        setLocale: (mode: LocaleMode) => dispatch(setLocale(mode)),
    };
};
