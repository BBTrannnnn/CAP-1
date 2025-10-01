import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'tamagui';

export default function ProfileScreen() {
  return (
    <SafeAreaView>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Đây là trang cá nhân</Text>
    </SafeAreaView>
  );
}
