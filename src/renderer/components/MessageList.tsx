import { useEffect, useMemo, useRef } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

interface Props { }

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessageList = useAtomValue(atoms.currentMessageListAtom)
    const editingLockIndex = useAtomValue(atoms.editingLockIndexAtom)
    const editingMessage = useAtomValue(atoms.editingMessageAtom)
    const setEditingLockIndex = useSetAtom(atoms.editingLockIndexAtom)
    const isEditingCurrent = !!editingMessage && editingMessage.sessionId === currentSession.id
    const effectiveLockIndex = isEditingCurrent ? editingLockIndex : null
    const visibleList = useMemo(() => {
        if (effectiveLockIndex === null) return currentMessageList
        return currentMessageList.slice(0, Math.max(0, effectiveLockIndex + 1))
    }, [currentMessageList, effectiveLockIndex])
    const ref = useRef<VirtuosoHandle>(null);
    const [, setMessageListRef] = useAtom(atoms.messageListRefAtom)
    const [, setShowScrollToBottom] = useAtom(atoms.showScrollToBottom)
    const [, setAtBottom] = useAtom(atoms.atBottomAtom)
    const atBottomValue = useAtomValue(atoms.atBottomAtom)
    const bottomOverlayHeight = useAtomValue(atoms.bottomOverlayHeightAtom)
    const showRef = useRef<boolean>(false)
    const atBottomTimerRef = useRef<number | null>(null)
    useEffect(() => {
        setMessageListRef(ref)
    }, [ref])

    useEffect(() => {
        if (!ref.current) return
        // when locking, ensure we are positioned at the end of the visible list
        if (effectiveLockIndex !== null) {
            ref.current.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' })
        }
    }, [effectiveLockIndex])

    useEffect(() => {
        if (effectiveLockIndex === null) return
        const anyGenerating = currentMessageList.some((m) => m.generating)
        if (!anyGenerating && !isEditingCurrent) {
            setEditingLockIndex(null)
        }
    }, [currentMessageList, effectiveLockIndex, isEditingCurrent])

    const ScrollSeekPlaceholder =  ({ height, index, context: { randomHeights }}) => (
        <div
            style={{
                height,
                padding: "8px",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    background: index % 2 ? "#ccc": "#eee",
                    height: randomHeights[index % 10],
                }}
            >
            </div>
        </div>
    )

    return (
        <Virtuoso
            style={{ height: '100%', width: '100%' }}
            ref={ref}
            data={visibleList}
            onScroll={(e:any)=> {
                if (!e.target) return;
                const scrollHeight = e.target.scrollHeight
                const scrollTop = e.target.scrollTop
                const clientHeight = e.target.clientHeight
                const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

                const HIGH = 140
                const LOW = 20
                if (showRef.current) {
                    if (distanceFromBottom <= LOW) {
                        showRef.current = false
                        setShowScrollToBottom(false)
                    }
                } else {
                    if (distanceFromBottom >= HIGH) {
                        showRef.current = true
                        setShowScrollToBottom(true)
                    }
                }

                const STABLE_THRESHOLD = 4
                if (distanceFromBottom <= STABLE_THRESHOLD) {
                    if (atBottomTimerRef.current === null) {
                        atBottomTimerRef.current = window.setTimeout(() => {
                            setAtBottom(true)
                            atBottomTimerRef.current = null
                        }, 120)
                    }
                } else {
                    if (atBottomTimerRef.current !== null) {
                        clearTimeout(atBottomTimerRef.current)
                        atBottomTimerRef.current = null
                    }
                    setAtBottom(false)
                }
            }}
            itemContent={(index, msg) => (
                <>
                    <Message
                        id={msg.id}
                        key={'msg-' + msg.id}
                        msg={msg}
                        sessionId={currentSession.id}
                        sessionType={currentSession.type || 'chat'}
                        className={index === 0 ? 'pt-0.5' : ''}
                        collapseThreshold={msg.role === 'system' ? 150 : undefined}
                    />
                    <div style={{height:'15px'}} />
                </>
            )}
            followOutput={effectiveLockIndex !== null ? 'none' : (atBottomValue ? 'auto' : 'none')}
            components={{
                ScrollSeekPlaceholder,
                Footer: () => <div style={{ height: bottomOverlayHeight }} />
            }}
        />
    )
}
