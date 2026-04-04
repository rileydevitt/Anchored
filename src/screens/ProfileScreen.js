import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AddressAutocompleteInput from '../components/AddressAutocompleteInput';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../constants/theme';
import {
  formatReminderHourLabel,
  REMINDER_HOUR_OPTIONS,
} from '../services/pickupReminders';

// Profile screen for saved address, reminder settings, and the nearby-issues radius.
export default function ProfileScreen({
  profile,
  remindersEnabled,
  reminderHour,
  issueRadiusKm,
  onSaveAddress,
  onToggleReminders,
  onChangeReminderHour,
  onChangeIssueRadius,
  onLogout,
}) {
  const [addressDraft, setAddressDraft] = useState(profile.address || '');
  const [addressConfirmed, setAddressConfirmed] = useState(Boolean(profile.address));
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const formattedRadiusLabel = issueRadiusKm < 1
    ? `${Math.round(issueRadiusKm * 1000)} m`
    : `${issueRadiusKm.toFixed(1)} km`;

  useEffect(() => {
    setAddressDraft(profile.address || '');
    setAddressConfirmed(Boolean(profile.address));
    setAddressSaved(false);
  }, [profile.address]);

  // Save the address separately so the user can update it without touching other settings.
  const handleSaveAddress = async () => {
    if (!addressDraft.trim()) {
      return;
    }

    setSavingAddress(true);
    setError('');
    try {
      await onSaveAddress(addressDraft.trim());
      setAddressSaved(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Reminder permission can fail, so the screen shows that error instead of silently failing.
  const handleToggleReminders = async (value) => {
    setError('');

    try {
      await onToggleReminders(value);
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update pickup reminders.');
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
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Profile & Settings</Text>
      <Text style={styles.subtitle}>{profile.email}</Text>

      <View style={styles.card}>
        <AddressAutocompleteInput
          label="Primary address"
          placeholder="123 Spring Garden Rd"
          value={addressDraft}
          onSelect={(description) => {
            setAddressDraft(description);
            setAddressConfirmed(true);
          }}
          onClear={() => { setAddressConfirmed(false); setAddressSaved(false); }}
        />
        <PrimaryButton
          title={addressSaved ? 'Address Saved' : 'Save Address'}
          onPress={handleSaveAddress}
          disabled={!addressConfirmed}
          loading={savingAddress}
          secondary={!addressSaved}
        />
      </View>

      <View style={styles.card}>
        <SettingRow
          title="Collection reminders"
          subtitle={`Night before collection at ${formatReminderHourLabel(reminderHour)}`}
          icon="notifications-active"
          value={remindersEnabled}
          onChange={handleToggleReminders}
        />
        <View style={[styles.reminderTimeWrap, !remindersEnabled && styles.reminderTimeWrapDisabled]}>
          <Text style={styles.settingTitle}>Reminder time</Text>
          <Text style={styles.settingSubtitle}>Choose when Anchored reminds you on the evening before pickup.</Text>
          <View style={styles.optionRow}>
            {REMINDER_HOUR_OPTIONS.map((option) => {
              const selected = option === reminderHour;

              return (
                <Pressable
                  key={option}
                  onPress={() => onChangeReminderHour(option)}
                  disabled={!remindersEnabled}
                  style={[
                    styles.optionPill,
                    selected && styles.optionPillSelected,
                    !remindersEnabled && styles.optionPillDisabled,
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
        <SettingRow title="Location" value={locationEnabled} onChange={setLocationEnabled} />
        <SettingRow title="Camera" value={cameraEnabled} onChange={setCameraEnabled} />
      </View>

      <View style={styles.card}>
        <Text style={styles.settingTitle}>Nearby civic issues range</Text>
        <Text style={styles.settingSubtitle}>
          Showing issues within <Text style={styles.rangeValueText}>{formattedRadiusLabel}</Text> of your saved address.
        </Text>
        <View style={styles.sliderWrap}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>100 m</Text>
            <Text style={styles.sliderLabel}>1 km</Text>
          </View>
          <Slider
            minimumValue={0.1}
            maximumValue={1}
            step={0.1}
            value={issueRadiusKm}
            minimumTrackTintColor={colors.halifaxBlue}
            maximumTrackTintColor="#D1D5DB"
            thumbTintColor={colors.halifaxBlue}
            onSlidingComplete={onChangeIssueRadius}
          />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <PrimaryButton title="Log Out" onPress={handleLogout} loading={loggingOut} />
    </ScrollView>
  );
}

// Small reusable row for toggle-based settings.
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
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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
  reminderTimeWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  reminderTimeWrapDisabled: {
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
  sliderWrap: {
    marginTop: spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sliderLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  rangeValueText: {
    color: colors.halifaxBlue,
    fontWeight: '700',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
});
