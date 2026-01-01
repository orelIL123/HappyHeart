import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.value, { color: color || colors.text }]}>{value}</Text>
            <Text style={[styles.label, { color: colors.tabIconDefault }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    iconContainer: {
        marginBottom: 8,
    },
    value: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});
