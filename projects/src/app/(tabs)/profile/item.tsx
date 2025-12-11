import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
};

type ItemType = 'shield' | 'freeze' | 'revive';

type HistoryItem = {
  id: number;
  habit: string;
  type: ItemType;
  date: string;
};

const HABIT_OPTIONS = [
  { id: 'h1', name: 'Viết nhật ký' },
  { id: 'h2', name: 'Tập thể dục' },
  { id: 'h3', name: 'Đọc sách' },
];

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
    shield: 5,
    freeze: 3,
    revive: 2,
  });

  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 1, habit: 'Viết nhật ký', type: 'revive', date: '2025-12-05' },
    { id: 2, habit: 'Tập thể dục', type: 'freeze', date: '2025-12-06' },
    { id: 3, habit: 'Đọc sách', type: 'shield', date: '2025-12-05' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  // state cho chọn habit & ngày
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedHabitName, setSelectedHabitName] = useState('');
  const [showHabitList, setShowHabitList] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const openModal = (itemType: ItemType) => {
    setSelectedItem(itemType);
    setModalVisible(true);
  };

  const resetSelection = () => {
    setSelectedHabitId(null);
    setSelectedHabitName('');
    setSelectedDate(null);
    setShowHabitList(false);
  };

  const handleConfirmUse = () => {
    if (!selectedItem) return;

    if (!selectedHabitId || !selectedDate) {
      Alert.alert('Thiếu thông tin', 'Hãy chọn Habit và ngày trước khi dùng.');
      return;
    }

    const habitName =
      selectedHabitName ||
      HABIT_OPTIONS.find(h => h.id === selectedHabitId)?.name ||
      'Habit';

    // Trừ số lượng item
    setItems(prev => ({
      ...prev,
      [selectedItem]: Math.max(0, prev[selectedItem] - 1),
    }));

    // Thêm vào lịch sử
    setHistory(prev => {
      const nextId = prev.length > 0 ? prev[0].id + 1 : 1;
      const newItem: HistoryItem = {
        id: nextId,
        habit: habitName,
        type: selectedItem,
        date: formatDateISO(selectedDate),
      };
      return [newItem, ...prev];
    });

    Alert.alert('Thành công', 'Đã sử dụng vật phẩm!');
    setModalVisible(false);
    resetSelection();
    setSelectedItem(null);
  };

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
          available={items.shield}
          onUse={() => openModal('shield')}
        />

        {/* FREEZE */}
        <ItemCard
          title="Freeze Token"
          subtitle="Đóng băng habit 1–30 ngày"
          color="#0E7490"
          available={items.freeze}
          onUse={() => openModal('freeze')}
        />

        {/* REVIVE */}
        <ItemCard
          title="Revive Token"
          subtitle="Hồi sinh streak bị fail"
          color="#BE123C"
          available={items.revive}
          onUse={() => openModal('revive')}
        />

        {/* HISTORY */}
        <Text style={{ marginTop: 24, marginBottom: 8, fontWeight: '800', fontSize: 16 }}>
          Lịch Sử Sử Dụng
        </Text>

        {history.map(h => (
          <View
            key={h.id}
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
              <Text style={{ fontWeight: '700' }}>{h.habit}</Text>
              <Text style={{ color: COLORS.subtext }}>{h.date}</Text>
            </View>

            <Text style={{ marginTop: 4 }}>
              {h.type === 'shield' && 'Sử dụng Shield'}
              {h.type === 'freeze' && 'Đóng băng habit'}
              {h.type === 'revive' && 'Hồi sinh streak'}
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
              {selectedItem === 'shield'
                ? 'Streak Shield'
                : selectedItem === 'freeze'
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
                  {HABIT_OPTIONS.map((h) => {
                    const active = h.id === selectedHabitId;
                    return (
                      <TouchableOpacity
                        key={h.id}
                        onPress={() => {
                          setSelectedHabitId(h.id);
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
              }}
            >
              <Text style={{ color: selectedDate ? COLORS.text : COLORS.subtext }}>
                {formatDateLabel(selectedDate)}
              </Text>
            </TouchableOpacity>

            {/* Nút xác nhận */}
            <TouchableOpacity
              onPress={() => {
                if (!selectedHabitId || !selectedDate) {
                  Alert.alert('Thiếu thông tin', 'Hãy chọn Habit và ngày trước khi dùng.');
                  return;
                }
                // TODO: logic thực sự (gửi API, cập nhật lịch sử, trừ số lượng...)
                setModalVisible(false);
              }}
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
              onPress={() => setModalVisible(false)}
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
        <TouchableOpacity onPress={onUse}>
          <Text style={{ color: '#FFF', fontWeight: '800' }}>Sử dụng</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 8, color: COLORS.subtext }}>
        {available} có sẵn
      </Text>
    </View>
  );
}
