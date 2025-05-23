import { v4 as uuidv4 } from 'uuid'
import { Model } from '../renderer/packages/models/openai'
import * as siliconflow from '../renderer/packages/models/siliconflow'
import { ClaudeModel } from '../renderer/packages/models/claude'

export const MessageRoleEnum = {
    System: 'system',
    User: 'user',
    Assistant: 'assistant',
} as const

export type MessageRole = (typeof MessageRoleEnum)[keyof typeof MessageRoleEnum]

export interface Message {
    id: string

    role: MessageRole
    content: string
    name?: string

    numIndex: number
    branches?: Message[][]

    cancel?: () => void
    generating?: boolean

    aiProvider?: string
    model?: string

    errorCode?: number
    error?: string
    errorExtra?: {
        [key: string]: any
    }

    wordCount?: number
    tokenCount?: number
    tokensUsed?: number
    timestamp?: number

    // thinking duration in Ms
    thinkingDuration?: number
}

export type SettingWindowTab = 'ai' | 'display' | 'chat' | 'advanced'

export type SessionType = 'chat'

export function isChatSession(session: Session) {
    return session.type === 'chat' || !session.type
}

export interface Session {
    id: string
    type?: SessionType
    name: string
    picUrl?: string
    messages: Message[]
    copilotId?: string
    starred?: boolean
    modelProviderID?: string
    model?: string
    updateTime?: number
}

export function createMessage(role: MessageRole = MessageRoleEnum.User, content: string = ''): Message {
    return {
        id: uuidv4(),
        content: content,
        role: role,
        timestamp: new Date().getTime(),
        numIndex: 0,
    }
}

export enum ModelProvider {
    ChatboxAI = 'chatbox-ai',
    OpenAI = 'openai',
    Claude = 'claude',
    Ollama = 'ollama',
    SiliconFlow = 'silicon-flow',
    LMStudio = 'lm-studio',
    PPIO = 'ppio',
    DeepInfra = 'deep-infra',
}

export interface OpenAICompModel {
    id: string
    root: string
}

export interface OpenAICompProviderSettings {
    uuid: string
    name: string
    icon?: string
    apiKey: string
    baseURL: string
    modelList: OpenAICompModel[]
    selectedModel: string
    lastUpdatedModel: number
    temperature: number
    topP: number
    openaiMaxContextMessageCount: number
}

export interface ModelSettings {
    aiProvider: ModelProvider

    modelProvider: string
    modelProviderID: string
    modelProviderList: OpenAICompProviderSettings[]

    // openai
    openaiKey: string
    apiHost: string
    model: Model | 'custom-model'
    openaiCustomModel?: string

    //LMStudio
    lmStudioHost: string
    lmStudioModel: string

    // claude
    claudeApiKey: string
    claudeApiHost: string
    claudeModel: ClaudeModel

    // azure
    azureEndpoint: string
    azureDeploymentName: string
    azureDalleDeploymentName: string
    azureApikey: string

    // chatglm-6b
    chatglm6bUrl: string

    // chatbox-ai
    licenseKey?: string
    chatboxAIModel?: ChatboxAIModel
    licenseInstances?: {
        [key: string]: string
    }
    licenseDetail?: ChatboxAILicenseDetail

    // ollama
    ollamaHost: string
    ollamaModel: string

    // siliconflow
    siliconCloudHost: string
    siliconCloudKey: string
    siliconCloudModel: siliconflow.Model | 'custom-model'

    // ppio
    ppioHost: string
    ppioKey: string
    ppioModel: string

    // deep infra
    deepInfraHost: string
    deepInfraKey: string
    deepInfraModel: string
    deepInfraCustomModel: string

    temperature: number
    topP: number
    openaiMaxContextMessageCount: number
}

export interface Settings extends ModelSettings {
    showWordCount?: boolean
    showTokenCount?: boolean
    showTokenUsed?: boolean
    showModelName?: boolean
    showMessageTimestamp?: boolean

    theme: Theme
    language: Language
    languageInited?: boolean
    fontSize: number
    spellCheck: boolean

    defaultPrompt?: string

    proxy?: string

    allowReportingAndTracking: boolean

    userAvatarKey?: string

    enableMarkdownRendering: boolean

    autoGenerateTitle: boolean

    syncConfig: SynchronizedConfig
}

export type Language = 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'ru' | 'de' | 'fr'

export interface Config {
    uuid: string
}

export interface SponsorAd {
    text: string
    url: string
}

export interface SponsorAboutBanner {
    type: 'picture' | 'picture-text'
    name: string
    pictureUrl: string
    link: string
    title: string
    description: string
}

export interface CopilotDetail {
    id: string
    name: string
    picUrl?: string
    prompt: string
    demoQuestion?: string
    demoAnswer?: string
    starred?: boolean
    usedCount: number
    shared?: boolean
}

export interface Toast {
    id: string
    content: string
}

export enum Theme {
    DarkMode,
    LightMode,
    FollowSystem,
}

export interface RemoteConfig {
    setting_chatboxai_first: boolean
    product_ids: number[]
}

export interface ChatboxAILicenseDetail {
    type: ChatboxAIModel
    name: string
    defaultModel: ChatboxAIModel
    remaining_quota_35: number
    remaining_quota_4: number
    remaining_quota_image: number
    image_used_count: number
    image_total_quota: number
    token_refreshed_time: string
    token_expire_time: string | null | undefined
}

export type ChatboxAIModel = 'chatboxai-3.5' | 'chatboxai-4'

export interface MessageInfo {
    WordCount: number
    TokenUsed: number
    Model: string
    Provider: string
}

export const SyncDataType = {
    All: 'all',
    Chat: 'chat',
    Config: 'config',
} as const

export type SyncDataTypeEnum = (typeof SyncDataType)[keyof typeof SyncDataType]

export const SyncProviderEnum = {
    None: 'None',
    Dropbox: 'Dropbox',
    GoogleDrive: 'Google Drive',
    OneDrive: 'One Drive',
} as const

export const SyncProviderList = Object.values(SyncProviderEnum)

export type SyncProvider = (typeof SyncProviderEnum)[keyof typeof SyncProviderEnum]

export interface SynchronizedConfig {
    enabled: boolean
    provider: SyncProvider
    providersConfig: {
        Dropbox: DropboxConfig
    }
    frequency: number // in seconds
    onAppLaunch: boolean
    syncDataType: [SyncDataTypeEnum]
}

interface DropboxConfig {
    clientId: string
    clientSecret: string
    authToken?: string
    refreshToken?: string
}

export const SyncFrequencyList = {
    '5 Minutes': 300,
    '10 Minutes': 600,
    '15 Minutes': 900,
    '30 Minutes': 1800,
}

export interface ChatSessionMetadata {
    hash: string
    id: string
    updateTime: number
}

export interface SyncMetadata {
    hash?: string
    lastSync: number
    chatSessions?: ChatSessionMetadata[]
}

export const SyncStatusEnum = {
    InProgress: 'InProgress',
    RequireReload: 'RequireReload',
    Finished: 'Finished',
    Error: 'Error',
} as const

export type SyncStatusEnumType = (typeof SyncStatusEnum)[keyof typeof SyncStatusEnum]

export interface SyncPayload {
    status: SyncStatusEnumType
    error_message?: string
}
