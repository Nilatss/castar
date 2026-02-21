import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { colors } from '../../shared/constants';
import type {
  MainTabParamList,
  HomeStackParamList,
  MonitoringStackParamList,
  ProfileStackParamList,
} from '../../shared/types';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Screens
import { HomeScreen } from '../../features/transactions/screens/HomeScreen';
import { AddTransactionScreen } from '../../features/transactions/screens/AddTransactionScreen';
import { TransactionDetailScreen } from '../../features/transactions/screens/TransactionDetailScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { SettingsScreen } from '../../features/profile/screens/SettingsScreen';
import { CategoriesScreen } from '../../features/categories/screens/CategoriesScreen';
import { CreateCategoryScreen } from '../../features/categories/screens/CreateCategoryScreen';

/* ── Constants ── */
const INACTIVE_COLOR = '#828187';
const ACTIVE_COLOR = '#FFFFFF';
const TAB_WIDTH = 102;
const TAB_GAP = 20;
const ICON_TEXT_GAP = 6;

/* ── SVG Icons (Solar Icon Set — Bold) ── */

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 22L2 22"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M3 11.3472V22H21V11.3472C21 10.4903 20.6336 9.67426 19.9931 9.10496L13.9931 3.77163C12.8564 2.76126 11.1436 2.76126 10.0069 3.77163L4.00691 9.10496C3.36644 9.67426 3 10.4903 3 11.3472Z"
      fill={color}
    />
  </Svg>
);

const MonitoringIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447ZM17 12.25C17.4142 12.25 17.75 12.5858 17.75 13V18C17.75 18.4142 17.4142 18.75 17 18.75C16.5858 18.75 16.25 18.4142 16.25 18V13C16.25 12.5858 16.5858 12.25 17 12.25ZM12.75 6C12.75 5.58579 12.4142 5.25 12 5.25C11.5858 5.25 11.25 5.58579 11.25 6V18C11.25 18.4142 11.5858 18.75 12 18.75C12.4142 18.75 12.75 18.4142 12.75 18V6ZM7 8.25C7.41421 8.25 7.75 8.58579 7.75 9V18C7.75 18.4142 7.41421 18.75 7 18.75C6.58579 18.75 6.25 18.4142 6.25 18V9C6.25 8.58579 6.58579 8.25 7 8.25Z"
      fill={color}
    />
  </Svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={6} r={4} fill={color} />
    <Ellipse cx={12} cy={17} rx={7} ry={4} fill={color} />
  </Svg>
);

/* ── Stack Navigators ── */
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MonitoringStack = createNativeStackNavigator<MonitoringStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
};

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={stackScreenOptions}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <HomeStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </HomeStack.Navigator>
);

const MonitoringStackNavigator = () => (
  <MonitoringStack.Navigator screenOptions={stackScreenOptions}>
    <MonitoringStack.Screen name="Analytics" component={AnalyticsScreen} />
  </MonitoringStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackScreenOptions}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="Categories" component={CategoriesScreen} />
    <ProfileStack.Screen name="CreateCategory" component={CreateCategoryScreen} />
  </ProfileStack.Navigator>
);

/* ── Tab Config ── */
const TAB_CONFIG: Record<
  string,
  { icon: React.FC<{ color: string }>; labelKey: string }
> = {
  HomeTab: { icon: HomeIcon, labelKey: 'tabs.home' },
  MonitoringTab: { icon: MonitoringIcon, labelKey: 'tabs.monitoring' },
  ProfileTab: { icon: ProfileIcon, labelKey: 'tabs.profile' },
};

/* ── Custom Tab Bar ── */
const CustomTabBar = ({ state, navigation, descriptors }: BottomTabBarProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Hide tab bar when a screen sets tabBarStyle: { display: 'none' }
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key].options;
  if ((focusedOptions.tabBarStyle as { display?: string } | undefined)?.display === 'none') {
    return null;
  }

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const { icon: IconComponent, labelKey } = config;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={t(labelKey)}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <IconComponent color={color} />
              <Text style={[styles.tabLabel, { color }]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ── Tab Navigator ── */
const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false, animation: 'fade' }}
  >
    <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
    <Tab.Screen name="MonitoringTab" component={MonitoringStackNavigator} />
    <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

/* ── Styles ── */
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: TAB_GAP,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabButton: {
    width: TAB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ICON_TEXT_GAP,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
