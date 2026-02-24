import React, { useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AuthScreen from './src/screens/AuthScreen';
import AddressSetupScreen from './src/screens/AddressSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { colors } from './src/constants/theme';

export default function App() {
  const [authMode, setAuthMode] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState({
    name: 'Halifax Resident',
    email: '',
    address: '',
    notificationsEnabled: true,
  });

  const needsAddressSetup = isAuthenticated && !profile.address;

  const currentScreen = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <AuthScreen
          mode={authMode}
          setMode={setAuthMode}
          onSubmit={({ name, email }) => {
            setProfile((prev) => ({ ...prev, name, email }));
            setIsAuthenticated(true);
          }}
        />
      );
    }

    if (needsAddressSetup) {
      return (
        <AddressSetupScreen
          onComplete={({ address, notificationsEnabled }) => {
            setProfile((prev) => ({ ...prev, address, notificationsEnabled }));
            setActiveTab('home');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'map':
        return <MapScreen />;
      case 'services':
        return (
          <ServicesScreen
            remindersEnabled={profile.notificationsEnabled}
            onToggleReminders={(value) =>
              setProfile((prev) => ({ ...prev, notificationsEnabled: value }))
            }
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            onSaveAddress={(address) =>
              setProfile((prev) => ({ ...prev, address: address || prev.address }))
            }
            onLogout={() => {
              setIsAuthenticated(false);
              setActiveTab('home');
              setProfile({
                name: 'Halifax Resident',
                email: '',
                address: '',
                notificationsEnabled: true,
              });
            }}
          />
        );
      case 'home':
      default:
        return <HomeScreen address={profile.address} onViewMap={() => setActiveTab('map')} />;
    }
  }, [activeTab, authMode, isAuthenticated, needsAddressSetup, profile]);

  const showMainShell = isAuthenticated && !needsAddressSetup;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {showMainShell ? (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="anchor" size={24} color={colors.halifaxBlue} />
            <Text style={styles.headerTitle}>Anchored</Text>
          </View>
          <MaterialIcons name="notifications" size={24} color={colors.text} />
        </View>
      ) : null}

      <View style={styles.content}>{currentScreen}</View>

      {showMainShell ? <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
});
