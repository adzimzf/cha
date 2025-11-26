import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Typography, useTheme } from '@mui/material'
import { SessionType, createMessage } from '../../shared/types'
import platform from '../packages/platform'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import {
    Settings2
} from 'lucide-react'
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import EditIcon from '@mui/icons-material/Edit';
import StopCircleRoundedIcon from '@mui/icons-material/StopCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { cn } from '@/lib/utils'
import TextareaAutosize from 'react-textarea-autosize';
import { trackingEvent } from '@/packages/event'
import MiniButton from './MiniButton'
import _ from 'lodash'
import * as scrollActions from '@/stores/scrollActions'
import { editingMessageAtom, editingLockIndexAtom } from '@/stores/atoms'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const theme = useTheme()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [isMobile, setIsMobile] = useState(false)
    const [editingMessage, setEditingMessage] = useAtom(editingMessageAtom)
    const [, setEditingLockIndex] = useAtom(editingLockIndexAtom)

    // Get current session state
    const session = sessionActions.getSession(props.currentSessionId)
    const lastMessage = session?.messages?.find(m => m.generating)
    const isGenerating = lastMessage?.generating

    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        sessionActions.submitNewUserMessage({
            currentSessionId: props.currentSessionId,
            newUserMsg: newMessage,
            needGenerating,
        })

        setMessageInput('')
        trackingEvent('send_message', { event_category: 'user' })
    }

    const handleSubmitEditing = () => {
        if (!editingMessage) return
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        setEditingMessage(null)
        setMessageInput('')
        setEditingLockIndex(null)
        scrollActions.scrollToBottom()
        void sessionActions.editMessage({
            msgId: editingMessage.messageId,
            newMessage,
            sessionId: props.currentSessionId,
        })
    }

    const handleCancelRequest = () => {
        let session = sessionActions.getSession(props.currentSessionId)
        const generatingMsg = session?.messages?.find(m => m.generating);
        generatingMsg?.cancel?.();
    }


    const onMessageInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = event.target.value
        setMessageInput(input)
    }

    useEffect(() => {
        platform.isMobile().then(setIsMobile)
    }, [])

    useEffect(() => {
        if (editingMessage) {
            setMessageInput(editingMessage.content || '')
        }
    }, [editingMessage])

    useEffect(() => {
        // unlock scrolling when not editing and not generating
        if (!editingMessage && !isGenerating) {
            setEditingLockIndex(null)
        }
    }, [editingMessage, isGenerating])

    const  onKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // on iOS and Android enter will behave as newline instead.
        if (event.key === 'Enter' && isMobile) {
           return
        }

        if (event.key === 'Escape' && editingMessage) {
            setEditingMessage(null)
            setMessageInput('')
            setEditingLockIndex(null)
            return
        }

        if (
            event.keyCode === 13 &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            event.preventDefault()
            if (editingMessage) {
                handleSubmitEditing()
            } else {
                handleSubmit()
            }
            return
        }
        if (event.keyCode === 13 && event.ctrlKey) {
            event.preventDefault()
            if (editingMessage) {
                handleSubmitEditing()
            } else {
                handleSubmit(false)
            }
            return
        }
    }

    const onFocus = () => {
        if (!isMobile) return;
        scrollActions.scrollToBottom()
    }

    

    return (
        <div className={cn('w-full mx-auto flex flex-col')}>
            <div className='w-full max-w-[980px] mx-auto my-3 pb-2 flex-1 min-h-0 rounded-xl'
            style={{
                padding: '10px',
                backgroundColor: theme.palette.background.paper,
                border: '1px solid',
                borderColor: theme.palette.divider,
                overflow: 'hidden',
                boxShadow: theme.palette.mode === 'dark' ? '0 1px 6px rgba(0,0,0,0.35)' : '0 1px 6px rgba(0,0,0,0.08)'
            }}
            >
                    <div className='flex items-end gap-2'>
                        <MiniButton className='mr-2' style={{ color: theme.palette.text.primary }}
                            onClick={() => setChatConfigDialogSession(sessionActions.getCurrentSession())}
                            tooltipTitle={
                                <div className='text-center inline-block'>
                                    <span>{t('Customize settings for the current conversation')}</span>
                                </div>
                            }
                            tooltipPlacement='top'
                        >
                            <Settings2 size='22' strokeWidth={1} />
                        </MiniButton>


                        <TextareaAutosize
                            className={cn(
                                'flex-1 overflow-y-auto resize-none border-none outline-none',
                                'bg-transparent p-1'
                            )}
                            maxRows={15}
                            value={messageInput}
                            onChange={onMessageInput}
                            onKeyDown={onKeyDown}
                            onFocus={onFocus}
                            style={{
                                color: theme.palette.text.primary,
                                fontFamily: theme.typography.fontFamily,
                                fontSize: theme.typography.body1.fontSize,
                                lineHeight: 1.6
                            }}
                            placeholder={t('Type your question here...') || ''}
                        />

                        <MiniButton
                            className='w-8 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800'
                            style={{
                                color: isGenerating
                                    ? theme.palette.error.main
                                    : theme.palette.primary.main,
                                backgroundColor: 'transparent',
                                margin: '0 auto',
                            }}
                            tooltipTitle={
                                <Typography variant="caption">
                                    {isGenerating
                                        ? t('Stop generating')
                                        : editingMessage
                                            ? t('Edit')
                                            : t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                                </Typography>
                            }
                            tooltipPlacement='top'
                            onClick={isGenerating ? handleCancelRequest : () => (editingMessage ? handleSubmitEditing() : handleSubmit())}
                        >
                            {isGenerating ? (
                                <StopCircleRoundedIcon/>
                            ) : editingMessage ? (
                                <EditIcon/>
                            ) : (
                                <SendRoundedIcon/>
                            )}
                        </MiniButton>

                        {editingMessage && (
                            <MiniButton
                                className='w-8 hover:bg-gray-100 dark:hover:bg-gray-800'
                                style={{
                                    color: theme.palette.error.main,
                                    backgroundColor: 'transparent',
                                    margin: '0 auto',
                                }}
                                tooltipTitle={
                                    <Typography variant="caption">
                                        {t('Cancel')}
                                    </Typography>
                                }
                                tooltipPlacement='top'
                                onClick={() => {
                                    setEditingMessage(null)
                                    setMessageInput('')
                                    setEditingLockIndex(null)
                                }}
                            >
                                <CloseRoundedIcon/>
                            </MiniButton>
                        )}
                    </div>
        </div>
        </div>
    )
}
