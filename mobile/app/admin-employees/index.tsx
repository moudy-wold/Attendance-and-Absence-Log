import { AdminEmployeesScreenContent } from '../../components/Screens/Admin/AdminEmployeesScreenContent'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminEmployeesRoute() {
  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      <AdminEmployeesScreenContent />
    </SafeAreaView>
  );
}
