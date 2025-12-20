import React, { useState, useRef, useCallback } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from 'tamagui';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { AIApi } from '../../../api/services';
import { notifyError } from '../../../utils/notify';

const PRIMARY = '#9B59FF';

type Msg = { id: string; role: 'user' | 'ai'; text: string };

export default function AIChatScreen() {
  const navigation = useNavigation();

  // Ẩn tab bar khi vào màn AI chat, hiện lại khi rời màn
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();

      // Ẩn bottom tab
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      // Khi rời màn AI chat → hiện lại tab bar
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation]),
  );

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Xin chào 👋 Mình là trợ lý giấc ngủ AI FlowState. Hôm nay bạn muốn nghe chuyện, thiền hay cần lời khuyên để ngủ ngon hơn?',
    },
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMsg = async () => {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: content };
    setMsgs((m) => [...m, userMsg]);
    setText('');
    setLoading(true);

    try {
      // Chuẩn bị lịch sử tin nhắn cho BE
      // BE expects: { role: 'user' | 'assistant', content: string }
      const history = msgs.concat(userMsg).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await AIApi.chat(history);

      if (res.success && res.reply) {
        const reply: Msg = {
          id: Date.now().toString(),
          role: 'ai',
          text: res.reply,
        };
        setMsgs((m) => [...m, reply]);
      } else {
        throw new Error('Không nhận được phản hồi từ AI');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      notifyError('Lỗi', error.message || 'Không thể kết nối với AI. Vui lòng thử lại sau.');

      // Thêm thông báo lỗi vào chat để người dùng biết
      setMsgs((m) => [...m, {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Xin lỗi, mình đang gặp chút trục trặc kỹ thuật. Bạn thử lại sau nhé! 😅'
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item, index }: { item: Msg; index: number }) => {
    return (
      <View
        key={`${item.id}-${index}`}
        style={{
          alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
          marginBottom: 12,
          maxWidth: '80%',
        }}
      >
        <View
          style={{
            backgroundColor: item.role === 'user' ? PRIMARY : '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 16,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}
        >
          <Text fontSize={15} color={item.role === 'user' ? '#FFFFFF' : '#1F1F1F'} lineHeight={20}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FB' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* danh sách tin nhắn */}
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {msgs.map((item, index) => renderMessage({ item, index }))}
            {loading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            )}
          </ScrollView>
        </View>

        {/* THANH INPUT – luôn nằm cuối, không absolute */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập điều bạn muốn tâm sự..."
            value={text}
            onChangeText={setText}
            multiline
            editable={!loading}
          />

          <Button
            height={48}
            width={48}
            borderRadius={14}
            backgroundColor={loading ? '#ccc' : PRIMARY}
            pressStyle={{ backgroundColor: '#7F00FF' }}
            onPress={sendMsg}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E8ECF3',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    fontSize: 15,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
  }
});
