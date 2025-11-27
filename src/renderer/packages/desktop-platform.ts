import { getCurrentWindow } from '@tauri-apps/api/window'
import { PlatformInterface } from '@/packages/platform.interface'

export class DesktopPlatform implements PlatformInterface {
    public constructor() {}

    public async shouldUseDarkColors(): Promise<boolean> {
        try {
            const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
            if (media) return media.matches
        } catch {}
        try {
            const theme = await getCurrentWindow().theme()
            return theme === 'dark'
        } catch {}
        return false
    }

    public async onSystemThemeChange(callback: () => void): Promise<void> {
        try {
            const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
            if (media) {
                const handler = () => callback()
                if ('addEventListener' in media) {
                    media.addEventListener('change', handler)
                } else if ('addListener' in media) {
                    (media as any).addListener(handler)
                }
                return
            }
        } catch {}
        try {
            await getCurrentWindow().onThemeChanged(() => {
                callback()
            })
        } catch {}
    }

    public onWindowShow(callback: () => void): () => void {
        // const unlisten = Event.listen('tauri://focus', callback);
        // return () => unlisten.then(f => f());
        return () => {}
    }
}