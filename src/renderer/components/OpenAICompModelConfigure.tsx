import {
    Alert,
    Box,
    FormHelperText,
    IconButton,
    MenuItem,
    Modal,
    Select,
    TextField, Tooltip,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import PasswordTextField from '@/components/PasswordTextField'
import RefreshIcon from '@mui/icons-material/Refresh'
import React, { useEffect, useState } from 'react'
import { OpenAICompProviderSettings, Settings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import OpenAIComp from '@/packages/models/openai-comp'
import TemperatureSlider from '@/components/TemperatureSlider'
import TopPSlider from '@/components/TopPSlider'
import CircularProgress from '@mui/material/CircularProgress'
import { useAtom } from 'jotai/index'
import { settingsAtom } from '@/stores/atoms'

export interface OpenAICompModelConfigureProps {
    provider: OpenAICompProviderSettings
    setProvider: (provider: OpenAICompProviderSettings) => void
}

export function OpenAICompModelConfigure(props: OpenAICompModelConfigureProps) {
    const { t } = useTranslation()
    const { provider, setProvider  } = props
    const [error, setError] = useState('')
    const [isFetchingModel, setIsFetchingModel] = useState(false);
    const [defaultModelName, setDefaultModelName] = useState('');

    const updateModelProvider = (updatedProvider: OpenAICompProviderSettings) => {
        setProvider(updatedProvider)
    }

    useEffect(() => {
        setDefaultModelName(provider.selectedModel)
    },[provider])

    const handleRefresh = async () => {
        setError('')
        if (!provider.name || !provider.apiKey || !provider.baseURL) {
            // @ts-ignore
            setError(t('Please provide Provider Name, Base URL, and API Key'))
            return
        }

        try {
            setIsFetchingModel(true)
            const api = new OpenAIComp({
                baseURL: provider.baseURL,
                apiKey: provider.apiKey,
                temperature: 0,
                topP: 0
            })

            const res = await api.listModels()
            updateModelProvider({
                ...provider,
                modelList: res
            })
            setDefaultModelName(res[0].id)
        } catch (err) {
            setError(t('Failed to fetch models: ') + err)
            console.error('Error fetching models:', err)
        } finally {
            setIsFetchingModel(false)
        }
    }

    return (
        <>
            <Modal open={isFetchingModel} onClose={() => setIsFetchingModel(false)}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 1,
                    textAlign: 'center',
                }}>
                    <CircularProgress />
                </Box>
            </Modal>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TextField
                margin="dense"
                label={t('Provider Name')}
                fullWidth
                variant="outlined"
                value={provider.name}
                placeholder="Open AI"
                onChange={(e) => {
                    updateModelProvider({
                        ...provider,
                        name: e.target.value
                    })
                }}
            />
            <TextField
                margin="dense"
                label={t('Base URL')}
                fullWidth
                variant="outlined"
                value={provider.baseURL}
                placeholder="https://api.deepinfra.com/v1/openai"
                onChange={(e) => {
                    updateModelProvider({
                        ...provider,
                        baseURL: e.target.value
                    })
                }}
            />
            <div style={{
                display: 'flex',
                gap: 8,
                marginTop: 8,
                alignItems: 'center'
            }}>
                <PasswordTextField
                    label={t('API Key')}
                    value={provider.apiKey}
                    setValue={(newApiKey) => {
                        updateModelProvider({
                            ...provider,
                            apiKey: newApiKey
                        })
                    }}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <Tooltip
                    title={'Check the API Key'}
                    style={{
                       marginTop: 5,
                    }}
                >
                    <IconButton
                        onClick={handleRefresh}
                        size="large"
                        sx={{
                            border: 1,
                            borderRadius: 1,
                            borderColor: 'divider',
                            height: '52px'
                        }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </div>

            <Autocomplete
                disabled={!provider.modelList?.length}
                options={[...(provider.modelList?.map((m) => m.id) || []), 'custom-model']}
                value={provider.selectedModel || defaultModelName || ''}
                onChange={(e, newValue) => {
                    updateModelProvider({
                        ...provider,
                        selectedModel: (newValue as string) || ''
                    })
                }}
                renderInput={(params) => (
                    <TextField {...params} label={t('Model List')} placeholder={t('Search model') || ''} />
                )}
                sx={{ mt: 1 }}
            />

            <Box sx={{ mt: 1.5 }}>
                <Autocomplete
                    multiple
                    options={provider.modelList?.map((m) => m.id) || []}
                    value={provider.imageCapableModelIDs || []}
                    onChange={(e, newValue) => {
                        updateModelProvider({
                            ...provider,
                            imageCapableModelIDs: (newValue as string[]) || []
                        })
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label={t('Image-capable Models')} placeholder={t('Search models') || ''} />
                    )}
                />
                <FormHelperText>{t('Select models that support image (vision) inputs')}</FormHelperText>
            </Box>

            <TemperatureSlider value={provider.temperature} onChange={(e) => {
                updateModelProvider({
                    ...provider,
                    temperature: e.valueOf()
                })
                }}
            />
            <TopPSlider topP={provider.topP} setTopP={(e) => {
                updateModelProvider({
                    ...provider,
                    topP:e.valueOf()
                })
            }}/>
        </>
    )
}
