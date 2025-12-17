// src/app/admin/users.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getAllUsers,
  updateProfile,
  deleteUser,
  adminCreateUser,
  apiRequest,
} from '../../server/users';
import { notifyError, notifySuccess } from '../../utils/notify';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
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

function formatDateDMYFromString(input?: string | null): string {
  const d = parseDateString(input);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateDMY(d: Date | null): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

type Role = 'admin' | 'user';
type Gender = 'male' | 'female';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // edit modal



  // create form
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newDob, setNewDob] = useState<Date | null>(null);
  const [showNewDobPicker, setShowNewDobPicker] = useState(false);
  const [newGender, setNewGender] = useState<Gender | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'moderator'>('user');

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await getAllUsers();

      let list: any[] = [];

      if (Array.isArray(res?.data)) {
        list = res.data;
      }
      else if (Array.isArray(res)) {
        list = res;
      }
      else if (Array.isArray(res?.data?.users)) {
        list = res.data.users;
      } else if (Array.isArray(res?.users)) {
        list = res.users;
      }

      setUsers(list);
    } catch (e) {
      console.log("loadUsers error", e);
      notifyError("Lỗi", "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const keyword = search.toLowerCase();
    return users.filter((u) => {
      return (
        u.name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword) ||
        u.phone?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);






  const onDeleteUser = async (u: any) => {
    const id = u._id || u.id;
    Alert.alert('Xoá tài khoản', `Bạn chắc chắn muốn xoá tài khoản ${u.email}?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            notifySuccess('Thành công', 'Xoá tài khoản thành công');
            await loadUsers();
          } catch (e: any) {
            console.log('onDeleteUser error', e?.message || e);
            notifyError('Lỗi', e?.message || 'Xoá tài khoản thất bại');
          }
        },
      },
    ]);
  };

  const onCreateUser = async () => {
    if (!newName || !newEmail || !newPhone || !newPassword || !newConfirmPassword || !newAddress.trim()) {
      notifyError('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!newDob) {
      notifyError('Lỗi', 'Vui lòng chọn ngày sinh');
      return;
    }
    if (!newGender) {
      notifyError('Lỗi', 'Vui lòng chọn giới tính');
      return;
    }

    const dobIso = formatDateIso(newDob);

    try {
      setCreating(true);
      await adminCreateUser({
        name: newName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        confirmPassword: newConfirmPassword,
        role: newRole,
        dateOfBirth: dobIso,
        gender: newGender,
        address: newAddress.trim(),
      });

      notifySuccess('Thành công', 'Tạo tài khoản mới thành công');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewDob(null);
      setNewGender(null);
      setNewAddress('');
      setNewRole('user');

      await loadUsers();
    } catch (e: any) {
      console.log('onCreateUser error', e?.message || e);
      notifyError('Lỗi', e?.message || 'Tạo tài khoản thất bại');
    } finally {
      setCreating(false);
    }
  };

  const renderGenderLabel = (g?: string) => {
    if (!g) return '—';
    const lower = g.toLowerCase();
    if (lower === 'male') return 'Nam';
    if (lower === 'female') return 'Nữ';
    return '—';
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý tài khoản', headerShown: true }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: COLORS.subtext }}>Đang tải danh sách...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Search */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons name="search-outline" size={18} color={COLORS.subtext} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo tên, email, số điện thoại..."
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>

            {/* Form thêm tài khoản */}
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontWeight: '800', marginBottom: 8 }}>Thêm tài khoản mới</Text>

              <Field label="Họ tên">
                <TextInput style={inputStyle} value={newName} onChangeText={setNewName} />
              </Field>
              <Field label="Email">
                <TextInput
                  style={inputStyle}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Số điện thoại">
                <TextInput
                  style={inputStyle}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="Ngày sinh">
                <TouchableOpacity onPress={() => setShowNewDobPicker(true)}>
                  <View style={[inputStyle, { justifyContent: 'center' }]}>
                    <Text style={{ color: newDob ? COLORS.text : COLORS.subtext }}>
                      {newDob ? formatDateDMY(newDob) : 'Chọn ngày sinh'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Field>

              {showNewDobPicker && (
                <DateTimePicker
                  value={newDob || new Date(2004, 1, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowNewDobPicker(false);
                    if (selectedDate) setNewDob(selectedDate);
                  }}
                />
              )}
              <Field label="Giới tính">
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {([
                    { value: 'male' as Gender, label: 'Nam' },
                    { value: 'female' as Gender, label: 'Nữ' },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setNewGender(opt.value)}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 999,
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: newGender === opt.value ? COLORS.primary : '#FFF',
                      }}
                    >
                      <Text
                        style={{
                          color: newGender === opt.value ? '#FFF' : COLORS.text,
                          fontWeight: '700',
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
              <Field label="Vai trò">
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {([
                    { value: 'user' as const, label: 'User' },
                    { value: 'moderator' as const, label: 'Moderator' },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setNewRole(opt.value)}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 999,
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: newRole === opt.value ? COLORS.primary : '#FFF',
                      }}
                    >
                      <Text
                        style={{
                          color: newRole === opt.value ? '#FFF' : COLORS.text,
                          fontWeight: '700',
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
                  style={[inputStyle, { height: 70, textAlignVertical: 'top' }]}
                  value={newAddress}
                  onChangeText={setNewAddress}
                  placeholder="Nhập địa chỉ"
                  multiline
                />
              </Field>

              <Field label="Mật khẩu">
                <TextInput
                  style={inputStyle}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </Field>
              <Field label="Xác nhận mật khẩu">
                <TextInput
                  style={inputStyle}
                  value={newConfirmPassword}
                  onChangeText={setNewConfirmPassword}
                  secureTextEntry
                />
              </Field>

              <TouchableOpacity
                onPress={onCreateUser}
                disabled={creating}
                style={{
                  marginTop: 10,
                  backgroundColor: COLORS.primary,
                  borderRadius: 999,
                  paddingVertical: 10,
                  alignItems: 'center',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Tạo tài khoản</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Danh sách tài khoản */}
            {filteredUsers.map((u) => {
              const id = u._id || u.id;
              return (
                <View
                  key={id}
                  style={{
                    marginBottom: 10,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: COLORS.text }}>{u.name}</Text>
                      <Text style={{ color: COLORS.subtext, fontSize: 12 }}>{u.email}</Text>
                      {u.phone && (
                        <Text style={{ color: COLORS.subtext, fontSize: 12 }}>{u.phone}</Text>
                      )}
                      <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                        Ngày sinh: {formatDateDMYFromString(u.dateOfBirth) || '—'}
                      </Text>
                      <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                        Giới tính: {renderGenderLabel(u.gender)}
                      </Text>
                      <Text style={{ marginTop: 4, fontSize: 12 }}>
                        Vai trò:{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'moderator' ? 'Moderator' : 'User'}
                        </Text>
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>


                      <TouchableOpacity
                        onPress={() => onDeleteUser(u)}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                        <Text
                          style={{
                            marginLeft: 4,
                            color: COLORS.danger,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          Xoá
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredUsers.length === 0 && (
              <Text style={{ textAlign: 'center', color: COLORS.subtext, marginTop: 12 }}>
                Không tìm thấy tài khoản nào
              </Text>
            )}
          </ScrollView>
        )}
      </SafeAreaView>


    </>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ marginBottom: 4, color: COLORS.subtext, fontWeight: '600' }}>
        {props.label}
      </Text>
      {props.children}
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
