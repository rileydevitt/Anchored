import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import { nearbyAlerts, nextCollection } from '../data/mockData';

const iconForType = {
  construction: 'construction',
  traffic: 'traffic',
  info: 'info',
};

export default function HomeScreen({ address, onViewMap }) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingLabel}>Good morning</Text>
          <Text style={styles.location}>{address || 'Halifax, NS'}</Text>
        </View>
        <View style={styles.weatherPill}>
          <MaterialIcons name="light-mode" size={16} color={colors.halifaxBlue} />
          <Text style={styles.weatherText}>18°C</Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Next Collection</Text>
        <Text style={styles.zonePill}>{nextCollection.zone.toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.collectionDate}>{nextCollection.dateLabel}</Text>
        <View style={styles.collectionItems}>
          {nextCollection.items.map((item) => (
            <View style={styles.collectionChip} key={item}>
              <MaterialIcons
                name={item === 'Organics' ? 'eco' : 'delete'}
                size={18}
                color={colors.muted}
              />
              <Text style={styles.collectionText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.area}>{nextCollection.area}</Text>
          <Pressable>
            <Text style={styles.scheduleLink}>Schedule</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Nearby Alerts</Text>
        <Pressable onPress={onViewMap}>
          <Text style={styles.mapLink}>View Map</Text>
        </Pressable>
      </View>

      <View style={styles.alertList}>
        {nearbyAlerts.map((item, idx) => (
          <View key={item.id} style={[styles.alertRow, idx < nearbyAlerts.length - 1 && styles.divider]}>
            <View style={styles.iconWrap}>
              <MaterialIcons
                name={iconForType[item.type] || 'info'}
                size={20}
                color={colors.halifaxBlue}
              />
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertDescription}>{item.description}</Text>
              <Text style={styles.alertMeta}>{item.meta}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable style={styles.reportButton}>
        <View style={styles.reportLeft}>
          <MaterialIcons name="add-circle" size={20} color="#fff" />
          <Text style={styles.reportText}>Report a Civic Issue</Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color="#fff" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greetingLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
  },
  location: {
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    maxWidth: 250,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weatherText: {
    fontWeight: '700',
    color: colors.halifaxBlue,
    fontSize: 13,
  },
  sectionHead: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  zonePill: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.halifaxBlue,
    backgroundColor: '#EEF5FC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  card: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  collectionDate: {
    color: colors.halifaxBlue,
    fontWeight: '700',
    fontSize: 15,
  },
  collectionItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectionText: {
    color: colors.text,
    fontWeight: '600',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  area: {
    color: colors.muted,
    fontSize: 12,
  },
  scheduleLink: {
    color: colors.halifaxBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  mapLink: {
    color: colors.halifaxBlue,
    fontWeight: '700',
    fontSize: 14,
  },
  alertList: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  alertDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  alertMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  reportButton: {
    marginTop: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.halifaxBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reportText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
