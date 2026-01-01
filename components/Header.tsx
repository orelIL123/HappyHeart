import Colors from '@/constants/Colors';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from './useColorScheme';

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
}

export function Header({ title, showBackButton = true }: HeaderProps) {
    const { setSidebarOpen } = useApp();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.rightSide}>
                {showBackButton && (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => router.back()}
                    >
                        <ChevronRight size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.title, { color: colors.text, top: insets.top + 8 }]}>{title}</Text>

            <View style={styles.leftIcons}>
                <View style={styles.miniButton} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    rightSide: {
        width: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'Inter',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 1,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    leftIcons: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    miniButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
});
