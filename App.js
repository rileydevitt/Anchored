import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, AppState, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AuthScreen from './src/screens/AuthScreen';
import AddressSetupScreen from './src/screens/AddressSetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomTabBar from './src/components/BottomTabBar';
import { colors } from './src/constants/theme';
import { loadHalifaxDashboardData } from './src/services/halifaxOpenData';
import {
  cancelPickupReminders,
  ensurePickupReminderPermissions,
  formatReminderHourLabel,
  getPickupReminderPermissionGranted,
  initializePickupReminders,
  normalizeReminderHour,
  syncPickupReminders,
} from './src/services/pickupReminders';
import { auth, db } from './firebase';
import AnchoredIcon from './AnchoredIcon.png';

const DEFAULT_PROFILE = {
  name: 'Halifax Resident',
  email: '',
  address: '',
  notificationsEnabled: false,
  reminderHour: 20,
  issueRadiusKm: 5,
};

function normalizeIssueRadiusKm(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_PROFILE.issueRadiusKm;
  }

  return Math.min(10, Math.max(1, Math.round(numericValue)));
}

const EMPTY_LIVE_DATA = {
  resolvedAddress: null,
  nextCollection: null,
  upcomingServices: [],
  nearbyAlerts: [],
};

export default function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authUser, setAuthUser] = useState(null);
  const [authNotice, setAuthNotice] = useState('');
  const [hydratingSession, setHydratingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [liveData, setLiveData] = useState(EMPTY_LIVE_DATA);
  const [loadingLiveData, setLoadingLiveData] = useState(false);
  const [liveDataError, setLiveDataError] = useState('');

  const reconcileReminderPermission = async (nextProfile, options = {}) => {
    const { persistIfDisabled = false } = options;

    if (!nextProfile.notificationsEnabled) {
      return nextProfile;
    }

    const permissionGranted = await getPickupReminderPermissionGranted();

    if (permissionGranted) {
      return nextProfile;
    }

    if (persistIfDisabled && auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          notificationsEnabled: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return {
      ...nextProfile,
      notificationsEnabled: false,
    };
  };

  const isAuthenticated = Boolean(authUser);
  const needsAddressSetup = isAuthenticated && !hydratingSession && !profile.address;

  useEffect(() => {
    initializePickupReminders().catch((error) => {
      console.error('Failed to initialize pickup reminders', error);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null);
        setProfile(DEFAULT_PROFILE);
        setHydratingSession(false);
        return;
      }

      setHydratingSession(true);

      try {
        await reload(user);

        const currentUser = auth.currentUser;

        if (!currentUser?.emailVerified) {
          setAuthNotice('Verify your email before signing in. Check your inbox for the verification link.');
          await signOut(auth);
          return;
        }

        setAuthNotice('');
        setAuthUser(currentUser);

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const nextProfile = await reconcileReminderPermission({
            name: data.name || currentUser.displayName || DEFAULT_PROFILE.name,
            email: data.email || currentUser.email || '',
            address: data.address || '',
            notificationsEnabled:
              typeof data.notificationsEnabled === 'boolean'
                ? data.notificationsEnabled
                : DEFAULT_PROFILE.notificationsEnabled,
            reminderHour: normalizeReminderHour(data.reminderHour),
            issueRadiusKm: normalizeIssueRadiusKm(data.issueRadiusKm),
          }, { persistIfDisabled: true });

          setProfile(nextProfile);
        } else {
          const seededProfile = await reconcileReminderPermission({
            name: currentUser.displayName || DEFAULT_PROFILE.name,
            email: currentUser.email || '',
            address: '',
            notificationsEnabled: DEFAULT_PROFILE.notificationsEnabled,
            reminderHour: DEFAULT_PROFILE.reminderHour,
            issueRadiusKm: DEFAULT_PROFILE.issueRadiusKm,
          });

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
        console.error('Failed to load user profile', error);
        setProfile({
          name: user.displayName || DEFAULT_PROFILE.name,
          email: user.email || '',
          address: '',
          notificationsEnabled: DEFAULT_PROFILE.notificationsEnabled,
          reminderHour: DEFAULT_PROFILE.reminderHour,
          issueRadiusKm: DEFAULT_PROFILE.issueRadiusKm,
        });
      } finally {
        setHydratingSession(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let isActive = true;

    const refreshReminderPermission = async () => {
      if (!profile.notificationsEnabled) {
        return;
      }

      try {
        const permissionGranted = await getPickupReminderPermissionGranted();

        if (!isActive || permissionGranted) {
          return;
        }

        setProfile((prev) => {
          if (!prev.notificationsEnabled) {
            return prev;
          }

          return {
            ...prev,
            notificationsEnabled: false,
          };
        });

        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(
            userRef,
            {
              notificationsEnabled: false,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error('Failed to refresh pickup reminder permission state', error);
      }
    };

    refreshReminderPermission();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshReminderPermission();
      }
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [isAuthenticated, profile.notificationsEnabled]);

  useEffect(() => {
    let isActive = true;

    if (!isAuthenticated || hydratingSession || !profile.address) {
      setLiveData(EMPTY_LIVE_DATA);
      setLoadingLiveData(false);
      setLiveDataError('');
      return undefined;
    }

    const hydrateOpenData = async () => {
      setLoadingLiveData(true);
      setLiveDataError('');

      try {
        const nextLiveData = await loadHalifaxDashboardData(profile.address, {
          issueRadiusKm: profile.issueRadiusKm,
        });

        if (!isActive) {
          return;
        }

        setLiveData(nextLiveData);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLiveData(EMPTY_LIVE_DATA);
        setLiveDataError(error.message || 'Unable to load Halifax Open Data.');
      } finally {
        if (isActive) {
          setLoadingLiveData(false);
        }
      }
    };

    hydrateOpenData();

    return () => {
      isActive = false;
    };
  }, [hydratingSession, isAuthenticated, profile.address, profile.issueRadiusKm]);

  useEffect(() => {
    const syncReminders = async () => {
      try {
        if (!isAuthenticated || hydratingSession || !profile.notificationsEnabled || !profile.address) {
          await cancelPickupReminders();
          return;
        }

        if (!liveData.upcomingServices.length) {
          await cancelPickupReminders();
          return;
        }

        await syncPickupReminders({
          address: liveData.resolvedAddress?.canonicalAddress || profile.address,
          services: liveData.upcomingServices,
          reminderHour: profile.reminderHour,
        });
      } catch (error) {
        console.error('Failed to sync pickup reminders', error);
      }
    };

    syncReminders();
  }, [
    hydratingSession,
    isAuthenticated,
    liveData.resolvedAddress?.canonicalAddress,
    liveData.upcomingServices,
    profile.address,
    profile.notificationsEnabled,
    profile.reminderHour,
  ]);

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
      case 'auth/email-not-verified':
        return 'Verify your email before signing in.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again later.';
      case 'permission-denied':
        return 'Your email must be verified before this account can be used.';
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
      setAuthNotice('');
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'register') {
        const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        if (fullName) {
          await updateProfile(credentials.user, { displayName: fullName });
        }

        await sendEmailVerification(credentials.user);
        await signOut(auth);
        setAuthMode('login');
        setAuthNotice('Verification email sent. Open the link in your inbox, then sign in.');
        return;
      }

      const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await reload(credentials.user);

      if (!credentials.user.emailVerified) {
        await signOut(auth);
        throw { code: 'auth/email-not-verified' };
      }
    } catch (error) {
      if (error?.code === 'auth/email-not-verified') {
        setAuthNotice('Verify your email before signing in. If needed, register again to get a new link.');
      }

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
      return (
        <AuthScreen
          mode={authMode}
          setMode={setAuthMode}
          onSubmit={handleAuthSubmit}
          notice={authNotice}
        />
      );
    }

    if (needsAddressSetup) {
      return (
        <AddressSetupScreen
          initialAddress={profile.address}
          initialNotificationsEnabled={profile.notificationsEnabled}
          initialReminderHour={profile.reminderHour}
          onComplete={async ({ address, notificationsEnabled, reminderHour }) => {
            let nextNotificationsEnabled = notificationsEnabled;
            const nextReminderHour = normalizeReminderHour(reminderHour);

            if (notificationsEnabled) {
              try {
                await ensurePickupReminderPermissions();
              } catch (error) {
                nextNotificationsEnabled = false;
                Alert.alert(
                  'Reminders left off',
                  `Notification permission was denied, so pickup reminders were not enabled. Your reminder time is still saved as ${formatReminderHourLabel(nextReminderHour)}.`
                );
              }
            }

            await saveProfilePatch({
              address,
              notificationsEnabled: nextNotificationsEnabled,
              reminderHour: nextReminderHour,
            });
            setActiveTab('home');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'map':
        return (
          <MapScreen
            resolvedAddress={liveData.resolvedAddress}
            nearbyAlerts={liveData.nearbyAlerts}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            remindersEnabled={profile.notificationsEnabled}
            reminderHour={profile.reminderHour}
            issueRadiusKm={profile.issueRadiusKm}
            onSaveAddress={async (address) => {
              const nextAddress = address || profile.address;
              await saveProfilePatch({ address: nextAddress });
            }}
            onToggleReminders={async (value) => {
              try {
                if (value) {
                  await ensurePickupReminderPermissions();
                }

                await saveProfilePatch({ notificationsEnabled: value });
              } catch (error) {
                throw error;
              }
            }}
            onChangeReminderHour={async (value) => {
              await saveProfilePatch({ reminderHour: normalizeReminderHour(value) });
            }}
            onChangeIssueRadius={async (value) => {
              try {
                await saveProfilePatch({ issueRadiusKm: normalizeIssueRadiusKm(value) });
              } catch (error) {
                console.error('Failed to update nearby issue range', error);
              }
            }}
            onLogout={async () => {
              await signOut(auth);
              setActiveTab('home');
            }}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            address={liveData.resolvedAddress?.canonicalAddress || profile.address}
            nextCollection={liveData.nextCollection}
            upcomingServices={liveData.upcomingServices}
            nearbyAlerts={liveData.nearbyAlerts}
            loading={loadingLiveData}
            error={liveDataError}
            onViewMap={() => setActiveTab('map')}
          />
        );
    }
  }, [
    activeTab,
    authMode,
    hydratingSession,
    isAuthenticated,
    liveData,
    liveDataError,
    loadingLiveData,
    needsAddressSetup,
    profile,
  ]);

  const showMainShell = isAuthenticated && !needsAddressSetup && !hydratingSession;

  return (
    <SafeAreaProvider>
      <View style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        <SafeAreaView edges={['top']} style={styles.mainShell}>
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
        </SafeAreaView>

        {showMainShell ? <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} /> : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainShell: {
    flex: 1,
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
