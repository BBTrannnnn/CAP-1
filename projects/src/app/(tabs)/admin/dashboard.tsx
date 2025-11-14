import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AdminTabs from './_components/AdminTabs'; 

const C = {
  bg: '#F6F8FB', card: '#FFFFFF', text: '#111111', sub: '#6B6B6B', border: '#E9E9EF',
};

function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, minWidth: 150 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: C.sub }}>{label}</Text>
        {icon}
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', marginTop: 8, color: C.text }}>{value}</Text>
      {!!note && <Text style={{ marginTop: 6, color: C.sub }}>{note}</Text>}
    </View>
  );
}

export default function AdminDashboard() {
  const visits = [
    { name: 'Thứ 2', value: 234 }, { name: 'Thứ 3', value: 189 }, { name: 'Thứ 4', value: 298 },
    { name: 'Thứ 5', value: 267 }, { name: 'Thứ 6', value: 312 }, { name: 'Thứ 7', value: 156 }, { name: 'Chủ nhật', value: 98 },
  ];
  const max = Math.max(...visits.map(v => v.value));

  return (
    <>
      <Stack.Screen options={{ title: 'Dashboard Quản Trị', headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
        <AdminTabs />

        <View style={{ marginHorizontal: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>Dashboard Quản Trị</Text>
          <Text style={{ color: C.sub, marginTop: 4 }}>Tổng quan hệ thống và thống kê</Text>
        </View>

        <View style={{ margin: 16, flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <StatCard icon={<Ionicons name="people-circle-outline" size={18} color={C.text} />} label="Tổng số người dùng" value="1,234" note="+12% so với tháng trước" />
          <StatCard icon={<Ionicons name="pulse-outline" size={18} color={C.text} />} label="Phiên hoạt động" value="456" note="Đang trực tuyến hiện tại" />
          <StatCard icon={<Ionicons name="document-text-outline" size={18} color={C.text} />} label="Báo cáo mới" value="23" note="Cần xem xét" />
          <StatCard icon={<Ionicons name="trending-up-outline" size={18} color={C.text} />} label="Tăng trưởng" value="+18.2%" note="So với tuần trước" />
        </View>

        <View style={{ marginHorizontal: 16, gap: 12 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 }}>
            <Text style={{ fontWeight: '800', color: C.text }}>Hoạt động gần đây</Text>
            {[
              { text: 'Người dùng mới đăng ký', email: 'user@example.com', at: '2 phút trước' },
              { text: 'Báo cáo được gửi', email: 'admin@example.com', at: '15 phút trước' },
              { text: 'Tài khoản được cập nhật', email: 'test@example.com', at: '1 giờ trước' },
              { text: 'Đăng nhập thất bại', email: 'unknown@example.com', at: '2 giờ trước' },
            ].map((it, idx) => (
              <View key={idx} style={{ borderTopWidth: idx === 0 ? 0 : 1, borderColor: C.border, paddingVertical: 12 }}>
                <Text style={{ color: C.text, fontWeight: '700' }}>{it.text}</Text>
                <Text style={{ color: C.sub }}>{it.email} • {it.at}</Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 }}>
            <Text style={{ fontWeight: '800', color: C.text }}>Thống kê truy cập • 7 ngày gần đây</Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              {visits.map(v => (
                <View key={v.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ width: 72, color: C.sub }}>{v.name}</Text>
                  <View style={{ flex: 1, height: 10, backgroundColor: '#EDEFF3', borderRadius: 999, overflow: 'hidden' }}>
                    <View style={{ width: `${(v.value / max) * 100}%`, height: '100%', backgroundColor: '#0B1220' }} />
                  </View>
                  <Text style={{ width: 48, textAlign: 'right', color: C.text }}>{v.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
