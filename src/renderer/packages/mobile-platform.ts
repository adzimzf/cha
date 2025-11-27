import { PlatformInterface } from '@/packages/platform.interface'

export class MobilePlatform implements PlatformInterface {
    public constructor() {}

    public async shouldUseDarkColors(): Promise<boolean> {
        try {
            const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
            if (media) return media.matches
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
            }
        } catch {}
    }

    public onWindowShow(callback: () => void): () => void {
        // const unlisten = Event.listen('tauri://focus', callback);
        // return () => unlisten.then(f => f());
        return () => {}
    }
}
