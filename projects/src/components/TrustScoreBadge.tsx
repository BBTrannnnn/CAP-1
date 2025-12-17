import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { XStack } from 'tamagui';

interface TrustScoreBadgeProps {
    score: number;
    size?: 'small' | 'medium' | 'large';
}

export function getTrustLevel(score: number): { label: string; color: string; bgColor: string } {
    if (score < 20) {
        return { label: 'Untrusted', color: '#dc2626', bgColor: '#fee2e2' };
    } else if (score < 50) {
        return { label: 'Low trust', color: '#ea580c', bgColor: '#ffedd5' };
    } else if (score < 85) {
        return { label: 'Normal', color: '#2563eb', bgColor: '#dbeafe' };
    } else {
        return { label: 'High trust', color: '#16a34a', bgColor: '#dcfce7' };
    }
}

export default function TrustScoreBadge({ score, size = 'small' }: TrustScoreBadgeProps) {
    const level = getTrustLevel(score);

    const sizeStyles = {
        small: { fontSize: 11, padding: 4, paddingHorizontal: 8 },
        medium: { fontSize: 12, padding: 6, paddingHorizontal: 10 },
        large: { fontSize: 14, padding: 8, paddingHorizontal: 12 },
    };

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: level.bgColor },
                sizeStyles[size]
            ]}
        >
            <Text style={[styles.text, { color: level.color, fontSize: sizeStyles[size].fontSize }]}>
                ⭐ {score} • {level.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
    },
});
