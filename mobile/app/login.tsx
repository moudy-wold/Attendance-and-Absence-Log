import { LoginScreenContent } from '../components/Screens/Login/LoginScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <LoginScreenContent />
    </SafeAreaView>
  );
}
