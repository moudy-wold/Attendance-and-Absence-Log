import { AdminEmployeeDetailScreenContent } from '../../components/Screens/Admin/AdminEmployeeDetailScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminEmployeeDetailRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <AdminEmployeeDetailScreenContent />
    </SafeAreaView>
  );
}
