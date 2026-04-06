import type { Id } from '../../../convex/_generated/dataModel'

export const MAX_CARDS = 3
export const MAX_DESCRIPTION = 220
export const MAX_STORY_BLOCKS = 2

export const CARD_COLORS = [
  { id: 'dark', label: 'Dark', hex: '#27272a' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'amber', label: 'Amber', hex: '#fbbf24' },
  { id: 'teal', label: 'Teal', hex: '#14b8a6' },
  { id: 'sky', label: 'Sky', hex: '#0ea5e9' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
]

export const DEFAULT_CARD_COLOR = CARD_COLORS[0]

const accountHash = import.meta.env.VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH as
  | string
  | undefined

export function getImageUrl(imageId: string | undefined, variant = 'public') {
  if (!imageId || !accountHash) return null
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`
}

export interface StoryBlock {
  title: string
  subheader?: string
  description?: string
}

export interface CardData {
  _id: Id<'cards'>
  type: 'showcase' | 'story'
  imageId?: string
  name?: string
  occupation?: string
  description?: string
  storyBlocks?: StoryBlock[]
  color?: string
  order: number
}

export interface ShowcaseEditForm {
  name: string
  occupation: string
  description: string
  color: string
}

export interface StoryEditForm {
  storyBlocks: Array<{ title: string; subheader: string; description: string }>
  color: string
}

export interface ProfileEditForm {
  name: string
  occupation: string
  description: string
  color: string
}

export interface UserData {
  email: string
  name?: string
  username?: string
  occupation?: string
  mobileNumber?: string
  websiteLink?: string
  addMobileToCard?: boolean
  addWebsiteToCard?: boolean
  avatarImageId?: string
  description?: string
  cardColor?: string
}
