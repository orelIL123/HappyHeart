import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

interface Tab {
    id: string;
    label: string;
}

interface TopTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabPress: (tabId: any) => void;
}

export function TopTabs({ tabs, activeTab, onTabPress }: TopTabsProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                isActive && { borderBottomColor: colors.primary }
                            ]}
                            onPress={() => onTabPress(tab.id)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: isActive ? colors.primary : colors.tabIconDefault },
                                    isActive && styles.activeTabText
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    tabsContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
    },
    tab: {
        paddingVertical: 12,
        marginLeft: 24,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    activeTabText: {
        fontWeight: '800',
    },
});
