import { tw } from '@/lib/tw';
import { HistoryScreenContent } from '../components/Screens/History/HistoryScreenContent'
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <HistoryScreenContent />
    </SafeAreaView>
  );
}
