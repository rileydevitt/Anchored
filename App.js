import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AuthScreen from './src/screens/AuthScreen';
import AddressSetupScreen from './src/screens/AddressSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { colors } from './src/constants/theme';
import { auth, db } from './firebase';

const DEFAULT_PROFILE = {
  name: 'Halifax Resident',
  email: '',
  address: '',
  notificationsEnabled: true,
};

export default function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authUser, setAuthUser] = useState(null);
  const [hydratingSession, setHydratingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const isAuthenticated = Boolean(authUser);
  const needsAddressSetup = isAuthenticated && !hydratingSession && !profile.address;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (!user) {
        setProfile(DEFAULT_PROFILE);
        setHydratingSession(false);
        return;
      }

      setHydratingSession(true);

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            name: data.name || user.displayName || DEFAULT_PROFILE.name,
            email: data.email || user.email || '',
            address: data.address || '',
            notificationsEnabled:
              typeof data.notificationsEnabled === 'boolean'
                ? data.notificationsEnabled
                : DEFAULT_PROFILE.notificationsEnabled,
          });
        } else {
          const seededProfile = {
            name: user.displayName || DEFAULT_PROFILE.name,
            email: user.email || '',
            address: '',
            notificationsEnabled: true,
          };

          setProfile(seededProfile);
          await setDoc(
            userRef,
            {
              ...seededProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error('Failed to hydrate user profile', error);
        setProfile({
          name: user.displayName || DEFAULT_PROFILE.name,
          email: user.email || '',
          address: '',
          notificationsEnabled: true,
        });
      } finally {
        setHydratingSession(false);
      }
    });

    return unsubscribe;
  }, []);

  const authErrorToMessage = (error) => {
    switch (error?.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/network-request-failed':
        return 'Network error. Please try again.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  const saveProfilePatch = async (patch) => {
    if (!auth.currentUser) {
      throw new Error('No active session found.');
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(
      userRef,
      {
        ...patch,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const handleAuthSubmit = async ({ mode, fullName, email, password }) => {
    try {
      if (mode === 'register') {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(credentials.user, { displayName: fullName });
        }

        await setDoc(
          doc(db, 'users', credentials.user.uid),
          {
            name: fullName || DEFAULT_PROFILE.name,
            email,
            address: '',
            notificationsEnabled: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(authErrorToMessage(error));
    }
  };

  const currentScreen = useMemo(() => {
    if (hydratingSession) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.halifaxBlue} size="large" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={handleAuthSubmit} />;
    }

    if (needsAddressSetup) {
      return (
        <AddressSetupScreen
          initialAddress={profile.address}
          initialNotificationsEnabled={profile.notificationsEnabled}
          onComplete={async ({ address, notificationsEnabled }) => {
            await saveProfilePatch({ address, notificationsEnabled });
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
            onToggleReminders={async (value) => {
              try {
                await saveProfilePatch({ notificationsEnabled: value });
              } catch (error) {
                console.error('Failed to update reminder preference', error);
              }
            }}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            onSaveAddress={async (address) => {
              const nextAddress = address || profile.address;
              await saveProfilePatch({ address: nextAddress });
            }}
            onLogout={async () => {
              await signOut(auth);
              setActiveTab('home');
            }}
          />
        );
      case 'home':
      default:
        return <HomeScreen address={profile.address} onViewMap={() => setActiveTab('map')} />;
    }
  }, [activeTab, authMode, hydratingSession, isAuthenticated, needsAddressSetup, profile]);

  const showMainShell = isAuthenticated && !needsAddressSetup && !hydratingSession;

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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
});
