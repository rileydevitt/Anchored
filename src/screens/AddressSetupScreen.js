import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, radius } from '../constants/theme';

export default function AddressSetupScreen({
  onComplete,
  initialAddress = '',
  initialNotificationsEnabled = true,
}) {
  const [address, setAddress] = useState(initialAddress);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    if (!address.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onComplete({ address: address.trim(), notificationsEnabled });
    } catch (saveError) {
      setError(saveError.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>Step 2 of 2</Text>
      <Text style={styles.title}>Set your primary address</Text>
      <Text style={styles.subtitle}>
        Anchored uses your address to personalize waste schedules and nearby civic alerts.
      </Text>

      <View style={styles.card}>
        <InputField
          label="Address"
          placeholder="123 Spring Garden Rd, Halifax"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.prefRow}>
          <View style={styles.prefTextWrap}>
            <MaterialIcons name="notifications" size={20} color={colors.halifaxBlue} />
            <View>
              <Text style={styles.prefTitle}>Enable reminders</Text>
              <Text style={styles.prefSubtitle}>Get notified before collection day.</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D1D5DB', true: '#9CC2E6' }}
            thumbColor={notificationsEnabled ? colors.halifaxBlue : '#fff'}
          />
        </View>
      </View>

      <PrimaryButton
        title="Continue to Dashboard"
        disabled={!address.trim()}
        onPress={handleComplete}
        loading={saving}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    gap: spacing.md,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.halifaxBlue,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  prefRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  prefTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  prefSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
});
