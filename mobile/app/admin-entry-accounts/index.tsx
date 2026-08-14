import { AdminEntryAccountsScreenContent } from '../../components/Screens/Admin/AdminEntryAccountsScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminEntryAccountsRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <AdminEntryAccountsScreenContent />
    </SafeAreaView>
  );
}
