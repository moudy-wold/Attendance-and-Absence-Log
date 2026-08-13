import { StatsScreenContent } from '../components/Screens/Stats/StatsScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function StatsRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <StatsScreenContent />
    </SafeAreaView>
  );
}
