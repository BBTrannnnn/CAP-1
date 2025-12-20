// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts } from 'expo-font';

import {
  getProfile,
  getUserById,
  updateProfile,
  updateAdditionalInfo,
  logout as apiLogout,
  getMyAchievements,
} from '../../../server/users';
import { getHabits, getHabitStats } from '../../../server/habits';
import { notifyError, notifySuccess } from '../../../utils/notify';

export const ACHIEVEMENTS_DATA: any = {
  streak_7: { id: 'streak_7', title: 'Week Warrior', description: 'Duy trì streak 7 ngày', icon: 'flash', rarity: 'common', rewards: { streakShields: 1 } },
  streak_14: { id: 'streak_14', title: 'Two Weeks Strong', description: 'Duy trì streak 14 ngày', icon: 'barbell', rarity: 'common', rewards: { freezeTokens: 1 } },
  streak_30: { id: 'streak_30', title: 'Monthly Master', description: 'Duy trì streak 30 ngày', icon: 'star', rarity: 'rare', rewards: { streakShields: 1, freezeTokens: 1 } },
  streak_60: { id: 'streak_60', title: 'Streak Champion', description: 'Duy trì streak 60 ngày', icon: 'trophy', rarity: 'rare', rewards: { streakShields: 2, freezeTokens: 2 } },
  streak_120: { id: 'streak_120', title: 'Century Legend', description: 'Duy trì streak 100 ngày', icon: 'diamond', rarity: 'epic', rewards: { streakShields: 3, freezeTokens: 3, reviveTokens: 1 } },
  streak_365: { id: 'streak_365', title: 'Year Champion', description: 'Duy trì streak 365 ngày', icon: 'ribbon', rarity: 'legendary', rewards: { streakShields: 5, freezeTokens: 5, reviveTokens: 2 } },
  total_10: { id: 'total_10', title: 'First Steps', description: 'Hoàn thành 10 lần thói quen', icon: 'footsteps', rarity: 'common', rewards: { streakShields: 1 } },
  total_50: { id: 'total_50', title: 'Getting Started', description: 'Hoàn thành 50 lần thói quen', icon: 'rocket', rarity: 'common', rewards: { freezeTokens: 1 } },
  total_100: { id: 'total_100', title: 'Dedicated', description: 'Hoàn thành 100 lần thói quen', icon: 'ribbon', rarity: 'rare', rewards: { streakShields: 2, freezeTokens: 1 } },
  total_500: { id: 'total_500', title: 'Habit Master', description: 'Hoàn thành 500 lần thói quen', icon: 'medal', rarity: 'epic', rewards: { streakShields: 3, freezeTokens: 2, reviveTokens: 1 } },
  total_1000: { id: 'total_1000', title: 'Legendary Master', description: 'Hoàn thành 1000 lần thói quen', icon: 'key', rarity: 'legendary', rewards: { streakShields: 4, freezeTokens: 3, reviveTokens: 2 } }
};

// Default Logo
const LOGO_URI = require('../../../assets/images/FlowState.png');

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
};

type Role = 'admin' | 'moderator' | 'user';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: Role;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  trustScore?: number;
};

function parseDateString(input?: string | null): Date | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d;
}

function formatDateIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDMY(d: Date | null): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('../../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // card “Thông tin cá nhân”
  const [summary, setSummary] = useState<UserProfile | null>(null);

  // form “Cập nhật thông tin”
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [address, setAddress] = useState('');
  const [showUpdateSection, setShowUpdateSection] = useState(true);
  const [showAchievementSection, setShowAchievementSection] = useState(false);
  const [achievements, setAchievements] = useState<any>(null);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  const [maxStreak, setMaxStreak] = useState(0);

  const fetchAchievements = async () => {
    try {
      setLoadingAchievements(true);

      // Lấy dữ liệu thành tựu và habits song song
      const [res, habitsRes] = await Promise.all([
        getMyAchievements(),
        getHabits()
      ]);

      const habitsList = habitsRes?.habits || habitsRes?.data || habitsRes || [];
      // Tìm streak lớn nhất và tổng số lần hoàn thành lớn nhất từ các habits
      let maxStreakLocal = 0;
      let maxCompletions = 0;

      habitsList.forEach((h: any) => {
        if ((h.currentStreak || 0) > maxStreakLocal) maxStreakLocal = h.currentStreak;
        if ((h.totalCompletions || 0) > maxCompletions) maxCompletions = h.totalCompletions;
      });
      setMaxStreak(maxStreakLocal);

      const serverAchievementsRaw = res?.data || res || [];
      const serverAchievements = Array.isArray(serverAchievementsRaw) ? serverAchievementsRaw : [];

      // Nếu server chưa trả về dữ liệu hoặc trả về mảng rỗng, ta map dữ liệu mẫu dựa trên maxStreak thực tế
      if (serverAchievements.length === 0) {
        const mapped = Object.values(ACHIEVEMENTS_DATA).map((base: any) => {
          let progress = 0;
          let total = 0;
          if (base.id.startsWith('streak_')) {
            total = parseInt(base.id.split('_')[1]);
            progress = maxStreakLocal;
          } else {
            total = parseInt(base.id.split('_')[1]);
            progress = maxCompletions;
          }
          return {
            ...base,
            unlocked: progress >= total,
            progress,
            total,
            desc: base.description,
            type: base.rarity === 'common' ? 'Phổ thông' : base.rarity === 'rare' ? 'Hiếm' : base.rarity === 'epic' ? 'Sử thi' : 'Huyền thoại'
          };
        });
        setAchievements(mapped);
      } else {
        setAchievements(serverAchievements);
      }
    } catch (error) {
      console.error('[Profile] fetchAchievements error:', error);
    } finally {
      setLoadingAchievements(false);
    }
  };

  const getStats = () => {
    if (!achievements || !Array.isArray(achievements)) return { common: 0, rare: 0, epic: 0, legendary: 0 };
    return {
      common: achievements.filter((a: any) => (a.type === 'Phổ thông' || a.rarity === 'common') && a.unlocked).length,
      rare: achievements.filter((a: any) => (a.type === 'Hiếm' || a.rarity === 'rare') && a.unlocked).length,
      epic: achievements.filter((a: any) => (a.type === 'Sử thi' || a.rarity === 'epic') && a.unlocked).length,
      legendary: achievements.filter((a: any) => (a.type === 'Huyền thoại' || a.rarity === 'legendary') && a.unlocked).length,
    };
  };

  const achievementStats = getStats();

  const [showInfoSection, setShowInfoSection] = useState(true);
  const isAdmin = summary?.role === 'admin';
  const isModerator = summary?.role === 'moderator';

  const loadProfile = async () => {
    try {
      setLoading(true);

      // 1. /me để lấy id + role
      const meRes = await getProfile();
      const me = meRes?.user || meRes?.data?.user || meRes?.data || meRes;
      const userId = me.id || me._id;
      if (!userId) throw new Error('Không tìm được ID người dùng từ /me');

      // 2. /api/users/:id lấy full profile (DOB, gender, address...)
      const profileRes = await getUserById(userId);
      const p = profileRes?.data || profileRes?.user || profileRes;

      const normalized: UserProfile = {
        id: p.id || p._id || userId,
        name: p.name,
        email: p.email,
        phone: p.phone,
        role: p.role || me.role || 'user',
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        address: p.address,
      };

      setUser(normalized);
      setSummary(normalized);

      // đổ data vào form
      setName(normalized.name || '');
      setEmail(normalized.email || '');
      setPhone(normalized.phone || '');
      setDob(parseDateString(normalized.dateOfBirth));
      setAddress(normalized.address || '');

      const g = (normalized.gender || '').toLowerCase();
      if (g === 'male' || g === 'female') {
        setGender(g);
      } else {
        setGender(null);
      }
    } catch (err: any) {
      console.log('[loadProfile] error', err?.message || err);
      notifyError('Lỗi', err?.message || 'Không thể tải hồ sơ người dùng');
    } finally {
      setLoading(false);
      // Fetch achievements immediately when profile is loaded
      fetchAchievements();
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSave = async () => {
    if (!user) return;

    if (!name.trim() || !email.trim()) {
      notifyError('Lỗi', 'Tên và email không được để trống');
      return;
    }

    if (!dob) {
      notifyError('Lỗi', 'Vui lòng chọn ngày sinh');
      return;
    }

    if (!gender) {
      notifyError('Lỗi', 'Vui lòng chọn giới tính');
      return;
    }

    const dobIso = formatDateIso(dob);

    try {
      setSaving(true);

      // Use updateProfile which supports all fields
      await updateProfile(user.id, {
        name,
        email,
        phone,
        dateOfBirth: dobIso,
        gender,
        address,
      });

      // 3. load lại profile từ BE
      await loadProfile();

      notifySuccess('Thành công', 'Cập nhật hồ sơ thành công');
    } catch (err: any) {
      console.log('[onSave] error', err?.message || err);
      notifyError('Lỗi', err?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch { }
    router.replace('/(auth)/login');
  };

  if (loading || !summary) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.background,
          }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: COLORS.subtext }}>Đang tải hồ sơ...</Text>
        </SafeAreaView>
      </>
    );
  }

  const genderLabel =
    summary.gender === 'male'
      ? 'Nam'
      : summary.gender === 'female'
        ? 'Nữ'
        : '—';

  const dobLabel = parseDateString(summary.dateOfBirth);

  const initials =
    summary.name
      ?.split(' ')
      .map((s: string) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {/* Page Title */}
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#000000',
              marginHorizontal: 16,
              marginTop: 10,
              marginBottom: 10
            }}>
              Hồ sơ cá nhân
            </Text>
            {/* CARD THÔNG TIN CƠ BẢN */}
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
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#EDF2F7',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 20, color: COLORS.text }}>{initials}</Text>
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>
                    Xin chào, {summary.name}
                  </Text>
                  <Text style={{ color: COLORS.subtext, marginTop: 2 }}>{summary.email}</Text>
                  <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: isAdmin ? '#DC2626' : isModerator ? '#3B82F6' : '#64748B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                      {isAdmin ? 'Quản trị viên' : isModerator ? 'Mod' : 'Người dùng'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>


            {/* MENU DÀNH CHO ADMIN */}
            {isAdmin && (
              <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
                {/* Dashboard */}
                <TouchableOpacity
                  onPress={() => router.push('/admin/dashboard')}
                  style={{
                    marginTop: 4,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="speedometer-outline" size={20} color={COLORS.text} />
                    <Text style={{ marginLeft: 10, fontWeight: '700', color: COLORS.text }}>
                      Dashboard
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color={COLORS.subtext} />
                </TouchableOpacity>

                {/* Quản lý tài khoản */}
                <TouchableOpacity
                  onPress={() => router.push('/admin/users')}
                  style={{
                    marginTop: 8,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={20} color={COLORS.text} />
                    <Text style={{ marginLeft: 10, fontWeight: '700', color: COLORS.text }}>
                      Quản lý tài khoản
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color={COLORS.subtext} />
                </TouchableOpacity>
              </View>
            )}

            {/* TÚI VẬT PHẨM – dùng chung cho cả admin & user */}
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile/item')}
                style={{
                  marginTop: 4,
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="gift-outline" size={20} color={COLORS.text} />
                  <Text style={{ marginLeft: 10, fontWeight: '700', color: COLORS.text }}>
                    Túi vật phẩm
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            {/* THÀNH TỰU */}
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setShowAchievementSection(prev => !prev)}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="trophy" size={24} color="#F59E0B" />
                  <View>
                    <Text style={{ fontWeight: '800', color: COLORS.text, fontSize: 16 }}>Thành tựu cá nhân</Text>
                    <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                      Đã mở khóa {(Array.isArray(achievements) ? (achievements as any[]).filter(a => a.unlocked).length : 0)} thành tựu
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={showAchievementSection ? 'chevron-down-outline' : 'chevron-forward-outline'}
                  size={18}
                  color={COLORS.subtext}
                />
              </TouchableOpacity>

              {showAchievementSection && (
                <View style={{
                  marginTop: 8,
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16
                }}>
                  {/* Category Stats */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    {[
                      { count: achievementStats.common, label: 'Phổ thông', color: '#64748B' },
                      { count: achievementStats.rare, label: 'Hiếm', color: '#3B82F6' },
                      { count: achievementStats.epic, label: 'Sử thi', color: '#A855F7' },
                      { count: achievementStats.legendary, label: 'Huyền thoại', color: '#F59E0B' },
                    ].map((cat, i) => (
                      <View key={i} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: cat.color }}>{cat.count}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.subtext }}>{cat.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Tabs */}
                  {loadingAchievements ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <AchievementTabs achievements={achievements} />
                  )}
                </View>
              )}
            </View>

            {/* FORM CẬP NHẬT */}
            <TouchableOpacity
              onPress={() => setShowUpdateSection(prev => !prev)}
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: '#FFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontWeight: '800', color: COLORS.text }}>Thông tin cá nhân</Text>
                <Text style={{ fontSize: 12, color: COLORS.subtext }}>
                  Nhấn để {showUpdateSection ? 'thu gọn' : 'mở rộng'}
                </Text>
              </View>
              <Ionicons
                name={showUpdateSection ? 'chevron-down-outline' : 'chevron-forward-outline'}
                size={18}
                color={COLORS.subtext}
              />
            </TouchableOpacity>

            {showUpdateSection && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 8,
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16,
                }}
              >
                <Field label="Họ và tên">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nhập họ và tên"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Email">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Nhập email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Số điện thoại">
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Ngày sinh">
                  <TouchableOpacity onPress={() => setShowDobPicker(true)}>
                    <View style={[inputStyle, { justifyContent: 'center' }]}>
                      <Text style={{ color: dob ? COLORS.text : COLORS.subtext }}>
                        {dob ? formatDateDMY(dob) : 'Chọn ngày sinh'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Field>

                {showDobPicker && (
                  <DateTimePicker
                    value={dob || new Date(2004, 1, 3)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDobPicker(false);
                      if (selectedDate) {
                        setDob(selectedDate);
                        if (__DEV__) console.log('[Profile] dob picked:', selectedDate);
                      }
                    }}
                  />
                )}


                <Field label="Giới tính">
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([
                      { value: 'male', label: 'Nam' },
                      { value: 'female', label: 'Nữ' },
                    ] as const).map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setGender(opt.value)}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          borderRadius: 999,
                          paddingVertical: 8,
                          alignItems: 'center',
                          backgroundColor: gender === opt.value ? COLORS.primary : '#FFF',
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            color: gender === opt.value ? '#FFF' : COLORS.text,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Field>

                <Field label="Địa chỉ">
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Nhập địa chỉ"
                    style={[inputStyle, { height: 70, textAlignVertical: 'top' }]}
                    multiline
                  />
                </Field>

                <TouchableOpacity
                  onPress={onSave}
                  disabled={saving}
                  style={{
                    marginTop: 12,
                    backgroundColor: COLORS.primary,
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ĐĂNG XUẤT */}
            <View style={{ marginHorizontal: 16, marginTop: 24 }}>
              <TouchableOpacity
                onPress={onLogout}
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
                  <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                  <Text style={{ marginLeft: 10, color: COLORS.danger, fontWeight: '700' }}>
                    Đăng xuất
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView >
    </>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ marginBottom: 4, color: COLORS.subtext, fontWeight: '600' }}>{props.label}</Text>
      {props.children}
    </View>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontSize: 12, color: COLORS.subtext }}>{props.label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>{props.value}</Text>
    </View>
  );
}

