import { useMemo, useLayoutEffect } from 'react'
import { getDefaultStore, useAtomValue } from 'jotai'
import { activeThemeAtom, themeAtom, fontSizeAtom, uiScaleAtom } from '../stores/atoms'
import { createTheme } from '@mui/material/styles'
import { ThemeOptions } from '@mui/material/styles'
import { Theme } from '../../shared/types'
import platform from '../packages/platform'

export const switchTheme = async (theme: Theme) => {
    const store = getDefaultStore()
    if (theme === Theme.FollowSystem) {
        const isDark = await platform.shouldUseDarkColors()
        store.set(activeThemeAtom, isDark ? 'dark' : 'light')
    } else {
        store.set(activeThemeAtom, theme === Theme.DarkMode ? 'dark' : 'light')
    }
}

export default function useAppTheme() {
    const theme = useAtomValue(themeAtom)
    const fontSize = useAtomValue(fontSizeAtom)
    const activeTheme = useAtomValue(activeThemeAtom)
    const uiScale = useAtomValue(uiScaleAtom)

    useLayoutEffect(() => {
        switchTheme(theme)
    }, [theme])

    useLayoutEffect(() => {
        platform.onSystemThemeChange(() => {
            const store = getDefaultStore()
            const theme = store.get(themeAtom)
            switchTheme(theme)
        })
    }, [])

    useLayoutEffect(() => {
        // update material-ui theme
        document.querySelector('html')?.setAttribute('data-theme', activeTheme)
        // update tailwindcss theme
        if (activeTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [activeTheme])

    useLayoutEffect(() => {
        const base = 16
        document.documentElement.style.fontSize = `${base * uiScale}px`
    }, [uiScale])

    const themeObj = useMemo(() => createTheme(getThemeDesign(activeTheme, fontSize)), [activeTheme, fontSize])
    return themeObj
}

export function getThemeDesign(realTheme: 'light' | 'dark', fontSize: number): ThemeOptions {
    return {
        palette: {
            mode: realTheme,
            ...(realTheme === 'light'
                ? {}
                : {
                    background: {
                        default: 'rgb(40, 40, 40)',
                        paper: 'rgb(40, 40, 40)',
                    },
                }),
        },
        typography: {
            fontSize,
            fontFamily: "ui-sans-serif, -apple-system, system-ui, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol'",
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    html: {
                        tabSize: 4,
                    },
                    body: {
                        fontFamily: "ui-sans-serif, -apple-system, system-ui, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol'",
                    },
                    'pre, code, textarea, .msg-content': {
                        tabSize: 4,
                    },
                },
            },
        },
    }
}
