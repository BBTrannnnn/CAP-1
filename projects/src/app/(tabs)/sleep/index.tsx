// app/(tabs)/sleep/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import DreamsScreen from './dreams';
import SleepContent from './SleepContent';
import { ScrollView, Alert, Platform, Pressable, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { YStack, XStack, Text, Button, Card, Input, Separator, TextArea } from 'tamagui';

import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';

import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api';
import { notifyConfirm, notifyError, notifySuccess, notifyInfo } from '../../../utils/notify';
import { scheduleDailyNotification } from '../../../utils/notifications';
import DateTimePickerModal from "react-native-modal-datetime-picker";

// Color constants for Sleep tabs (keep PRIMARY consistent across app)
const PRIMARY = '#9B59FF'; // Main purple
const PRIMARY_PRESSED = '#8B4AE8';
const BG = '#F4F7FB';

type Mood = '😴' | '😐' | '😊' | '😫' | '🤩';

export default function SleepLab() {
  const router = useRouter();
  const [tab, setTab] = useState<'journal' | 'support' | 'dreams'>('journal');

  // ----- Information state -----
  const [profile, setProfile] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  // ----- Journal states -----
  const [notes, setNotes] = useState('');
  const [sleepDate, setSleepDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [bedTime, setBedTime] = useState('10:30 PM');
  const [wakeTime, setWakeTime] = useState('06:30 AM');
  const [isBedTimePickerVisible, setBedTimePickerVisibility] = useState(false);
  const [isWakeTimePickerVisible, setWakeTimePickerVisibility] = useState(false);

  // Track today's sleep log ID (if any) to prevent 409 and support updates
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);

  const SLEEP_TIPS = [
    "Tránh màn hình điện tử 1 giờ trước khi ngủ. Ánh sáng xanh có thể ảnh hưởng đến melatonin.",
    "Giữ phòng ngủ tối, mát mẻ (khoảng 20-22°C) và yên tĩnh để dễ đi vào giấc ngủ hơn.",
    "Thư giãn với một cuốn sách hoặc nghe nhạc nhẹ không lời trước khi ngủ thay vì lướt web.",
    "Tránh uống caffeine (cà phê, trà) hoặc ăn quá no vào buổi tối, đặc biệt là sát giờ ngủ.",
    "Cố gắng duy trì giờ đi ngủ và thức dậy cố định mỗi ngày, kể cả cuối tuần."
  ];
  const [tipIndex, setTipIndex] = useState(0);

  // Removed factors and mood states as they are replaced by notes

  const [logs, setLogs] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNoteForDate = async (date: string) => {
    try {
      setLoading(true);
      const res = await apiGet(`/api/notes/by-date?date=${date}`);
      if (res?.success && res?.data) {
        setNotes(res.data.content);
        return res.data;
      } else {
        setNotes('');
        return null;
      }
    } catch (err: any) {
      setNotes('');
      // 404 is normal if no note exists for that day
      if (!err?.message?.includes('404')) {
        console.warn('[Sleep] Fetch note error:', err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesHistory = async () => {
    try {
      const res = await apiGet('/api/notes?page=1&limit=20');
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((item: any) => ({
          _id: item._id,
          dateISO: item.date ? item.date.slice(0, 10) : '',
          notes: item.content,
          saveTime: item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        }));
        setEntries(mapped);
      }
    } catch (err) {
      console.warn('[Sleep] Fetch notes history error:', err);
    }
  };

  // ID đang xoá (để disable nút)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Nạp dữ liệu ban đầu cho bảng thống kê
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        // Fetch Profile
        const meRes = await apiGet('/api/users/me');
        const userData = meRes?.user || meRes?.data?.user || meRes?.data || meRes;
        if (userData) {
          setProfile(userData);
          if (!userData.gender || !userData.dateOfBirth) {
            const userId = userData.id || userData._id;
            if (userId) {
              const fullP = await apiGet(`/api/users/${userId}`);
              const pData = fullP?.data || fullP;
              if (pData) setProfile(pData);
            }
          }
        }

        // Fetch Stats/Evaluation
        const statsRes = await apiGet('/api/sleep/stats');
        // Fetch Notes History
        await fetchNotesHistory();

        // 2) Lấy log từ BE để cập nhật state logs
        const res = await apiGet('/api/sleep/logs?page=1&limit=50');
        const freshLogs = normalizeLogs(res?.data || []);
        if (isCancelled) return;
        setLogs(freshLogs);

        // We trigger detection in a separate useEffect that listens to sleepDate and logs
      } catch (error) {
        if (__DEV__) {
          console.warn('[Sleep] Lỗi khi lấy logs từ BE', error);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Detect if a log exists for the currently selected sleepDate
  useEffect(() => {
    // Find a log that woke up on the selected sleepDate
    const existing = logs.find(log => getYMDFromLog(log) === sleepDate);

    if (existing) {
      setCurrentLogId(existing._id);
      // Pre-fill UI with existing data
      const w = new Date(existing.wakeAt);
      setWakeTime(formatTimeAMPM(w));
      const s = new Date(existing.sleepAt);
      setBedTime(formatTimeAMPM(s));

      // Only show evaluation if it's "today" or recent
      const todayISO = new Date().toISOString().slice(0, 10);
      if (sleepDate === todayISO) {
        setEvaluation({
          level: (existing.durationMin || 0) >= 420 ? 'success' : 'warning',
          title: (existing.durationMin || 0) >= 420 ? 'Giấc ngủ tốt' : 'Thiếu ngủ',
          message: (existing.durationMin || 0) >= 420
            ? `Tuyệt vời! Bạn đã ngủ ${formatMinToHM(existing.durationMin || 0)}. Cơ thể bạn chắc chắn đang cảm thấy rất sảng khoái, hãy duy trì thói quen này nhé!`
            : `Hôm nay bạn chỉ ngủ ${formatMinToHM(existing.durationMin || 0)} (dưới mức 7h). Bạn nên dành thêm thời gian nghỉ ngơi trưa nay và cố gắng đi ngủ sớm hơn vào buổi tối nhé.`
        });
      }
    } else {
      setCurrentLogId(null);
      // If we are on today and no record, clear evaluation
      const todayISO = new Date().toISOString().slice(0, 10);
      if (sleepDate === todayISO) {
        setEvaluation(null);
      }
    }
  }, [sleepDate, logs]);

  const getAgeGroup = (dob?: string) => {
    if (!dob) return 'N/A';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

    // Group logic: (21 - 30), etc.
    const start = Math.floor(age / 10) * 10 + 1;
    const end = start + 9;
    return `(${start} - ${end})`;
  };

  // map _id theo yyyy-mm-dd để disable nút theo hàng
  const idByDate = useMemo(() => {
    const m: Record<string, string> = {};
    for (const it of logs) {
      const ymd = getYMDFromLog(it);
      if (ymd && it?._id) m[ymd] = it._id;
    }
    return m;
  }, [logs]);

  const COL_DAY = 100;
  const COL_TIME = 80;
  const COL_NOTES = 200;
  const HEADER_FONT = 11;

  // Removed mood and factor maps as they are no longer used

  // ----- Handlers -----

  async function executeDeleteLog(logId: string, dateISO: string) {
    if (!logId) {
      notifyError('Lỗi', 'Không tìm thấy _id để xoá.');
      return;
    }
    setDeletingId(logId);
    try {
      await apiDelete(`/api/notes/${logId}`);
      await fetchNotesHistory();
      if (sleepDate === dateISO) {
        setNotes('');
      }
      notifySuccess('Đã xoá', 'Nhật ký đã được xoá.');
    } catch (err: any) {
      notifyError('Lỗi', err?.message || 'Không thể xoá nhật ký.');
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(log: any) {
    const logDate = String(log?.date || log?.dateISO || '').slice(0, 10);
    const logId = log?._id || idByDate[logDate];

    notifyConfirm({
      title: 'Xóa nhật ký',
      message: 'Bạn có chắc chắn muốn xóa nhật ký này không?',
      isDestructive: true,
      onConfirm: () => {
        executeDeleteLog(logId, logDate);
      }
    });
  }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function within7Days(iso: string) {
    const now = new Date();
    const d = new Date(iso + 'T00:00:00');
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 6 && diff >= 0;
  }

  function formatTimeAMPM(date: Date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    const strHours = hours < 10 ? '0' + hours : hours;
    return `${strHours}:${strMinutes} ${ampm}`;
  }

  const weeklyEntries = useMemo(() => {
    return entries
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  }, [entries]);

  const sleepLogs = useMemo(() => {
    return logs.filter(l => (l.durationMin || 0) >= 30);
  }, [logs]);

  const handleConfirmDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    setSleepDate(iso);
    setDatePickerVisibility(false);
    fetchNoteForDate(iso);
  };

  const handleConfirmBedTime = (date: Date) => {
    setBedTime(formatTimeAMPM(date));
    setBedTimePickerVisibility(false);
  };

  const handleConfirmWakeTime = (date: Date) => {
    setWakeTime(formatTimeAMPM(date));
    setWakeTimePickerVisibility(false);
  };

  const durationText = "";

  // Removed toggleFactor as factors are gone

  const onSaveJournalOnly = async () => {
    if (!notes.trim()) {
      notifyError('Lỗi', 'Vui lòng nhập nội dung nhật ký.');
      return;
    }
    try {
      setLoading(true);

      // Check if note already exists for this date
      const existing = await apiGet(`/api/notes/by-date?date=${sleepDate}`).catch(() => null);

      if (existing?.success && existing?.data?._id) {
        // Update
        await apiPut(`/api/notes/${existing.data._id}`, {
          content: notes,
          date: sleepDate
        });
      } else {
        // Create new
        const payload = {
          content: notes,
          date: sleepDate,
        };
        await apiPost('/api/notes', payload);
      }

      // Refresh local list
      fetchNotesHistory();

      notifySuccess('Thành công', 'Đã lưu nhật ký!');
    } catch (e: any) {
      notifyError('Lỗi', e?.data?.message || e?.message || 'Không thể lưu nhật ký.');
    } finally {
      setLoading(false);
    }
  };

  const onSaveSleepOnly = async () => {
    try {
      setLoading(true);

      const parseTime = (timeStr: string, baseDate: string) => {
        const [time, ap] = timeStr.split(' ');
        let [hh, mm] = time.split(':').map(Number);
        if (ap === 'PM' && hh !== 12) hh += 12;
        if (ap === 'AM' && hh === 12) hh = 0;
        return new Date(`${baseDate}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
      };

      let wakeAtDate = parseTime(wakeTime, sleepDate);
      let sleepAtDate = parseTime(bedTime, sleepDate);

      if (sleepAtDate > wakeAtDate) {
        sleepAtDate.setDate(sleepAtDate.getDate() - 1);
      }

      const payload = {
        sleepAt: sleepAtDate.toISOString(),
        wakeAt: wakeAtDate.toISOString(),
        notes: '', // Decoupled from notes history
      };

      const res = currentLogId
        ? await apiPut(`/api/sleep/logs/${currentLogId}`, payload)
        : await apiPost('/api/sleep/logs', payload);

      if (res?.success) {
        notifySuccess('Thành công', currentLogId ? 'Đã cập nhật giấc ngủ!' : 'Đã lưu giấc ngủ!');
        const logsRes = await apiGet('/api/sleep/logs?page=1&limit=50');
        const freshLogs = normalizeLogs(logsRes?.data || []);
        setLogs(freshLogs);

        // Update currentLogId if it was a new record
        if (res.data?._id) {
          setCurrentLogId(res.data._id);
        }

        // Update daily evaluation
        if (res.evaluation) {
          setEvaluation(res.evaluation);
        } else if (freshLogs.length > 0) {
          const latest = freshLogs[0];
          setEvaluation({
            level: (latest.durationMin || 0) >= 420 ? 'success' : 'warning',
            title: (latest.durationMin || 0) >= 420 ? 'Giấc ngủ tốt' : 'Thiếu ngủ',
            message: (latest.durationMin || 0) >= 420
              ? `Tuyệt vời! Bạn đã ngủ ${formatMinToHM(latest.durationMin || 0)}. Hãy duy trì thói quen này để cơ thể luôn tràn đầy năng lượng!`
              : `Hôm nay bạn ngủ ${formatMinToHM(latest.durationMin || 0)} (thiếu ngủ). Đừng quên đi ngủ sớm hơn tối nay và hạn chế caffeine để phục hồi sức khoẻ nhé!`
          });
        }
      }
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'Không thể lưu giấc ngủ.';
      notifyError('Lỗi', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <YStack flex={1} backgroundColor={BG}>
        {/* Header */}
        <XStack alignItems="center" paddingHorizontal={16} paddingVertical={12}>
          <Button backgroundColor="transparent" height={36} width={36} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#000" />
          </Button>
          <Text fontSize={18} fontWeight="700" style={{ marginLeft: 8 }} color="#000">{'Giấc ngủ'}</Text>
          <XStack flex={1} />
          <Button backgroundColor="transparent" height={36} width={36}>
            <Ionicons name="moon-outline" size={20} color={PRIMARY} />
          </Button>
        </XStack>

        {/* Tabs */}
        <XStack paddingHorizontal={16} marginBottom={8} gap={8}>
          {[
            { key: 'journal', label: 'Nhật ký' },
            { key: 'support', label: 'Hỗ trợ ngủ' },
            { key: 'dreams', label: 'Giấc mơ' },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <Button
                key={t.key}
                flex={1}
                height={40}
                backgroundColor={active ? PRIMARY : '#FFF'}
                borderWidth={1}
                borderColor={active ? PRIMARY : '#E8ECF3'}
                borderRadius={10}
                onPress={() => setTab(t.key as any)}
              >
                <Text color={active ? '#FFF' : '#666'} fontWeight={active ? '700' : '500'}>
                  {t.label}
                </Text>
              </Button>
            );
          })}
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {/* ============= TAB 1: JOURNAL ============= */}
          {tab === 'journal' && (
            <YStack paddingHorizontal={16}>
              {/* Card Viết Nhật ký */}
              <Card
                padding={16}
                borderRadius={12}
                borderWidth={1}
                borderColor="#E8ECF3"
                backgroundColor="#FFFFFF"
                marginTop={8}
              >
                <XStack alignItems="center" justifyContent="space-between" marginBottom={12}>
                  <XStack alignItems="center" gap={8}>
                    <Ionicons name="journal-outline" size={20} color={PRIMARY} />
                    <Text fontSize={16} fontWeight="700" color="#1F1F1F">Viết Nhật ký</Text>
                  </XStack>
                  <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                    <XStack alignItems="center" gap={4} backgroundColor="#F3E8FF" paddingHorizontal={10} paddingVertical={6} borderRadius={20}>
                      <Ionicons name="calendar-outline" size={14} color={PRIMARY} />
                      <Text color={PRIMARY} fontSize={13} fontWeight="600">{formatVN(sleepDate)}</Text>
                    </XStack>
                  </TouchableOpacity>
                </XStack>

                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onConfirm={(d) => {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const iso = `${yyyy}-${mm}-${dd}`;
                    setSleepDate(iso);
                    setDatePickerVisibility(false);
                    fetchNoteForDate(iso);
                  }}
                  onCancel={() => setDatePickerVisibility(false)}
                />
                <TextArea
                  placeholder="Viết nhật ký mỗi ngày có thể giúp bạn nhẹ lòng hơn..."
                  value={notes}
                  onChangeText={setNotes}
                  marginTop={12}
                  height={100}
                  fontSize={14}
                  borderRadius={10}
                  borderColor="#E8ECF3"
                  backgroundColor="#F9FBFF"
                />
                <Button
                  marginTop={16}
                  height={48}
                  borderRadius={10}
                  backgroundColor={PRIMARY}
                  pressStyle={{ backgroundColor: PRIMARY_PRESSED, scale: 0.98 }}
                  onPress={onSaveJournalOnly}
                  disabled={loading}
                >
                  <Text color="white" fontWeight="700" fontSize={15}>Lưu nhật ký</Text>
                </Button>
              </Card>

              {/* Card Giấc ngủ */}
              <Card
                padding={16}
                borderRadius={12}
                borderWidth={1}
                borderColor="#E8ECF3"
                backgroundColor="#FFFFFF"
                marginTop={16}
              >
                <XStack alignItems="center" gap={8} marginBottom={12}>
                  <Ionicons name="bed-outline" size={20} color={PRIMARY} />
                  <Text fontSize={16} fontWeight="700" color="#1F1F1F">Giấc ngủ</Text>
                </XStack>

                <YStack marginTop={12}>
                  <XStack gap={12}>
                    <YStack flex={1}>
                      <Text fontSize={13} color="#6B6B6B">Giờ đi ngủ</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setBedTimePickerVisibility(true)}
                      >
                        <XStack
                          alignItems="center"
                          height={48}
                          borderRadius={10}
                          borderWidth={1}
                          borderColor="#E8ECF3"
                          backgroundColor="#F9FBFF"
                          paddingHorizontal={12}
                          marginTop={6}
                        >
                          <Ionicons name="time-outline" size={18} color={PRIMARY} />
                          <Text flex={1} style={{ marginLeft: 8 }} color="#1F1F1F">{bedTime}</Text>
                        </XStack>
                      </TouchableOpacity>
                    </YStack>

                    <YStack flex={1}>
                      <Text fontSize={13} color="#6B6B6B">Giờ thức dậy</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setWakeTimePickerVisibility(true)}
                      >
                        <XStack
                          alignItems="center"
                          height={48}
                          borderRadius={10}
                          borderWidth={1}
                          borderColor="#E8ECF3"
                          backgroundColor="#F9FBFF"
                          paddingHorizontal={12}
                          marginTop={6}
                        >
                          <Ionicons name="sunny-outline" size={18} color="#FFB000" />
                          <Text flex={1} style={{ marginLeft: 8 }} color="#1F1F1F">{wakeTime}</Text>
                        </XStack>
                      </TouchableOpacity>
                    </YStack>
                  </XStack>
                </YStack>

                <Button
                  backgroundColor={PRIMARY}
                  color="white"
                  height={48}
                  borderRadius={10}
                  pressStyle={{ backgroundColor: PRIMARY_PRESSED, scale: 0.98 }}
                  onPress={onSaveSleepOnly}
                  disabled={loading}
                >
                  <Text color="white" fontWeight="600" fontSize={15}>
                    {currentLogId ? 'Cập nhật giấc ngủ' : 'Lưu giấc ngủ'}
                  </Text>
                </Button>

                <DateTimePickerModal
                  isVisible={isBedTimePickerVisible}
                  mode="time"
                  onConfirm={(d) => {
                    setBedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    setBedTimePickerVisibility(false);
                  }}
                  onCancel={() => setBedTimePickerVisibility(false)}
                />
                <DateTimePickerModal
                  isVisible={isWakeTimePickerVisible}
                  mode="time"
                  onConfirm={(d) => {
                    setWakeTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    setWakeTimePickerVisibility(false);
                  }}
                  onCancel={() => setWakeTimePickerVisibility(false)}
                />
              </Card>

              {/* Card Chất lượng giấc ngủ (formerly Thông tin bổ sung) */}
              <Card
                padding={16}
                borderRadius={12}
                borderWidth={1}
                borderColor="#E8ECF3"
                backgroundColor="#FFFFFF"
                marginTop={16}
              >
                <XStack alignItems="center" gap={8} marginBottom={12}>
                  <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
                  <Text fontSize={16} fontWeight="700" color="#1F1F1F">Chất lượng giấc ngủ</Text>
                </XStack>

                <YStack gap={8}>
                  {profile && (
                    <>
                      <XStack justifyContent="space-between">
                        <Text color="#6B6B6B">Giới tính:</Text>
                        <Text fontWeight="600" color="#1F1F1F">
                          {profile.gender === 'male' || profile.gender === 'Nam' ? 'Nam' : 'Nữ'}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <Text color="#6B6B6B">Độ tuổi:</Text>
                        <Text fontWeight="600" color="#1F1F1F">
                          {getAgeGroup(profile?.dateOfBirth)}
                        </Text>
                      </XStack>
                    </>
                  )}

                  <XStack justifyContent="space-between">
                    <Text color="#6B6B6B">Chất lượng:</Text>
                    <Text
                      fontWeight="600"
                      color={
                        evaluation?.level === 'success'
                          ? '#2E7D32'
                          : evaluation?.level === 'warning'
                            ? '#D32F2F'
                            : '#1976D2'
                      }
                    >
                      {evaluation?.title || 'Đang chờ ghi nhận hôm nay...'}
                    </Text>
                  </XStack>

                  <Separator marginVertical={10} borderColor="#EEE" />

                  <Text fontSize={14} color="#6B6B6B" fontStyle="italic">
                    Lời nhắn hôm nay:
                  </Text>
                  <Text fontSize={14} color="#1F1F1F" marginTop={4}>
                    {evaluation?.message || 'Hãy ghi lại giấc ngủ sáng nay để xem đánh giá nhanh nhé!'}
                  </Text>
                </YStack>
              </Card>

              {/* Bảng lịch sử Nhật ký */}
              <Card
                padding={16}
                borderRadius={12}
                borderWidth={1}
                borderColor="#E8ECF3"
                backgroundColor="#FFFFFF"
                marginTop={16}
              >
                <XStack alignItems="center" gap={8} marginBottom={10}>
                  <Ionicons name="journal-outline" size={20} color={PRIMARY} />
                  <Text fontSize={17} fontWeight="700" color="#1F1F1F">Lịch sử Nhật ký</Text>
                </XStack>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <YStack>
                    <XStack backgroundColor="#F7F9FC" paddingVertical={8} paddingHorizontal={10} borderRadius={10} borderWidth={1} borderColor="#E5E9F0">
                      <Text fontSize={11} fontWeight="700" color="#6B6B6B" style={{ width: 80 }}>Ngày</Text>
                      <Text fontSize={11} fontWeight="700" color="#6B6B6B" style={{ width: 60 }}>Giờ lưu</Text>
                      <Text fontSize={11} fontWeight="700" color="#6B6B6B" style={{ width: 140, marginLeft: 10 }}>Nội dung</Text>
                      <Text fontSize={11} fontWeight="700" color="#6B6B6B" style={{ width: 80, textAlign: 'center' }}>Thao tác</Text>
                    </XStack>
                    {entries.length === 0 ? (
                      <Text
                        fontSize={13}
                        color="#6B6B6B"
                        textAlign="center"
                        marginTop={12}
                        paddingHorizontal={10}
                      >
                        Chưa có dữ liệu nhật ký.
                      </Text>
                    ) : (
                      entries.map((e, idx) => (
                        <XStack key={idx} paddingVertical={10} paddingHorizontal={10} borderBottomWidth={1} borderColor="#EEF1F5" alignItems="center">
                          <Text fontSize={13} style={{ width: 80 }} color="#333">{formatVN(e.dateISO)}</Text>
                          <Text fontSize={13} style={{ width: 60 }} color="#333">{e.saveTime}</Text>
                          <Pressable onPress={() => notifyInfo(`Nhật ký ${formatVN(e.dateISO)}`, e.notes || '')}>
                            <Text fontSize={13} style={{ width: 140, marginLeft: 10 }} numberOfLines={1} color="#333">{e.notes || '—'}</Text>
                          </Pressable>
                          <XStack gap={12} style={{ width: 80 }} justifyContent="center">
                            <TouchableOpacity onPress={() => {
                              setSleepDate(e.dateISO);
                              setNotes(e.notes || '');
                              notifyInfo('Sửa nhật ký', 'Nội dung đã được đưa lên trên để chỉnh sửa.');
                            }}>
                              <Ionicons name="create-outline" size={18} color={PRIMARY} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => executeDeleteLog(e._id, e.dateISO)}>
                              <Ionicons name="trash-outline" size={18} color="#E53935" />
                            </TouchableOpacity>
                          </XStack>
                        </XStack>
                      ))
                    )}
                  </YStack>
                </ScrollView>
              </Card>

              {/* Mẹo ngủ ngon */}
              <Card
                backgroundColor="#F3E8FF"
                borderWidth={1}
                borderColor="#E3D7FE"
                borderRadius={12}
                paddingHorizontal={16}
                paddingVertical={14}
                marginTop={16}
                marginBottom={20}
              >
                <XStack alignItems="center">
                  <Ionicons name="bulb-outline" size={20} color={PRIMARY_PRESSED} />
                  <YStack style={{ marginLeft: 10, flex: 1 }}>
                    <Text fontSize={14} fontWeight="700" color="#1F1F1F">Mẹo ngủ ngon</Text>
                    <Text fontSize={13} color="#6B6B6B" marginTop={4}>
                      {SLEEP_TIPS[tipIndex]}
                    </Text>
                    <Button
                      size="$2"
                      marginTop={8}
                      backgroundColor={PRIMARY_PRESSED}
                      borderRadius={999}
                      alignSelf="flex-start"
                      onPress={() => setTipIndex((prev) => (prev + 1) % SLEEP_TIPS.length)}
                    >
                      <Text fontSize={11} color="white">Mẹo khác</Text>
                    </Button>
                  </YStack>
                </XStack>
              </Card>
            </YStack>
          )}

          {/* ============= TAB 2: SUPPORT ============= */}
          {tab === 'support' && <SleepContent />}

          {/* ============= TAB 3: DREAMS ============= */}
          {tab === 'dreams' && <DreamsScreen />}
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}

/** Utility to normalize logs from BE */
function normalizeLogs(raw: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.map(it => ({
    _id: it?._id,
    sleepAt: it?.sleepAt,
    wakeAt: it?.wakeAt,
    durationMin: it?.durationMin,
    date: it?.sleepAt ? it.sleepAt.slice(0, 10) : ''
  }));
}

/** Parse YMD from a log object - Based on wakeAt because that defines "today's sleep" */
function getYMDFromLog(log: any) {
  if (!log?.wakeAt) return '';
  // Convert wakeAt to local date YYYY-MM-DD
  const d = new Date(log.wakeAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMinToHM(mins: number) {
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${h}h ${mm}m`;
}

function formatVN(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function labelMood(m: string) {
  switch (m) {
    case '😊': return 'Tích cực';
    case '😐': return 'Bình thường';
    case '😫': return 'Mệt mỏi';
    case '😴': return 'Buồn ngủ';
    case '🤩': return 'Hưng phấn';
    default: return '';
  }
}