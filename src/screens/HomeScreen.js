import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

const iconForType = {
  construction: 'construction',
  traffic: 'traffic',
  info: 'info',
};

function iconForCollectionItem(item) {
  const value = item.toLowerCase();

  if (value.includes('recycl')) {
    return 'recycling';
  }

  if (value.includes('organ')) {
    return 'eco';
  }

  return 'calendar-today';
}

export default function HomeScreen({
  address,
  nextCollection,
  upcomingServices,
  nearbyAlerts,
  loading,
  error,
  onViewMap,
}) {
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  useEffect(() => {
    setShowAllUpcoming(false);
  }, [upcomingServices]);

  const additionalServices = upcomingServices.slice(1);
  const visibleAdditionalServices = showAllUpcoming
    ? additionalServices
    : additionalServices.slice(0, 2);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingLabel}>Good morning</Text>
          <Text style={styles.location}>{address || 'Halifax, NS'}</Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Next Collection</Text>
      </View>

      <View style={styles.card}>
        {loading ? (
          <LoadingState label="Loading live collection data..." />
        ) : nextCollection ? (
          <>
            <Text style={styles.collectionDate}>{nextCollection.dateLabel}</Text>
            <View style={styles.collectionItems}>
              {nextCollection.items.map((item) => (
                <View style={styles.collectionChip} key={item}>
                  <MaterialIcons
                    name={iconForCollectionItem(item)}
                    size={18}
                    color={colors.muted}
                  />
                  <Text style={styles.collectionText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.area}>{nextCollection.area}</Text>
              <Text style={styles.scheduleLink}>Live Halifax data</Text>
            </View>

            {upcomingServices.length ? (
              <View style={styles.scheduleSection}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTitle}>Upcoming Schedule</Text>
                  {additionalServices.length ? (
                    <Pressable onPress={() => setShowAllUpcoming((value) => !value)}>
                      <Text style={styles.scheduleAction}>
                        {showAllUpcoming ? 'Show less' : 'See more'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.scheduleList}>
                  {visibleAdditionalServices.length ? (
                    visibleAdditionalServices.map((service) => (
                      <View key={service.id} style={styles.scheduleItem}>
                        <Text style={styles.scheduleItemDay}>{service.day}</Text>
                        <Text style={styles.scheduleItemText}>{service.items}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.scheduleHint}>The next collection above is the only upcoming date loaded right now.</Text>
                  )}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState
            label={error || 'Add a Halifax civic address to load your collection area and schedule.'}
          />
        )}
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Nearby Alerts</Text>
        <Pressable onPress={onViewMap}>
          <Text style={styles.mapLink}>View Map</Text>
        </Pressable>
      </View>

      <View style={styles.alertList}>
        {loading ? (
          <LoadingState label="Loading nearby Cityworks requests..." />
        ) : nearbyAlerts.length ? (
          nearbyAlerts.map((item, idx) => (
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
          ))
        ) : (
          <EmptyState label={error || 'No nearby open civic requests were found for this address.'} />
        )}
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

function LoadingState({ label }) {
  return (
    <View style={styles.stateWrap}>
      <ActivityIndicator color={colors.halifaxBlue} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

function EmptyState({ label }) {
  return (
    <View style={styles.stateWrap}>
      <Text style={styles.stateText}>{label}</Text>
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
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  scheduleAction: {
    color: colors.halifaxBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleList: {
    gap: spacing.sm,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  scheduleItemDay: {
    color: colors.halifaxBlue,
    fontWeight: '700',
    fontSize: 13,
  },
  scheduleItemText: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  scheduleHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
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
  stateWrap: {
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stateText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
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
