import { Box, useTheme } from '@mui/material'
import * as atoms from './stores/atoms'
import { useAtomValue } from 'jotai'
import InputBox from './components/InputBox'
import MessageList from './components/MessageList'
import ScrollToBottomButton from './components/ScrollToBottomButton'
import { drawerWidth } from './Sidebar'
import Header from './components/Header'
import { ModelSelectDialog } from '@/components/ModelSelectDialog'
import React, { useEffect, useState } from 'react'
import { useAtom } from 'jotai/index'
import { settingsAtom } from './stores/atoms'
import { Settings } from '../shared/types'
import { useSwipeable } from 'react-swipeable'

interface Props {
    toggleSidebar: (newOpen: boolean) => void
}

export default function MainPane(props: Props) {
    const theme = useTheme()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const [openModelSelect, setOpenModelSelect] = useState(false)
    const [settings, setSettings] = useAtom(settingsAtom)
    const [settingsEdit, _setSettingsEdit] = React.useState<Settings>(settings)
    const setSettingsEdit = (updated: Settings) => {
        _setSettingsEdit(updated)
    }
    const showScrollToBottom = useAtomValue(atoms.showScrollToBottom)
    const atBottom = useAtomValue(atoms.atBottomAtom)
    const bottomOverlayRef = React.useRef<HTMLDivElement>(null)
    const [, setBottomOverlayHeightAtom] = useAtom(atoms.bottomOverlayHeightAtom)
    const scrollPositionCache = new WeakMap<HTMLElement, number>()
    function isElementOrParentsScrollable(element: HTMLElement | null): boolean {
        if (!element) return false
        let currentElement: HTMLElement | null = element
        while (currentElement) {
            const styles = window.getComputedStyle(currentElement)
            const overflowX = styles.getPropertyValue('overflow-x')
            if (
                (overflowX === 'auto' || overflowX === 'scroll') &&
                currentElement.scrollWidth > currentElement.clientWidth
            ) {
                // if it's scrollable however the scroll position is on the left most
                // return false hence it is still able to open the sidebar.
                const lastScrollLeft = scrollPositionCache.get(currentElement) ?? 0
                const currentScrollLeft = currentElement.scrollLeft
                scrollPositionCache.set(currentElement, currentScrollLeft)
                return !(lastScrollLeft >= 0 && currentScrollLeft === 0)
            }

            currentElement = currentElement.parentElement
            if (currentElement === document.body) break
        }

        return false
    }

    const swipeHandlers = useSwipeable({
        onSwipedRight: (eventData) => {
            if (eventData.event.target) {
                // ignore scrollable element.
                const d = isElementOrParentsScrollable(eventData.event.target as HTMLElement)
                if (d) return
            }
            props.toggleSidebar(true)
        },
        delta: 40,
        trackTouch: true,
    })

    useEffect(() => {
        _setSettingsEdit(settingsEdit)
    }, [settings])

    useEffect(() => {
        const el = bottomOverlayRef.current
        if (!el) return
        const update = () => setBottomOverlayHeightAtom(el.offsetHeight)
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [bottomOverlayRef])
    return (
        <Box
            className="h-full w-full"
            sx={{
                flexGrow: 1,
                height: '100%', // Add explicit height
                display: 'flex', // Ensure flex container
                flexDirection: 'column',
                position: 'relative',
            }}
        >
            <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-gray-100/40 dark:to-indigo-500/15">
                <Header toggleSidebar={props.toggleSidebar} toggleModelSelect={setOpenModelSelect} />
                <ModelSelectDialog
                    open={openModelSelect}
                    settings={settings}
                    onClose={() => setOpenModelSelect(false)}
                />
                <div className="flex-1 min-h-0" {...swipeHandlers}>
                    <MessageList />
                </div>
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingTop: 10,
                        paddingLeft: 12,
                        paddingRight: 12,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.75) 100%' : 'rgba(255,255,255,0.4) 80%, rgba(255,255,255,0.95) 100%'} )`
                    }}
                    ref={bottomOverlayRef}
                >
                    <ScrollToBottomButton />
                    <InputBox currentSessionId={currentSession.id} currentSessionType={currentSession.type || 'chat'} />
                </div>
            </div>
        </Box>
    )
}
