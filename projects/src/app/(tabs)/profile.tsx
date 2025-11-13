import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

// If you don't have a useAuth store yet, use local fallbacks
// import { useAuth } from '@/stores/auth'; // <-- uncomment when store exists

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  dark: '#0F172A',
  danger: '#DC2626',
  success: '#16A34A',
};

export default function ProfileScreen() {
  const router = useRouter();

  // If there's no auth store available yet, use fallbacks so the screen still renders.
  const logout = undefined;
  const user = null;

  // ❗ GIỮ MỘT HÀM onLogout DUY NHẤT
  const onLogout = async () => {
    try {
  await (logout as any)?.(); // nếu có store, sẽ xóa token, user...
    } finally {
      router.replace('/(auth)/login'); // quay về màn login và “đóng” stack hiện tại
    }
  };

  // Fallback demo nếu chưa có store: dùng user giả (xoá block này nếu đã có user từ store)
  const demoUser =
    user ?? {
      name: 'Nguyễn Văn A',
      email: 'admin@example.com',
      role: 'admin' as 'admin' | 'user',
      avatarUrl: '',
      streak: 7,
    };

  return (
    <>
      <Stack.Screen options={{ title: 'Trang cá nhân', headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Thông tin người dùng */}
          <View
            style={{
              margin: 16,
              backgroundColor: COLORS.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {demoUser.avatarUrl ? (
                <Image
                  source={{ uri: demoUser.avatarUrl }}
                  style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EDF2F7' }}
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#EDF2F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '800', color: COLORS.text }}>
                    {demoUser.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>
                  Xin chào, {demoUser.name}
                </Text>
                <Text style={{ color: COLORS.subtext, marginTop: 2 }}>{demoUser.email}</Text>

                {/* Huy hiệu quyền */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 8,
                    backgroundColor: demoUser.role === 'admin' ? COLORS.dark : COLORS.primary,
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
                >
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>
                    {demoUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Menu tác vụ cá nhân */}
            <View style={{ marginTop: 16, gap: 10 }}>
              {[
                { icon: 'person-circle-outline', label: 'Thông tin cá nhân', onPress: () => {} },
                { icon: 'settings-outline', label: 'Cài đặt', onPress: () => {} },
                { icon: 'help-circle-outline', label: 'Trợ giúp và hỗ trợ', onPress: () => {} },
                { icon: 'log-out-outline', label: 'Đăng xuất', danger: true, onPress: onLogout },
              ].map(item => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  activeOpacity={0.9}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                    backgroundColor: '#FFF',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.danger ? COLORS.danger : COLORS.text}
                    />
                    <Text
                      style={{
                        marginLeft: 10,
                        color: item.danger ? COLORS.danger : COLORS.text,
                        fontWeight: '700',
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.subtext} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Khu vực quản trị (chỉ hiện nếu là admin) */}
          {demoUser.role === 'admin' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.text} />
                <Text style={{ marginLeft: 8, fontWeight: '800', color: COLORS.text }}>
                  Bảng điều khiển quản trị viên
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16 }}>
                <TouchableOpacity
                  onPress={() => router.push('../admin/dashboard')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: COLORS.dark,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="grid-outline" size={18} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('../admin/users')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: '#EEF4FF',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons name="people-outline" size={18} color={COLORS.text} />
                  <Text style={{ color: COLORS.text, fontWeight: '800' }}>Quản lý tài khoản</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
