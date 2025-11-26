import { useEffect, useRef } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'

interface Props { }

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessageList = useAtomValue(atoms.currentMessageListAtom)
    const ref = useRef<VirtuosoHandle>(null);
    const [, setMessageListRef] = useAtom(atoms.messageListRefAtom)
    const [, setShowScrollToBottom] = useAtom(atoms.showScrollToBottom)
    const [, setAtBottom] = useAtom(atoms.atBottomAtom)
    const showRef = useRef<boolean>(false)
    useEffect(() => {
        setMessageListRef(ref)
    }, [ref])

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
        <div className='overflow-y-auto w-full h-full pr-0 pl-0' >
            <Virtuoso
                ref={ref}
                data={currentMessageList}
                totalCount={currentMessageList.length}
                atBottomStateChange={(atBottom: boolean) => {
                    setAtBottom(atBottom)
                    if (atBottom) {
                        showRef.current = false
                        setShowScrollToBottom(false)
                    }
                }}
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
                initialTopMostItemIndex={currentMessageList.length-1}
                // alignToBottom={true}
                followOutput="auto"
                components={{ ScrollSeekPlaceholder }}
            />
        </div>
    )
}