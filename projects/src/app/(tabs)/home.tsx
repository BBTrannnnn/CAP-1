// src/app/(tabs)/home.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';
import {
  YStack,
  XStack,
  Card,
  Text,
  Button,
} from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { SafeAreaView, Image } from 'react-native';

const PRIMARY_COLOR = '#9B59FF';
const LIGHT_BACKGROUND_COLOR = '#F5F7FF';
const CARD_BACKGROUND_COLOR = '#FFFFFF';

const HEALTH_TIPS = [
  "Uống một cốc nước ấm khi thức dậy để đánh thức cơ thể và cải thiện tuần hoàn.",
  "Ăn nhiều rau xanh và trái cây mỗi ngày để bổ sung vitamin và khoáng chất.",
  "Dành ít nhất 30 phút mỗi ngày để vận động, đi bộ hoặc tập thể dục nhẹ nhàng.",
  "Hạn chế đồ uống có đường và nước ngọt có gas để bảo vệ sức khỏe tim mạch.",
  "Ngủ đủ 7-8 tiếng mỗi đêm giúp cơ thể phục hồi năng lượng và tinh thần minh mẫn."
];

export default function HomeScreen() {
  const router = useRouter();
  const FLOW_STATE_LOGO = require('../../assets/images/FlowState.png');
  const [tipIndex, setTipIndex] = useState(0);

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LIGHT_BACKGROUND_COLOR }}>
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Phần tiêu đề: logo + streak giả lập */}
          {/* Phần tiêu đề: logo + text FlowState + streak */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal={0} // Parent has padding 16
            paddingTop={10}
            paddingBottom={10}
            marginBottom={18}
          >
            {/* Left: Logo + Text */}
            <XStack alignItems="center" gap="$2">
              <Image
                source={FLOW_STATE_LOGO}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
              <Text
                fontSize={22}
                color="#1F1F1F"
                fontWeight="500"
                style={{
                  // Fallback for handwritten style if font not available
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                }}
              >
                FlowState
              </Text>
            </XStack>

            {/* Right: Streak */}
            <Text fontSize={13} color="#6B6B6B">
              Streak: <Text fontWeight="700">7 ngày</Text>
            </Text>
          </XStack>

          {/* RIVERS CỦA BẠN */}
          <Text
            fontSize={16}
            fontWeight="700"
            color="#1F1F1F"
            style={{ marginBottom: 10 }}
          >
            Rivers của bạn
          </Text>

          {/* Mindful River */}
          <Card style={[styles.card, { padding: 14 }]}>
            <XStack
              justifyContent="space-between"
              alignItems="center"
              style={{ marginBottom: 8 }}
            >
              <XStack alignItems="center" style={{ columnGap: 8 }}>
                <Ionicons name="leaf-outline" size={20} color="#27AE60" />
                <YStack>
                  <Text fontSize={15} fontWeight="700" color="#1F1F1F">
                    Mindful River
                  </Text>
                  <Text fontSize={12} color="#6B6B6B">
                    Thiền định &amp; Chánh niệm
                  </Text>
                </YStack>
              </XStack>
              <Text fontSize={13} fontWeight="600" color="#27AE60">
                75%
              </Text>
            </XStack>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: '75%', backgroundColor: '#27AE60' },
                ]}
              />
            </View>
          </Card>

          {/* Sleep River */}
          <Card
            style={[
              styles.card,
              { padding: 14, marginTop: 10 },
            ]}
          >
            <XStack
              justifyContent="space-between"
              alignItems="center"
              style={{ marginBottom: 8 }}
            >
              <XStack alignItems="center" style={{ columnGap: 8 }}>
                <Ionicons name="bed-outline" size={20} color="#3498DB" />
                <YStack>
                  <Text fontSize={15} fontWeight="700" color="#1F1F1F">
                    Sleep River
                  </Text>
                  <Text fontSize={12} color="#6B6B6B">
                    Giấc ngủ chất lượng
                  </Text>
                </YStack>
              </XStack>
              <Text fontSize={13} fontWeight="600" color="#3498DB">
                60%
              </Text>
            </XStack>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: '60%', backgroundColor: '#3498DB' },
                ]}
              />
            </View>
          </Card>

          {/* HÀNH ĐỘNG NHANH */}
          <Text
            fontSize={16}
            fontWeight="700"
            color="#1F1F1F"
            style={{ marginTop: 20, marginBottom: 10 }}
          >
            Hành động nhanh
          </Text>

          {/* Ghi thói quen */}
          <Card
            style={[styles.card, { padding: 14, marginBottom: 10 }]}
            pressStyle={{ opacity: 0.9 }}
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              // Tamagui cho phép onPress ở XStack khi dùng Card pressable
              onPress={() => router.push('/habits')}
            >
              <XStack alignItems="center" style={{ columnGap: 10 }}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: '#EAF8F0' },
                  ]}
                >
                  <Ionicons
                    name="checkmark-done-outline"
                    size={18}
                    color="#27AE60"
                  />
                </View>
                <YStack>
                  <Text fontSize={15} fontWeight="600" color="#1F1F1F">
                    Thói quen
                  </Text>
                  <Text fontSize={12} color="#6B6B6B">
                    Thay đổi để tốt hơn
                  </Text>
                </YStack>
              </XStack>
              <Ionicons name="chevron-forward" size={18} color="#B0BAC9" />
            </XStack>
          </Card>

          {/* Nhật ký ngủ */}
          <Card
            style={[styles.card, { padding: 14, marginBottom: 10 }]}
            pressStyle={{ opacity: 0.9 }}
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              onPress={() => router.push('/sleep')}
            >
              <XStack alignItems="center" style={{ columnGap: 10 }}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: '#E8F0FF' },
                  ]}
                >
                  <Ionicons
                    name="moon-outline"
                    size={18}
                    color={PRIMARY_COLOR}
                  />
                </View>
                <YStack>
                  <Text fontSize={15} fontWeight="600" color="#1F1F1F">
                    Nhật ký ngủ
                  </Text>
                  <Text fontSize={12} color="#6B6B6B">
                    Theo dõi giấc ngủ
                  </Text>
                </YStack>
              </XStack>
              <Ionicons name="chevron-forward" size={18} color="#B0BAC9" />
            </XStack>
          </Card>

          {/* Cộng đồng – dẫn sang tab Cộng đồng */}
          <Card
            style={[styles.card, { padding: 14, marginBottom: 10 }]}
            pressStyle={{ opacity: 0.9 }}
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              onPress={() => router.push('/community')}
            >
              <XStack alignItems="center" style={{ columnGap: 10 }}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: '#FFF4E8' },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color="#E67E22"
                  />
                </View>
                <YStack>
                  <Text fontSize={15} fontWeight="600" color="#1F1F1F">
                    Cộng đồng
                  </Text>
                  <Text fontSize={12} color="#6B6B6B">
                    Kết nối & chia sẻ
                  </Text>
                </YStack>
              </XStack>
              <Ionicons name="chevron-forward" size={18} color="#B0BAC9" />
            </XStack>
          </Card>

          {/* MẸO SỨC KHỎE HÔM NAY */}
          <Card
            style={[
              styles.card,
              {
                backgroundColor: '#F9E5FF',
                borderColor: '#F2C8FF',
                padding: 16,
                marginTop: 14,
                marginBottom: 24,
              },
            ]}
          >
            <Text
              fontSize={13}
              fontWeight="700"
              color={PRIMARY_COLOR}
              style={{ marginBottom: 6 }}
            >
              💜 Mẹo sức khỏe hôm nay
            </Text>
            <Text
              fontSize={13}
              color="#4A4A4A"
              style={{ marginBottom: 10 }}
            >
              {HEALTH_TIPS[tipIndex]}
            </Text>
            <Button
              size="$2"
              borderRadius={999}
              backgroundColor={PRIMARY_COLOR}
              color="white"
              alignSelf="flex-start"
              onPress={handleNextTip}
            >
              Mẹo tiếp theo
            </Button>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND_COLOR,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: CARD_BACKGROUND_COLOR,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7F0',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#EEF1FA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
