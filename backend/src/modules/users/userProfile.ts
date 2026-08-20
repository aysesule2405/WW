export const USER_AVATAR_SELECT =
  '_id username avatarUrl avatarConfig richAvatarConfig avatarPreference'

export const USER_COMMUNITY_PROFILE_SELECT =
  `${USER_AVATAR_SELECT} status`

export type UserAvatarSource = {
  _id?: unknown
  username?: string | null
  avatarUrl?: string | null
  avatarConfig?: unknown
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
}

export function serializeUserAvatar(user: UserAvatarSource | null | undefined) {
  return {
    username: user?.username ?? 'Unknown',
    avatarUrl: user?.avatarUrl ?? null,
    avatarConfig: user?.avatarConfig ?? null,
    richAvatarConfig: user?.richAvatarConfig ?? null,
    avatarPreference: user?.avatarPreference ?? null,
  }
}

export function serializeUserProfile(user: UserAvatarSource & {
  email?: string
  status?: string | null
  favoriteSong?: string | null
  favoriteSteamGames?: string | null
}) {
  return {
    id: user._id?.toString?.() ?? String(user._id ?? ''),
    email: user.email ?? '',
    ...serializeUserAvatar(user),
    status: user.status ?? '',
    favoriteSong: user.favoriteSong ?? '',
    favoriteSteamGames: user.favoriteSteamGames ?? '',
  }
}
