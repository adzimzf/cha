import { Message, OpenAICompProviderSettings } from '../../shared/types'
import {
    Stack,
    Typography,
    List,
    ListItem,
    IconButton,
    Paper,
    Divider,
    Box, useTheme, ClickAwayListener
} from '@mui/material'
import {
    CachedRounded,
    InfoOutlined,
    ContentCopy,
    HighlightAlt,
    Edit,
    ArrowForwardIos,
    ArrowBackIosNew,
    Send,
    Close,
} from '@mui/icons-material'
import Tooltip from '@mui/material/Tooltip'
import React, { useMemo } from 'react'
import { countWord } from '@/packages/word-count'
import { estimateTokensFromMessages } from '@/packages/token'
import { copyToClipboard } from '@/packages/navigator'
import * as toastActions from '@/stores/toastActions'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '@/stores/sessionActions'
import { useSetAtom } from 'jotai'
import { editingMessageAtom, editingLockIndexAtom, branchSwitchAtom } from '@/stores/atoms'
import * as scrollActions from '@/stores/scrollActions'

export interface Props {
    msg: Message
    sessionId: string
    setEditMessage: (show: boolean) => void
    editMessage: boolean
}

export default function MessageActions(props: Props) {

    const {msg, sessionId, setEditMessage} = props

    const theme = useTheme()
    const { t } = useTranslation()
    const [hasChild, setHasChild] = React.useState(false)
    const [numChild, setNumChild] = React.useState(0)
    const [currentChild, setCurrentChild] = React.useState(0)
    const [showMessageInfo, setShowMessageInfo] = React.useState(false)
    const setEditingMessage = useSetAtom(editingMessageAtom)
    const setEditingLockIndex = useSetAtom(editingLockIndexAtom)
    const setBranchSwitch = useSetAtom(branchSwitchAtom)

    useMemo(()=>{
        if (msg.branches && msg.branches.length > 0){
            setNumChild(msg.branches.length)
            setHasChild(true)

            // support the old message which doesn't have numIndex
            setCurrentChild(msg.numIndex? msg.numIndex : 0)
        }
    },[msg])

    const handleRegenerate =  () => {
        sessionActions.regenerateMessage({
            sessionId: sessionId,
            msg: msg,
        })
    }

    const handleNextMessage = (curChild: number, dir: 'next' | 'prev') => {

        const promoteTargetBranch = msg.branches?.
        findIndex((element) => {
            // support old message which doesn't have numIndex
            if (typeof element[0].numIndex === 'undefined') return 0 === curChild
            return element[0].numIndex === curChild
        })
         setBranchSwitch({ msgId: msg.id, direction: dir, ts: Date.now() })
         sessionActions.shiftBranch({
             sessionId:sessionId,
             msg: msg,
             promoteBranchIndex: promoteTargetBranch ? promoteTargetBranch : 0,
         })
    }

    const paginationCmp = () => {
        if (!hasChild) {
            return <></>
        }

        return (
            <>
            <Tooltip
                title={"Previous"}
                sx={{
                    backgroundColor: theme.palette.background.paper,
                }}
                arrow
            >
                <span>
                   <IconButton
                       size={"small"}
                       onClick={() => handleNextMessage(currentChild-1, 'prev')}
                       disabled={currentChild <= 0}
                   >
                    <ArrowBackIosNew fontSize={'inherit'} />
                </IconButton>
                </span>

                </Tooltip>
                <Typography
                    variant="body2"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '28px',
                        paddingX: '4px',
                        marginX: '2px',
                        lineHeight: 1.2,
                    }}
                >
                    {currentChild+1}/{numChild+1}
                </Typography>
            <Tooltip
                title={"Next"}
                sx={{
                    backgroundColor: theme.palette.background.paper,
                }}
                arrow
            >
                <span>
                <IconButton
                    size={"small"}
                    onClick={() => handleNextMessage(currentChild+1, 'next')}
                    disabled={currentChild >= numChild}
                >
                    <ArrowForwardIos fontSize={'inherit'} />
                </IconButton>
                    </span>
            </Tooltip>
            </>
        )
    }

    if (props.editMessage || props.msg.role === 'system') {
        return (<></>)
    }


    const pillBg = theme.palette.background.paper
    return (
        <Stack
            direction="row"
            spacing={0.5}
            className="opacity-0 group-hover/message:opacity-100 transition-opacity"
            sx={{
                justifyContent: msg.role === 'user' ? "flex-end" : "flex-start",
                alignItems: 'center',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginTop: '4px',
                borderRadius: '12px',
                backgroundColor: pillBg,
                padding: '2px 6px',
                boxShadow: theme.palette.mode === 'dark' ? '0 1px 6px rgba(0,0,0,0.35)' : '0 1px 6px rgba(0,0,0,0.08)',
                color: theme.palette.text.secondary,
                width: 'fit-content',
            }}
        >
            {paginationCmp()}

            {msg.role !== 'user' ? (
                <Tooltip
                    title={"Regenerate"}
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                    }}
                    arrow
                >
                    <IconButton size="small" color="inherit" onClick={handleRegenerate}
                        sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                    >
                        <CachedRounded fontSize={'inherit'} />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip
                    title={"Edit"}
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                    }}
                    arrow
                >
                    <IconButton size="small" color="inherit" onClick={()=> {
                        const session = sessionActions.getSession(sessionId)
                        if (session) {
                            const idx = session.messages.findIndex(m => m.id === msg.id)
                            const lockIndex = Math.max(0, idx - 1)
                            setEditingLockIndex(lockIndex)
                        }
                        setEditingMessage({ sessionId, messageId: msg.id, content: msg.content })
                    }}
                        sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                    >
                        <Edit fontSize={'inherit'} />
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip
                title={"Copy"}
                sx={{
                    backgroundColor: theme.palette.background.paper,
                }}
                arrow
            >
                <IconButton
                size="small"
                color="inherit"
                sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                onClick={() => {
                    copyToClipboard(msg.content);
                    toastActions.add(t('copied to clipboard'));
                }}
            >
                <ContentCopy fontSize={'inherit'} />
                </IconButton>
            </Tooltip>
            <ClickAwayListener onClickAway={()=> setShowMessageInfo(false)}>
            <Tooltip
                open={showMessageInfo}
                title={<KeyValueList msg={msg} />}
                sx={{
                    backgroundColor: theme.palette.background.paper,
                }}
                arrow
                disableFocusListener
                disableTouchListener
                onMouseEnter={() => setShowMessageInfo(true)}
                onMouseLeave={() => setShowMessageInfo(false)}
            >
                <IconButton 
                    size="small" 
                    color="inherit"
                    sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                    onClick={() => setShowMessageInfo(!showMessageInfo)}
                >
                    <InfoOutlined fontSize={'inherit'} />
                </IconButton>
            </Tooltip>
            </ClickAwayListener>
        </Stack>
    );
}
interface KeyValueListProps {
    msg: Message;
}
const KeyValueList = ({ msg }: KeyValueListProps) => {

    const entries = [
        {
            key: 'Word Count',
            value: msg.wordCount ?? countWord(msg.content)
        },
        {
            key: 'Token Count',
            value: msg.tokenCount ?? estimateTokensFromMessages([msg])
        },
        {
            key: 'Tokens Used',
            value: msg.tokensUsed ?? 0
        },
    ];

    if (msg.model !== undefined || msg.model === "") {
        entries.push({
            key: 'Model',
            value: msg.model || 'Unknown' as any
        })
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
        }}>
            {entries.map((entry) => (
                <Box
                    key={entry.key}
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'baseline',
                        lineHeight: 1.2
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 500,
                            minWidth: '80px',
                            textAlign: 'right'
                        }}
                    >
                        {entry.key}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            wordBreak: 'break-word',
                            flexGrow: 1
                        }}
                    >
                        {entry.value}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};