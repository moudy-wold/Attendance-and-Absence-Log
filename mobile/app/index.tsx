import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { HomeScreenContent } from '../components/Screens/Home/HomeScreenContent'
import { AdminHomeScreenContent } from '../components/Screens/Admin/AdminHomeScreenContent'
import { Button } from '../components/Global/Button'
import { useAuth } from '../context/authContextValue'
import { tw } from '@/lib/tw';
import { SafeAreaView } from "react-native-safe-area-context";

function UnsupportedRoleContent() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  return (
    <View style={tw`flex-1 items-center justify-center gap-4 bg-neutral-50 p-6 dark:bg-neutral-950`}>
      <Text style={tw`text-sm text-neutral-500`}>{t('Something went wrong, please try again')}</Text>
      <Button onPress={logout}>{t('Sign out')}</Button>
    </View>
  );
}

export default function IndexRoute() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={tw`flex-1`} edges={["top", "bottom"]}>
      {user?.isEmployee ? (
        <HomeScreenContent />
      ) : user?.isAdmin ? (
        <AdminHomeScreenContent />
      ) : (
        <UnsupportedRoleContent />
      )}
    </SafeAreaView>
  );
}
