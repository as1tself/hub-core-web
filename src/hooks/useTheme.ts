import { useEffect } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import { toggleTheme, syncWithSystem, setTheme, initializeTheme } from "../store/slices/themeSlice";
import type { ThemeMode } from "../store/slices/themeSlice";

export const useTheme = () => {
    const dispatch = useAppDispatch();
    const { mode, resolvedTheme } = useAppSelector((state) => state.theme);

    useEffect(() => {
        dispatch(initializeTheme());

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => dispatch(syncWithSystem());

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [dispatch]);

    return {
        theme: resolvedTheme,
        mode,
        isDark: resolvedTheme === "dark",
        toggleTheme: () => dispatch(toggleTheme()),
        setTheme: (mode: ThemeMode) => dispatch(setTheme(mode)),
    };
};
