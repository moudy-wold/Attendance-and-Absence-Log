import { AdminEntryAccountDetailScreenContent } from '../../components/Screens/Admin/AdminEntryAccountDetailScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminEntryAccountDetailRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <AdminEntryAccountDetailScreenContent />
    </SafeAreaView>
  );
}
