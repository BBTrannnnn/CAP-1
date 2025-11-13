import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AdminTabs from './_components/AdminTabs'; // hoặc './AdminTabs'

const C = {
  bg: '#F6F8FB', card: '#FFFFFF', text: '#111111', sub: '#6B6B6B', border: '#E9E9EF',
  danger: '#DC2626', success: '#16A34A', dark: '#0F172A',
};

type Role = 'Quản trị viên' | 'Người dùng';
type Status = 'Hoạt động' | 'Đã cấm';
type User = { id: string; name: string; email: string; role: Role; status: Status; joined: string; initials: string; };

const SEED: User[] = [
  { id: '1', name: 'Nguyễn Văn A', email: 'admin@example.com', role: 'Quản trị viên', status: 'Hoạt động', joined: '15/1/2024', initials: 'NV' },
  { id: '2', name: 'Trần Thị B', email: 'user1@example.com', role: 'Người dùng', status: 'Hoạt động', joined: '20/2/2024', initials: 'TT' },
  { id: '3', name: 'Lê Văn C', email: 'user2@example.com', role: 'Người dùng', status: 'Hoạt động', joined: '10/3/2024', initials: 'LV' },
  { id: '4', name: 'Phạm Thị D', email: 'banned@example.com', role: 'Người dùng', status: 'Đã cấm', joined: '5/1/2024', initials: 'PT' },
];

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<User[]>(SEED);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'Người dùng' });

  const filtered = useMemo(() => users.filter(u => (u.name + u.email).toLowerCase().includes(q.toLowerCase())), [q, users]);

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', role: 'Người dùng' }); setModalVisible(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role }); setModalVisible(true); setMenuFor(null); };

  const saveModal = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, name: form.name.trim(), email: form.email.trim(), role: form.role } : u));
    } else {
      const initials = form.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
      setUsers(prev => [...prev, { id: String(Date.now()), name: form.name.trim(), email: form.email.trim(), role: form.role, status: 'Hoạt động', joined: new Date().toLocaleDateString('vi-VN'), initials }]);
    }
    setModalVisible(false);
  };
  const removeUser = (id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); setMenuFor(null); };
  const toggleBan = (u: User) => { setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: x.status === 'Hoạt động' ? 'Đã cấm' : 'Hoạt động' } : x)); setMenuFor(null); };

  const RoleBadge = ({ role }: { role: Role }) => (
    <View style={{ alignSelf: 'flex-start', backgroundColor: '#0B1220', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 }}>
      <Text style={{ color: '#FFF', fontWeight: '700' }}>{role}</Text>
    </View>
  );
  const StatusBadge = ({ status }: { status: Status }) => (
    <View style={{ alignSelf: 'flex-start', backgroundColor: status === 'Hoạt động' ? '#E7F7EC' : '#FDE6E6', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 }}>
      <Text style={{ color: status === 'Hoạt động' ? C.success : C.danger, fontWeight: '700' }}>{status}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Quản Lý Tài Khoản', headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
        <AdminTabs />

        <View style={{ marginHorizontal: 16, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>Quản Lý Tài Khoản</Text>
            <Text style={{ color: C.sub, marginTop: 4 }}>Quản lý người dùng và phân quyền hệ thống</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={{ backgroundColor: C.dark, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '800', marginLeft: 8 }}>Thêm người dùng</Text>
          </TouchableOpacity>
        </View>

  <View style={{ margin: 16, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, overflow: 'visible' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F6FA', borderRadius: 10, paddingHorizontal: 12, height: 44 }}>
            <Ionicons name="search-outline" size={18} color={C.sub} />
            <TextInput placeholder="Tìm kiếm theo tên hoặc email…" value={q} onChangeText={setQ} style={{ marginLeft: 8, flex: 1 }} />
          </View>

          <View style={{ flexDirection: 'row', paddingVertical: 14, marginTop: 6 }}>
            {['Người dùng', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tham gia', 'Thao tác'].map((t, i) => (
              <Text key={t} style={{ flex: i === 0 ? 2 : 1, color: C.sub, fontWeight: '700' }}>{t}</Text>
            ))}
          </View>

          {filtered.map(u => (
            <View key={u.id} style={[{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: C.border, paddingVertical: 14, position: 'relative' },
              menuFor === u.id && { zIndex: 9999, elevation: 20 }
            ]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDF2F7', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '800' }}>{u.initials}</Text>
                </View>
                <Text style={{ marginLeft: 10, fontWeight: '700', color: C.text }}>{u.name}</Text>
              </View>

              <Text style={{ flex: 1, color: C.text }}>{u.email}</Text>
              <View style={{ flex: 1 }}><RoleBadge role={u.role} /></View>
              <View style={{ flex: 1 }}><StatusBadge status={u.status} /></View>
              <Text style={{ flex: 1, color: C.text }}>{u.joined}</Text>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={() => setMenuFor(menuFor === u.id ? null : u.id)} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={C.text} />
                </TouchableOpacity>

                {menuFor === u.id && (
                  <View style={{ position: 'absolute', top: 38, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: C.border, borderRadius: 12, width: 180, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 20, zIndex: 9999 }}>
                    <TouchableOpacity onPress={() => { openEdit(u); setMenuFor(null); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                      <Ionicons name="create-outline" size={18} color={C.text} /><Text style={{ marginLeft: 8, color: C.text }}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                    {u.status === 'Hoạt động' ? (
                      <TouchableOpacity onPress={() => { toggleBan(u); setMenuFor(null); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                        <Ionicons name="ban-outline" size={18} color="#C2410C" /><Text style={{ marginLeft: 8, color: '#C2410C' }}>Cấm tài khoản</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => { toggleBan(u); setMenuFor(null); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                        <Ionicons name="person-outline" size={18} color={C.text} /><Text style={{ marginLeft: 8, color: C.text }}>Bỏ cấm</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { removeUser(u.id); setMenuFor(null); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                      <Ionicons name="trash-outline" size={18} color={C.danger} /><Text style={{ marginLeft: 8, color: C.danger }}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal thêm/sửa */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: '90%', maxWidth: 600, backgroundColor: '#FFF', borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>{editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={22} color={C.text} /></TouchableOpacity>
            </View>
            <Text style={{ color: C.sub, marginBottom: 12 }}>Nhập thông tin để {editing ? 'cập nhật' : 'tạo'} tài khoản</Text>

            <Field label="Họ và tên">
              <TextInput placeholder="Nguyễn Văn A" value={form.name} onChangeText={v => setForm(s => ({ ...s, name: v }))} style={inputStyle} />
            </Field>
            <Field label="Email">
              <TextInput placeholder="email@example.com" value={form.email} onChangeText={v => setForm(s => ({ ...s, email: v }))} autoCapitalize="none" keyboardType="email-address" style={inputStyle} />
            </Field>
            <Field label="Vai trò">
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setForm(s => ({ ...s, role: 'Người dùng' }))}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: form.role === 'Người dùng' ? C.dark : C.border,
                    backgroundColor: form.role === 'Người dùng' ? '#EEF2FF' : '#F4F6FA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: C.text }}>Người dùng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setForm(s => ({ ...s, role: 'Quản trị viên' }))}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: form.role === 'Quản trị viên' ? C.dark : C.border,
                    backgroundColor: form.role === 'Quản trị viên' ? '#EEF2FF' : '#F4F6FA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: C.text }}>Quản trị viên</Text>
                </TouchableOpacity>
              </View>
            </Field>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={btnSecondary}><Text>Hủy</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveModal} style={btnPrimary}><Text style={{ color: '#FFF', fontWeight: '800' }}>{editing ? 'Lưu' : 'Thêm mới'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ marginBottom: 6, fontWeight: '700', color: C.text }}>{label}</Text>
      {children}
    </View>
  );
}

const inputStyle = { backgroundColor: '#F4F6FA', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: C.border } as const;
const btnSecondary = { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F4F6FA', borderWidth: 1, borderColor: C.border } as const;
const btnPrimary = { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.dark } as const;
