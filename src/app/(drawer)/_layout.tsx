import { Drawer } from 'expo-router/drawer';

import { DrawerContent } from '@/components/DrawerContent';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function DrawerLayout() {
  const { theme } = useAppTheme();

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEdgeWidth: 42,
        overlayColor: theme.overlay,
        drawerStyle: {
          backgroundColor: theme.bg,
          width: 320,
        },
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Chat' }} />
    </Drawer>
  );
}
