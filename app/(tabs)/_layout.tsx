import { Tabs } from 'expo-router';
import { Calendar, Clock, Home, Plus, Shield, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { currentUser } = useApp();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.55)',
        tabBarStyle: {
          backgroundColor: '#EF4444',
          borderTopWidth: 0,
          height: Platform.OS === 'android' ? 80 : 65,
          paddingBottom: Platform.OS === 'android' ? 22 : 10,
          paddingTop: 5,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: Platform.OS === 'android' ? 12 : 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          fontFamily: 'Inter',
        },
        headerShown: false,
      }}>

      {/* בית */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'בית',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      {/* לוח */}
      <Tabs.Screen
        name="board"
        options={{
          title: 'לוח',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />

      {/* + יצירה — כפתור מרכזי צף (מוסתר לliצנים) */}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.createButtonContainer}>
              <View style={styles.createButtonGlow}>
                <View style={[styles.createButton, focused && styles.createButtonActive]}>
                  <Plus size={30} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>
            </View>
          ),
          tabBarButton: (props) => {
            if (currentUser?.role === 'clown') return null;
            return (
              <TouchableOpacity
                onPress={props.onPress ?? undefined}
                onLongPress={props.onLongPress ?? undefined}
                style={[props.style, { top: -20 }]}
              >
                {props.children}
              </TouchableOpacity>
            );
          },
        }}
      />

      {/* זמינות */}
      <Tabs.Screen
        name="availability"
        options={{
          title: 'זמינות',
          tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
        }}
      />

      {/* פרופיל */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />

      {/* אדמין - מוצג רק למנהלי מערכת */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'אדמין',
          tabBarIcon: ({ color }) => <Shield size={24} color={color} />,
          href: currentUser?.role === 'admin' ? '/(tabs)/admin' : null,
        }}
      />

      {/* הגדרות — מוסתר מהטאבבר, נגיש דרך הפרופיל */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  createButtonGlow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },
  createButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  createButtonActive: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 0.95 }],
  },
});
