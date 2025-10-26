// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, TrendingUp, Moon, Users, User } from '@tamagui/lucide-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        tabBarStyle: {
          position: 'absolute',
          height: 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 10 : 8,
          borderTopWidth: 1,
          borderTopColor: 'rgba(203,213,225,.6)',
          backgroundColor: 'rgba(255,255,255,0.96)',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Trang chủ', tabBarIcon: ({ color, size=22 }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="habits/index"
        options={{ title: 'Thói quen', tabBarIcon: ({ color, size=22 }) => <TrendingUp color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="sleep"
        options={{ title: 'Giấc ngủ', tabBarIcon: ({ color, size=22 }) => <Moon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: 'Cộng đồng', tabBarIcon: ({ color, size=22 }) => <Users color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Cá nhân', tabBarIcon: ({ color, size=22 }) => <User color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="habits/AddHabitModal"
        options={{ href:null }}
      />
      <Tabs.Screen
        name="habits/CreateHabitDetail"
        options={{ href:null }}
      />
      <Tabs.Screen
        name="habits/HabitStreak"
        options={{ href:null }}
      />
      <Tabs screenOptions={{ tabBarShowLabel: false }} />
    </Tabs>
  );
}
