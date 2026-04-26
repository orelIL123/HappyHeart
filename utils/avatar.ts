import { ImageSourcePropType } from 'react-native';

const DEFAULT_AVATAR = require('@/assets/images/icon.png');
const BLOCKED_AVATAR_HOSTS = ['pravatar.cc'];

export const sanitizeAvatarUrl = (avatar?: string | null): string => {
    const trimmed = avatar?.trim() || '';
    if (!trimmed) return '';

    try {
        const parsed = new URL(trimmed);
        if (BLOCKED_AVATAR_HOSTS.some((host) => parsed.hostname.includes(host))) {
            return '';
        }
        return trimmed;
    } catch {
        return trimmed;
    }
};

export const getAvatarSource = (avatar?: string | null): ImageSourcePropType => {
    const safeAvatar = sanitizeAvatarUrl(avatar);
    return safeAvatar ? { uri: safeAvatar } : DEFAULT_AVATAR;
};
