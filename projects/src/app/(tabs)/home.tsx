// src/app/(tabs)/home.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Animated,
  ImageBackground,
  Image,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  YStack,
  XStack,
  Card,
  Text,
  Button,
} from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

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

type SlideType = 'city' | 'landscape' | 'river';

const SLIDES: { image: any; type: SlideType }[] = [
  // 🌃 Thành phố về đêm (2 ảnh)
  { image: require('../../assets/inspiration/city_night_01.jpg'), type: 'city' },
  { image: require('../../assets/inspiration/city_night_02.jpg'), type: 'city' },

  // 🌿 Phong cảnh (3 ảnh)
  { image: require('../../assets/inspiration/landscape_01.jpg'), type: 'landscape' },
  { image: require('../../assets/inspiration/landscape_02.jpg'), type: 'landscape' },
  { image: require('../../assets/inspiration/landscape_03.jpg'), type: 'landscape' },

  // 🌊 Dòng sông (2 ảnh)
  { image: require('../../assets/inspiration/river_01.jpg'), type: 'river' },
  { image: require('../../assets/inspiration/river_02.jpg'), type: 'river' },
];

const QUOTES: Record<SlideType, string[]> = {
  city: [
    "Thành phố chậm lại khi đêm xuống.",
    "Giữa ánh đèn, vẫn có khoảng lặng.",
    "Một ngày dài đã qua — bạn làm tốt rồi.",
    "Đêm là lúc mọi thứ dịu lại.",
    "Chậm lại một nhịp, bạn xứng đáng được nghỉ.",
  ],
  landscape: [
    "Hít một hơi thật sâu.",
    "Mọi thứ đều rộng hơn khi nhìn ra xa.",
    "Thiên nhiên không vội, và bạn cũng không cần.",
    "Đứng yên một chút cũng không sao.",
    "Bình yên đôi khi chỉ là một khung cảnh.",
  ],
  river: [
    "Dòng sông vẫn chảy, dù ngày dài đến đâu.",
    "Hãy để mọi thứ trôi đi.",
    "Không cần giữ lại điều gì.",
    "Nước không vội, nhưng luôn đi tới.",
    "Chậm lại một nhịp, như dòng sông.",
  ],
};

const TYPE_META = {
  city: { label: 'Thành phố đêm', icon: '🌃' },
  landscape: { label: 'Phong cảnh', icon: '🌿' },
  river: { label: 'Dòng sông', icon: '🌊' },
} as const;

const MICRO_ACTIONS = {
  city: ["Đi bộ 3 phút để đổi gió", "Nhìn lên bầu trời 10 giây", "Thả lỏng vai và thở chậm"],
  landscape: ["Hít sâu 3 hơi", "Nhìn xa để mắt nghỉ", "Uống một ngụm nước"],
  river: ["Thở chậm như dòng nước", "Buông một suy nghĩ", "Thả lỏng hàm và vai"],
} as const;

export default function HomeScreen() {
  const router = useRouter();
  const FLOW_STATE_LOGO = require('../../assets/images/FlowState.png');
  const [tipIndex, setTipIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const listRef = useRef<FlatList>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const screenW = Dimensions.get('window').width;
  const cardW = useMemo(() => screenW - 32, [screenW]);

  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      const next = (slideIndex + 1) % SLIDES.length;

      listRef.current?.scrollToIndex({
        index: next,
        animated: true,
      });

      setSlideIndex(next);
    }, 5000);

    return () => clearInterval(timer);
  }, [slideIndex, isInteracting]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / cardW);
    setSlideIndex(index);
    setIsInteracting(false);
  };

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LIGHT_BACKGROUND_COLOR }} edges={['top', 'left', 'right']}>
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

          {/* KHOẢNH KHẮC THIÊN NHIÊN (vuốt qua lại + auto 5s) */}
          <Text
            fontSize={16}
            fontWeight="700"
            color="#1F1F1F"
            style={{ marginBottom: 10 }}
          >
            🌙 Khoảnh khắc thiên nhiên
          </Text>

          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: cardW,
              offset: cardW * index,
              index,
            })}
            onScrollBeginDrag={() => setIsInteracting(true)}
            onMomentumScrollEnd={onMomentumEnd}
            renderItem={({ item, index }) => {
              const quoteList = QUOTES[item.type];
              const quote = quoteList[index % quoteList.length];

              return (
                <View style={{ width: cardW }}>
                  <ImageBackground
                    source={item.image}
                    style={styles.slideImage}
                    imageStyle={{ borderRadius: 16 }}
                    resizeMode="cover"
                  >
                    <View style={styles.slideOverlay} />
                    <Text style={styles.slideQuote}>{quote}</Text>
                    <Text style={styles.slideSub}>
                      Vuốt để xem ảnh trước/sau
                    </Text>
                  </ImageBackground>
                  {/* Info row dưới ảnh */}
                  <View style={styles.slideInfoRow}>
                    <Text style={styles.slideType}>
                      {TYPE_META[SLIDES[slideIndex].type].icon} {TYPE_META[SLIDES[slideIndex].type].label}
                    </Text>
                  </View>

                  <Text style={styles.microAction}>
                    ✨ {MICRO_ACTIONS[SLIDES[slideIndex].type][slideIndex % MICRO_ACTIONS[SLIDES[slideIndex].type].length]}
                  </Text>

                </View>
              );
            }}
          />

          {/* Dots indicator */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === slideIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

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
  slideImage: {
    height: 200,
    justifyContent: 'flex-end',
    padding: 14,
    marginBottom: 10,
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 16,
  },
  slideQuote: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  slideSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  slideInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  slideType: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
    marginTop: -6,
  },
  dot: { width: 6, height: 6, borderRadius: 999 },
  dotActive: { backgroundColor: '#9B59FF' },
  dotInactive: { backgroundColor: '#D7DCEC' },
  microAction: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 18,
  },
});