function AchievementTabs({ achievements }: { achievements: any[] | null }) {
  const [activeTab, setActiveTab] = useState<'unlocked' | 'locked'>('unlocked');

  const items = Array.isArray(achievements) ? achievements : [];

  const unlockedItems = items.filter(i => i.unlocked);
  const lockedItems = items.filter(i => !i.unlocked);

  // Fallback data if API returns empty
  const displayUnlocked = unlockedItems;

  const displayLocked = lockedItems;

  return (
    <View>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('unlocked')}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'unlocked' ? '#2563EB' : 'transparent' }}
        >
          <Text style={{ fontWeight: '700', color: activeTab === 'unlocked' ? '#2563EB' : '#64748B' }}>Đã mở khóa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('locked')}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'locked' ? '#2563EB' : 'transparent' }}
        >
          <Text style={{ fontWeight: '700', color: activeTab === 'locked' ? '#2563EB' : '#64748B' }}>Chưa đạt được</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'unlocked' ? (
        <View style={{ gap: 12 }}>
          {displayUnlocked.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={(item.icon || 'star') as any} size={20} color={item.color || '#F59E0B'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '800', fontSize: 14, color: '#1E293B' }}>{item.title}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>{item.type || 'Phổ thông'}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '700' }}>Phần thưởng:</Text>
                  {item.rewards?.streakShields && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>{item.rewards.streakShields} Streak Shield</Text>
                    </View>
                  )}
                  {item.rewards?.freezeTokens && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="snow" size={12} color="#3B82F6" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#3B82F6' }}>{item.rewards.freezeTokens} Freeze Token</Text>
                    </View>
                  )}
                  {item.rewards?.reviveTokens && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="heart" size={12} color="#DC2626" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>{item.rewards.reviveTokens} Revive Token</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={{ fontSize: 10, color: '#94A3B8' }}>{item.date || ''}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {displayLocked.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
                <Ionicons name={(item.icon || 'lock-closed') as any} size={20} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="lock-closed" size={12} color="#94A3B8" />
                    <Text style={{ fontWeight: '800', fontSize: 14, color: '#64748B' }}>{item.title}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>{item.type || 'Phổ thông'}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.desc}</Text>

                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 10, color: '#64748B' }}>Tiến độ</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>{item.progress || 0}/{item.total || 100}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(((item.progress || 0) / (item.total || 1)) * 100, 100)}%`, backgroundColor: '#3B82F6' }} />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: '#94A3B8' }}>Phần thưởng:</Text>
                  {item.rewards?.streakShields && (
                    <Ionicons name="shield-checkmark" size={12} color="#94A3B8" />
                  )}
                  {item.rewards?.freezeTokens && (
                    <Ionicons name="snow" size={12} color="#94A3B8" />
                  )}
                  {item.rewards?.reviveTokens && (
                    <Ionicons name="heart" size={12} color="#94A3B8" />
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'unlocked' && displayUnlocked.length === 0 && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#64748B', fontSize: 14 }}>Chưa có thành tựu nào được mở khóa</Text>
        </View>
      )}

      {activeTab === 'locked' && displayLocked.length === 0 && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#64748B', fontSize: 14 }}>Tất cả thành tựu đã được mở khóa!</Text>
        </View>
      )}
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 8,
  backgroundColor: '#FFF',
};