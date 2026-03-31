import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AddressAutocompleteInput from '../components/AddressAutocompleteInput';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, radius } from '../constants/theme';
import {
  formatReminderHourLabel,
  normalizeReminderHour,
  REMINDER_HOUR_OPTIONS,
} from '../services/pickupReminders';

export default function AddressSetupScreen({
  onComplete,
  initialAddress = '',
  initialNotificationsEnabled = false,
  initialReminderHour = 20,
}) {
  const [address, setAddress] = useState(initialAddress);
  const [addressConfirmed, setAddressConfirmed] = useState(Boolean(initialAddress));
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [reminderHour, setReminderHour] = useState(normalizeReminderHour(initialReminderHour));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    if (!address.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onComplete({
        address: address.trim(),
        notificationsEnabled,
        reminderHour,
      });
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
        <AddressAutocompleteInput
          label="Address"
          placeholder="123 Spring Garden Rd, Halifax"
          value={address}
          onSelect={(description) => {
            setAddress(description);
            setAddressConfirmed(true);
          }}
          onClear={() => setAddressConfirmed(false)}
        />

        <View style={styles.prefRow}>
          <View style={styles.prefTextWrap}>
            <MaterialIcons name="notifications" size={20} color={colors.halifaxBlue} />
            <View>
              <Text style={styles.prefTitle}>Enable reminders</Text>
              <Text style={styles.prefSubtitle}>
                Get notified at {formatReminderHourLabel(reminderHour)} the night before collection.
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D1D5DB', true: '#9CC2E6' }}
            thumbColor={notificationsEnabled ? colors.halifaxBlue : '#fff'}
          />
        </View>

        <View style={[styles.reminderCard, !notificationsEnabled && styles.reminderCardDisabled]}>
          <Text style={styles.prefTitle}>Reminder time</Text>
          <Text style={styles.prefSubtitle}>Choose when Anchored reminds you the evening before pickup.</Text>
          <View style={styles.optionRow}>
            {REMINDER_HOUR_OPTIONS.map((option) => {
              const selected = option === reminderHour;

              return (
                <Pressable
                  key={option}
                  onPress={() => setReminderHour(option)}
                  disabled={!notificationsEnabled}
                  style={[
                    styles.optionPill,
                    selected && styles.optionPillSelected,
                    !notificationsEnabled && styles.optionPillDisabled,
                  ]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {formatReminderHourLabel(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <PrimaryButton
        title="Continue to Dashboard"
        disabled={!addressConfirmed}
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
  reminderCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  reminderCardDisabled: {
    opacity: 0.55,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionPill: {
    minWidth: 78,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  optionPillSelected: {
    borderColor: colors.halifaxBlue,
    backgroundColor: '#E8F1FA',
  },
  optionPillDisabled: {
    backgroundColor: colors.surface,
  },
  optionText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  optionTextSelected: {
    color: colors.halifaxBlue,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
});
