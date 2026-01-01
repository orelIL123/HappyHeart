import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Check, FileText, MapPin, Phone, X } from 'lucide-react-native';
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { User } from '../constants/MockData';

interface PendingClownCardProps {
    clown: User;
    onApprove: (clown: User) => void;
    onReject: (clownId: string) => void;
}

export const PendingClownCard: React.FC<PendingClownCardProps> = ({ clown, onApprove, onReject }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleCall = () => {
        if (clown.phone) {
            Linking.openURL(`tel:${clown.phone}`);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Text style={[styles.name, { color: colors.text }]}>{clown.name}</Text>
                    <View style={styles.locationContainer}>
                        <MapPin size={14} color={colors.tabIconDefault} />
                        <Text style={[styles.location, { color: colors.tabIconDefault }]}>{clown.preferredArea}</Text>
                    </View>
                </View>
                <Image source={{ uri: clown.avatar || 'https://i.pravatar.cc/150?u=' + clown.name }} style={styles.avatar} />
            </View>

            <TouchableOpacity style={[styles.phoneContainer, { backgroundColor: colors.primary + '10' }]} onPress={handleCall}>
                <Phone size={18} color={colors.primary} />
                <Text style={[styles.phoneNumber, { color: colors.primary }]}>{clown.phone || 'אין מספר טלפון'}</Text>
            </TouchableOpacity>

            {clown.certificationUrl && (
                <TouchableOpacity
                    style={[styles.certButton, { borderColor: colors.secondary }]}
                    onPress={() => Linking.openURL(clown.certificationUrl!)}
                >
                    <FileText size={18} color={colors.secondary} />
                    <Text style={[styles.certText, { color: colors.secondary }]}>צפה בתעודת ליצן</Text>
                </TouchableOpacity>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.error + '15' }]}
                    onPress={() => onReject(clown.id)}
                >
                    <X size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>דחה</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.success || '#4CAF50' + '15' }]}
                    onPress={() => onApprove(clown)}
                >
                    <Check size={20} color={colors.success || '#4CAF50'} />
                    <Text style={[styles.actionText, { color: colors.success || '#4CAF50' }]}>אשר</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    locationContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    location: {
        fontSize: 14,
        marginRight: 4,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginLeft: 12,
    },
    phoneContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 10,
    },
    certButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginBottom: 15,
        justifyContent: 'center',
    },
    certText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 8,
    },
    actions: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 0.48,
        flexDirection: 'row-reverse',
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveButton: {
        // Light green background set in inline style
    },
    rejectButton: {
        // Light red background set in inline style
    },
    actionText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 6,
    },
});
