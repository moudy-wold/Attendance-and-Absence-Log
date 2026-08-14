import { AdminSettingsScreenContent } from '../components/Screens/Admin/AdminSettingsScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminSettingsRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <AdminSettingsScreenContent />
    </SafeAreaView>
  );
}
