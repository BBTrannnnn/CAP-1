import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  getInventory,
  useShield,
  useFreeze,
  useRevive,
} from '../../../server/inventory';
import { getHabits } from '../../../server/habits';
import { Habit } from '../../../../types/habit';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
};

type ItemType = 'streakShield' | 'freezeToken' | 'reviveToken';

type HistoryItem = {
  _id: string;
  itemType: ItemType;
  usedAt: string;
  habitId?: string;
  habitName?: string;
  protectedDate?: string;
  freezeDays?: number;
};

function formatDateLabel(d: Date | null) {
  if (!d) return 'Chọn ngày';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ItemsBagScreen() {
  const [items, setItems] = useState({
    streakShields: 0,
    freezeTokens: 0,
    reviveTokens: 0,
  });

  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  // state cho chọn habit & ngày
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedHabitName, setSelectedHabitName] = useState('');
  const [showHabitList, setShowHabitList] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [freezeDays, setFreezeDays] = useState('1');

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [inventoryData, habitsResponse] = await Promise.all([
        getInventory(),
        getHabits(),
      ]);

      if (!habitsResponse || !habitsResponse.success) {
        throw new Error(habitsResponse?.message || 'Lỗi khi tải danh sách habits');
      }
      const userHabits = habitsResponse.habits;
      setHabits(userHabits);

      if (inventoryData.success) {
        setItems({
          streakShields: inventoryData.inventory.streakShields || 0,
          freezeTokens: inventoryData.inventory.freezeTokens || 0,
          reviveTokens: inventoryData.inventory.reviveTokens || 0,
        });
        const historyWithHabitNames = inventoryData.usageHistory.map(
          (h: HistoryItem) => {
            const habit = userHabits.find(
              (habit: Habit) => String(habit._id) === String(h.habitId)
            );
            return { ...h, habitName: habit?.name || 'Habit đã xóa' };
          }
        );
        setHistory(historyWithHabitNames);
      } else {
        throw new Error(
          inventoryData.message || 'Lỗi khi tải dữ liệu inventory'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra.');
      Alert.alert('Lỗi', err.message || 'Không thể kết nối tới server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const openModal = (itemType: ItemType) => {
    setSelectedItem(itemType);
    setModalVisible(true);
  };

  const resetSelection = () => {
    setSelectedHabitId(null);
    setSelectedHabitName('');
    setSelectedDate(null);
    setShowHabitList(false);
    setFreezeDays('1');
  };

  const handleConfirmUse = async () => {
    if (!selectedItem || !selectedHabitId) {
      Alert.alert('Thiếu thông tin', 'Hãy chọn một Habit.');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Thiếu thông tin', 'Hãy chọn ngày.');
      return;
    }

    try {
      let response;
      const habitId = selectedHabitId;
      const date = formatDateISO(selectedDate);

      if (selectedItem === 'streakShield') {
        response = await useShield({ habitId, date });
      } else if (selectedItem === 'reviveToken') {
        response = await useRevive({ habitId, date });
      } else if (selectedItem === 'freezeToken') {
        const days = parseInt(freezeDays, 10);
        if (isNaN(days) || days < 1 || days > 30) {
          Alert.alert(
            'Số ngày không hợp lệ',
            'Số ngày đóng băng phải là một số từ 1 đến 30.'
          );
          return;
        }
        response = await useFreeze({ habitId, startDate: date, days });
      }

      if (response && response.success) {
        Alert.alert('Thành công', response.message || 'Đã sử dụng vật phẩm!');
        await fetchAllData(); // Refresh data
        setModalVisible(false);
        resetSelection();
        setSelectedItem(null);
      } else {
        throw new Error(response?.message || 'Sử dụng vật phẩm thất bại.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thực hiện thao tác.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.danger, marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity onPress={() => fetchAllData()}>
          <Text style={{ color: COLORS.primary }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Túi Vật Phẩm' }} />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      >
        {/* SHIELD */}
        <ItemCard
          title="Streak Shield"
          subtitle="Bảo vệ streak 1 ngày cụ thể"
          color="#1E40AF"
          available={items.streakShields}
          onUse={() => openModal('streakShield')}
        />

        {/* FREEZE */}
        <ItemCard
          title="Freeze Token"
          subtitle="Đóng băng habit 1–30 ngày"
          color="#0E7490"
          available={items.freezeTokens}
          onUse={() => openModal('freezeToken')}
        />

        {/* REVIVE */}
        <ItemCard
          title="Revive Token"
          subtitle="Hồi sinh streak bị fail"
          color="#BE123C"
          available={items.reviveTokens}
          onUse={() => openModal('reviveToken')}
        />

        {/* HISTORY */}
        <Text style={{ marginTop: 24, marginBottom: 8, fontWeight: '800', fontSize: 16 }}>
          Lịch Sử Sử Dụng
        </Text>

        {history.map((h) => (
          <View
            key={h._id}
            style={{
              backgroundColor: COLORS.card,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{h.habitName}</Text>
              <Text style={{ color: COLORS.subtext }}>
                {new Date(h.usedAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>

            <Text style={{ marginTop: 4 }}>
              {h.itemType === 'streakShield' &&
                `Sử dụng Shield cho ngày ${h.protectedDate
                  ? new Date(h.protectedDate).toLocaleDateString('vi-VN')
                  : ''
                }`}
              {h.itemType === 'freezeToken' &&
                `Đóng băng habit ${h.freezeDays || ''} ngày`}
              {h.itemType === 'reviveToken' &&
                `Hồi sinh streak cho ngày ${h.protectedDate
                  ? new Date(h.protectedDate).toLocaleDateString('vi-VN')
                  : ''
                }`}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* POPUP */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 20,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 10 }}>
              Sử Dụng{' '}
              {selectedItem === 'streakShield'
                ? 'Streak Shield'
                : selectedItem === 'freezeToken'
                  ? 'Freeze Token'
                  : 'Revive Token'}
            </Text>

            {/* Chọn Habit */}
            <TouchableOpacity
              onPress={() => setShowHabitList((prev) => !prev)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  color: selectedHabitId ? COLORS.text : COLORS.subtext,
                  flex: 1,
                }}
              >
                {selectedHabitId ? selectedHabitName : '— Chọn Habit —'}
              </Text>
              <Ionicons
                name={showHabitList ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={COLORS.subtext}
              />
            </TouchableOpacity>

            {showHabitList && (
              <View
                style={{
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  maxHeight: 220,
                  overflow: 'hidden',
                }}
              >
                <ScrollView>
                  {habits.map((h) => {
                    const active = h._id === selectedHabitId;
                    return (
                      <TouchableOpacity
                        key={h._id}
                        onPress={() => {
                          setSelectedHabitId(h._id as string);
                          setSelectedHabitName(h.name);
                          setShowHabitList(false);
                        }}
                        style={{
                          padding: 12,
                          backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                          borderBottomWidth: 1,
                          borderBottomColor: '#F1F5F9',
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: active ? '700' : '500',
                            color: COLORS.text,
                          }}
                        >
                          {h.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Chọn ngày */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
                borderRadius: 12,
                marginBottom: selectedItem === 'freezeToken' ? 12 : 0,
              }}
            >
              <Text style={{ color: selectedDate ? COLORS.text : COLORS.subtext }}>
                {selectedItem === 'freezeToken'
                  ? `Ngày bắt đầu: ${formatDateLabel(selectedDate)}`
                  : formatDateLabel(selectedDate)}
              </Text>
            </TouchableOpacity>

            {/* Input số ngày đóng băng */}
            {selectedItem === 'freezeToken' && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: COLORS.subtext, marginBottom: 4 }}>
                  Số ngày đóng băng (1-30):
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 12,
                    borderRadius: 12,
                    color: COLORS.text,
                    fontWeight: '500',
                  }}
                  value={freezeDays}
                  onChangeText={setFreezeDays}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            )}

            {/* Nút xác nhận */}
            <TouchableOpacity
              onPress={handleConfirmUse}
              style={{
                marginTop: 18,
                backgroundColor: COLORS.primary,
                padding: 14,
                borderRadius: 999,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '800' }}>Xác Nhận Sử Dụng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetSelection();
              }}
              style={{
                marginTop: 10,
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.danger }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DatePicker bên ngoài Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
    </>
  );
}

interface ItemCardProps {
  title: string;
  subtitle: string;
  color: string;
  available: number;
  onUse: () => void;
}

function ItemCard({ title, subtitle, color, available, onUse }: ItemCardProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontWeight: '800', fontSize: 16 }}>{title}</Text>
      <Text style={{ color: COLORS.subtext, marginTop: 4 }}>{subtitle}</Text>

      <View
        style={{
          marginTop: 14,
          borderRadius: 10,
          backgroundColor: color,
          paddingVertical: 10,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={onUse} disabled={available <= 0}>
          <Text style={{ color: '#FFF', fontWeight: '800' }}>Sử dụng</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 8, color: COLORS.subtext }}>
        {available} có sẵn
      </Text>
    </View>
  );
}
