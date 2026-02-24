import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import { upcomingServices } from '../data/mockData';

export default function ServicesScreen({ remindersEnabled, onToggleReminders }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Service Schedule</Text>
      <Text style={styles.subtitle}>Upcoming municipal collection reminders based on your zone.</Text>

      <View style={styles.toggleCard}>
        <View style={styles.toggleLabelWrap}>
          <MaterialIcons name="notifications-active" size={20} color={colors.halifaxBlue} />
          <View>
            <Text style={styles.toggleTitle}>Reminders</Text>
            <Text style={styles.toggleSub}>Night before collection at 8:00 PM</Text>
          </View>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={onToggleReminders}
          trackColor={{ false: '#D1D5DB', true: '#9CC2E6' }}
          thumbColor={remindersEnabled ? colors.halifaxBlue : '#fff'}
        />
      </View>

      <View style={styles.list}>
        {upcomingServices.map((service) => (
          <View key={service.id} style={styles.item}>
            <Text style={styles.itemDay}>{service.day}</Text>
            <Text style={styles.itemText}>{service.items}</Text>
          </View>
        ))}
      </View>
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
    lineHeight: 21,
  },
  toggleCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  toggleTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  toggleSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: 4,
  },
  itemDay: {
    color: colors.halifaxBlue,
    fontWeight: '700',
    fontSize: 13,
  },
  itemText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
});
