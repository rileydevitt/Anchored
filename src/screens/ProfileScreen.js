import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../constants/theme';

export default function ProfileScreen({
  profile,
  remindersEnabled,
  onSaveAddress,
  onToggleReminders,
  onLogout,
}) {
  const [addressDraft, setAddressDraft] = useState(profile.address || '');
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAddressDraft(profile.address || '');
  }, [profile.address]);

  const handleSaveAddress = async () => {
    if (!addressDraft.trim()) {
      return;
    }

    setSavingAddress(true);
    setError('');
    try {
      await onSaveAddress(addressDraft.trim());
    } catch (saveError) {
      setError(saveError.message || 'Unable to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setError('');
    try {
      await onLogout();
    } catch (logoutError) {
      setError(logoutError.message || 'Unable to log out right now.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profile & Settings</Text>
      <Text style={styles.subtitle}>{profile.email}</Text>

      <View style={styles.card}>
        <InputField
          label="Primary address"
          placeholder="123 Spring Garden Rd"
          value={addressDraft}
          onChangeText={setAddressDraft}
        />
        <PrimaryButton
          title="Save Address"
          onPress={handleSaveAddress}
          disabled={!addressDraft.trim()}
          loading={savingAddress}
          secondary
        />
      </View>

      <View style={styles.card}>
        <SettingRow
          title="Collection reminders"
          subtitle="Night before collection at 8:00 PM"
          icon="notifications-active"
          value={remindersEnabled}
          onChange={onToggleReminders}
        />
        <SettingRow title="Location" value={locationEnabled} onChange={setLocationEnabled} />
        <SettingRow title="Camera" value={cameraEnabled} onChange={setCameraEnabled} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <PrimaryButton title="Log Out" onPress={handleLogout} loading={loggingOut} />
    </View>
  );
}

function SettingRow({ title, subtitle, icon, value, onChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        {icon ? <MaterialIcons name={icon} size={18} color={colors.halifaxBlue} /> : null}
        <View style={styles.settingTextWrap}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: '#9CC2E6' }}
        thumbColor={value ? colors.halifaxBlue : '#fff'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
});
