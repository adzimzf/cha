import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { useAtomValue, useSetAtom, useAtom } from 'jotai'
import * as atoms from '../stores/atoms'
import { useTranslation } from 'react-i18next'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import StyledMenu from './StyledMenu'
import { useState } from 'react'
import { MenuItem, Divider } from '@mui/material'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

export default function Toolbar() {
    const { t } = useTranslation()
    const currentSession = useAtomValue(atoms.currentSessionAtom)

    const setSessionCleanDialog = useSetAtom(atoms.sessionCleanDialogAtom)
    const [uiScale, setUiScale] = useAtom(atoms.uiScaleAtom)

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        event.preventDefault()
        setAnchorEl(event.currentTarget)
    }
    const handleMoreMenuClose = () => {
        setAnchorEl(null)
    }
    const handleSessionClean = () => {
        setSessionCleanDialog(currentSession)
        handleMoreMenuClose()
    }
    const handleZoomIn = () => {
        setUiScale(Math.min(1.8, parseFloat((uiScale + 0.1).toFixed(2))))
        handleMoreMenuClose()
    }
    const handleZoomOut = () => {
        setUiScale(Math.max(0.8, parseFloat((uiScale - 0.1).toFixed(2))))
        handleMoreMenuClose()
    }
    const handleZoomReset = () => {
        setUiScale(1)
        handleMoreMenuClose()
    }

    return (
        <Box>
            <IconButton
                edge="start"
                color="inherit"
                aria-label="more-menu-button"
                sx={{}}
                onClick={handleMoreMenuOpen}
            >
                <MoreHorizIcon />
            </IconButton>
            <StyledMenu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMoreMenuClose}
            >
                <MenuItem onClick={handleZoomOut} disableRipple>
                    <ZoomOutIcon fontSize="small" />
                    {t('Zoom Out')}
                </MenuItem>
                <MenuItem onClick={handleZoomIn} disableRipple>
                    <ZoomInIcon fontSize="small" />
                    {t('Zoom In')}
                </MenuItem>
                <MenuItem onClick={handleZoomReset} disableRipple>
                    <RestartAltIcon fontSize="small" />
                    {t('Reset Zoom')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSessionClean} disableRipple
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        },
                    }}
                >
                    <CleaningServicesIcon fontSize="small" />
                    {t('Clear All Messages')}
                </MenuItem>
            </StyledMenu>
        </Box>
    )
}
