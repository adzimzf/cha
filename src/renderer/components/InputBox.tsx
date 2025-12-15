import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, IconButton, Typography, useTheme, Dialog } from '@mui/material'
import { SessionType, createMessage } from '../../shared/types'
import platform from '../packages/platform'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import {
    Settings2
} from 'lucide-react'
import InsertPhotoIcon from '@mui/icons-material/InsertPhotoOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StyledMenu from '@/components/StyledMenu'
import { MenuItem } from '@mui/material'
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
import { settingsAtom } from '@/stores/atoms'
import * as toastActions from '@/stores/toastActions'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const theme = useTheme()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [attachedImages, setAttachedImages] = useState<{ name?: string; mime: string; dataUrl: string }[]>([])
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const replaceInputRef = useRef<HTMLInputElement>(null)
    const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewSrc, setPreviewSrc] = useState<string>('')
    const [previewName, setPreviewName] = useState<string>('')
    const [isMobile, setIsMobile] = useState(false)
    const [isNarrow, setIsNarrow] = useState(false)
    const [editingMessage, setEditingMessage] = useAtom(editingMessageAtom)
    const [, setEditingLockIndex] = useAtom(editingLockIndexAtom)
    const [sessionDrafts, setSessionDrafts] = useAtom(atoms.sessionDraftsAtom)
    const [editingDrafts, setEditingDrafts] = useAtom(atoms.editingDraftsAtom)
    const lastSessionIdRef = useRef(props.currentSessionId)
    const isEditingCurrent = !!editingMessage && editingMessage.sessionId === props.currentSessionId
    const editingKey = editingMessage ? `${editingMessage.sessionId}:${editingMessage.messageId}` : ''
    const settings = useAtomValue(settingsAtom)

    // Get current session state
    const session = sessionActions.getSession(props.currentSessionId)
    const lastMessage = session?.messages?.find(m => m.generating)
    const isGenerating = lastMessage?.generating

    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        if (attachedImages.length > 0) {
            newMessage.attachments = attachedImages.map((img) => ({ type: 'image', mime: img.mime, dataUrl: img.dataUrl, name: img.name }))
        }
        sessionActions.submitNewUserMessage({
            currentSessionId: props.currentSessionId,
            newUserMsg: newMessage,
            needGenerating,
        })

        setMessageInput('')
        setAttachedImages([])
        setSessionDrafts((prev) => ({ ...prev, [props.currentSessionId]: '' }))
        trackingEvent('send_message', { event_category: 'user' })
    }

    const handleSubmitEditing = () => {
        if (!editingMessage) return
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        if (attachedImages.length > 0) {
            newMessage.attachments = attachedImages.map((img) => ({ type: 'image', mime: img.mime, dataUrl: img.dataUrl, name: img.name }))
        }
        const key = `${editingMessage.sessionId}:${editingMessage.messageId}`
        setEditingMessage(null)
        setEditingLockIndex(null)
        setEditingDrafts((prev) => {
            const { [key]: _removed, ...rest } = prev
            return rest
        })
        setMessageInput(sessionDrafts[props.currentSessionId] || '')
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
        if (isEditingCurrent && editingMessage) {
            setEditingDrafts((prev) => ({ ...prev, [editingKey]: input }))
        } else {
            setSessionDrafts((prev) => ({ ...prev, [props.currentSessionId]: input }))
        }
    }

    useEffect(() => {
        platform.isMobile().then(setIsMobile)
    }, [])

    useEffect(() => {
        const handleResize = () => {
            setIsNarrow(window.innerWidth <= 600)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (editingMessage && editingMessage.sessionId === props.currentSessionId) {
            const draft = editingDrafts[editingKey]
            setMessageInput(draft !== undefined ? draft : (editingMessage.content || ''))
            const sessionForEdit = sessionActions.getSession(props.currentSessionId)
            const msgForEdit = sessionForEdit?.messages?.find(m => m.id === editingMessage.messageId)
            if (msgForEdit?.attachments && Array.isArray(msgForEdit.attachments)) {
                const imgs = msgForEdit.attachments
                    .filter((att) => att.type === 'image' && !!att.dataUrl)
                    .map((att) => ({ name: att.name, mime: att.mime, dataUrl: att.dataUrl }))
                setAttachedImages(imgs)
            } else {
                setAttachedImages([])
            }
        }
    }, [editingMessage, props.currentSessionId, editingDrafts])

    useEffect(() => {
        if (editingMessage && editingMessage.sessionId === props.currentSessionId) return
        const draft = sessionDrafts[props.currentSessionId] || ''
        setMessageInput(draft)
    }, [props.currentSessionId, editingMessage])

    useEffect(() => {
        const prevId = lastSessionIdRef.current
        if (prevId !== props.currentSessionId) {
            if (editingMessage && editingMessage.sessionId === prevId) {
                const prevKey = `${editingMessage.sessionId}:${editingMessage.messageId}`
                setEditingDrafts((p) => ({ ...p, [prevKey]: messageInput }))
            } else {
                setSessionDrafts((prev) => ({ ...prev, [prevId]: messageInput }))
            }
            if (editingMessage && editingMessage.sessionId === props.currentSessionId) {
                const nextKey = `${editingMessage.sessionId}:${editingMessage.messageId}`
                const nextDraft = editingDrafts[nextKey]
                setMessageInput(nextDraft !== undefined ? nextDraft : (editingMessage.content || ''))
            } else {
                const draft = sessionDrafts[props.currentSessionId] || ''
                setMessageInput(draft)
            }
            lastSessionIdRef.current = props.currentSessionId
        }
    }, [props.currentSessionId])

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

        if (event.key === 'Escape' && isEditingCurrent && editingMessage) {
            const key = `${editingMessage.sessionId}:${editingMessage.messageId}`
            setEditingMessage(null)
            setEditingLockIndex(null)
            setEditingDrafts((prev) => {
                const { [key]: _removed, ...rest } = prev
                return rest
            })
            setMessageInput(sessionDrafts[props.currentSessionId] || '')
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
            if (isEditingCurrent) {
                handleSubmitEditing()
            } else {
                handleSubmit()
            }
            return
        }
        if (event.keyCode === 13 && event.ctrlKey) {
            event.preventDefault()
            if (isEditingCurrent) {
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

    const onAttachImage = () => {
        if (fileInputRef.current) fileInputRef.current.click()
    }

    const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const imageFiles = files.filter((f) => f.type.startsWith('image/'))
        const readers = imageFiles.map((file) => new Promise<{ name: string; mime: string; dataUrl: string }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve({ name: file.name, mime: file.type, dataUrl: reader.result as string })
            reader.readAsDataURL(file)
        }))
        const results = await Promise.all(readers)
        setAttachedImages((prev) => [...prev, ...results])
        e.target.value = ''
        setMenuAnchor(null)
    }

    const onEditImage = (ix: number) => {
        setReplaceIndex(ix)
        if (replaceInputRef.current) replaceInputRef.current.click()
    }

    const onReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const file = files.find((f) => f.type.startsWith('image/'))
        if (!file || replaceIndex === null) {
            e.target.value = ''
            setReplaceIndex(null)
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const updated = { name: file.name, mime: file.type, dataUrl: reader.result as string }
            setAttachedImages((prev) => prev.map((img, i) => (i === replaceIndex ? updated : img)))
            setReplaceIndex(null)
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const onRemoveImage = (ix: number) => {
        setAttachedImages((prev) => prev.filter((_, i) => i !== ix))
    }

    const openMenu = (el: HTMLElement) => setMenuAnchor(el)
    const closeMenu = () => setMenuAnchor(null)

    const isVisionModelSelected = () => {
        const currentProvider = settings.modelProviderList?.find(
            (p) => p.uuid === (session?.modelProviderID || settings.modelProviderID)
        )
        const selectedModel = session?.model || currentProvider?.selectedModel || ''
        const list = currentProvider?.imageCapableModelIDs || []
        return !!list.includes(selectedModel)
    }

    return (
        <div className={cn('w-full mx-auto flex flex-col')}>
            <div className='w-full max-w-[980px] mx-auto my-3 pb-2 flex-1 min-h-0 rounded-xl'
            style={{
                padding: isNarrow ? '6px' : '10px',
                backgroundColor: theme.palette.background.paper,
                border: '1px solid',
                borderColor: theme.palette.divider,
                overflow: 'hidden',
                boxShadow: theme.palette.mode === 'dark' ? '0 1px 6px rgba(0,0,0,0.35)' : '0 1px 6px rgba(0,0,0,0.08)'
            }}
            >
                    {attachedImages.length > 0 && (
                        <Box sx={{ width: '100%', mb: 1 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {attachedImages.map((img, ix) => (
                                        <Box key={ix} sx={{ position: 'relative', width: 96, height: 96, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: theme.palette.divider, cursor: 'pointer' }} onClick={() => { setPreviewSrc(img.dataUrl); setPreviewName(img.name || 'image'); setPreviewOpen(true) }}>
                                            <img src={img.dataUrl} alt={img.name || 'image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 0.5 }}>
                                                <IconButton size='small' onClick={(e) => { e.stopPropagation(); onEditImage(ix) }} sx={{ bgcolor: theme.palette.background.paper }}>
                                                    <ModeEditOutlineOutlinedIcon fontSize='small' />
                                                </IconButton>
                                                <IconButton size='small' onClick={(e) => { e.stopPropagation(); onRemoveImage(ix) }} sx={{ bgcolor: theme.palette.background.paper }}>
                                                    <DeleteOutlineIcon fontSize='small' />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))}
                            </Box>
                        </Box>
                    )}
                    <div className={cn('flex items-end', isNarrow ? 'gap-1' : 'gap-2')}>
                        <MiniButton className={cn(isNarrow ? 'mr-1' : 'mr-2')} style={{ color: theme.palette.text.primary }}
                            onClick={(e) => openMenu(e.currentTarget)}
                            tooltipTitle={
                                <div className='text-center inline-block'>
                                    <span>{t('Attach image or message settings')}</span>
                                </div>
                            }
                            tooltipPlacement='top'
                        >
                            <AddPhotoAlternateOutlinedIcon />
                        </MiniButton>

                        <StyledMenu
                            anchorEl={menuAnchor}
                            open={Boolean(menuAnchor)}
                            onClose={closeMenu}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                            <MenuItem onClick={() => {
                                if (!isVisionModelSelected()) {
                                    toastActions.add(t('The selected model does not support image attachments'))
                                    return
                                }
                                closeMenu(); onAttachImage()
                            }} disableRipple>
                                <InsertPhotoIcon sx={{ mr: 1 }} /> {t('Attach Image')}
                            </MenuItem>
                            <MenuItem onClick={() => { closeMenu(); setChatConfigDialogSession(sessionActions.getCurrentSession()) }} disableRipple>
                                <SettingsOutlinedIcon sx={{ mr: 1 }} /> {t('Message Settings')}
                            </MenuItem>
                        </StyledMenu>

                        <input ref={fileInputRef} type='file' accept='image/*' multiple style={{ display: 'none' }} onChange={onFileSelected} />
                        <input ref={replaceInputRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={onReplaceFileSelected} />
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

                        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)}>
                            <Box sx={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                                <img src={previewSrc} alt={previewName} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }} />
                            </Box>
                        </Dialog>

                        <MiniButton
                            className={cn('w-8 hover:bg-gray-100 dark:hover:bg-gray-800', isNarrow ? 'ml-1' : 'ml-2')}
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
                                        : isEditingCurrent
                                            ? t('Edit')
                                            : t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                                </Typography>
                            }
                            tooltipPlacement='top'
                            onClick={isGenerating ? handleCancelRequest : () => (isEditingCurrent ? handleSubmitEditing() : handleSubmit())}
                        >
                            {isGenerating ? (
                                <StopCircleRoundedIcon/>
                            ) : isEditingCurrent ? (
                                <EditIcon/>
                            ) : (
                                <SendRoundedIcon/>
                            )}
                        </MiniButton>

                        {isEditingCurrent && editingMessage && (
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
                                    const key = `${editingMessage.sessionId}:${editingMessage.messageId}`
                                    setEditingMessage(null)
                                    setEditingLockIndex(null)
                                    setEditingDrafts((prev) => {
                                        const { [key]: _removed, ...rest } = prev
                                        return rest
                                    })
                                    setMessageInput(sessionDrafts[props.currentSessionId] || '')
                                    setAttachedImages([])
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
