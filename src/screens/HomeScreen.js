import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import AlertDetailSheet from '../components/AlertDetailSheet';
import { exportPickupScheduleToCalendar } from '../services/calendarExport';

const iconForType = {
  construction: 'construction',
  traffic: 'traffic',
  info: 'info',
};

const HOME_ALERTS_PER_BUCKET = 4;

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

function isZoneLabel(value) {
  return value.toLowerCase().includes('zone');
}

function formatScheduleLine(value) {
  return value
    .split('•')
    .map((part) => part.trim())
    .filter((part) => part && !isZoneLabel(part))
    .join(' • ');
}

function byClosestThenNewest(left, right) {
  const leftDistance = Number.isFinite(left.distanceKm) ? left.distanceKm : Number.POSITIVE_INFINITY;
  const rightDistance = Number.isFinite(right.distanceKm) ? right.distanceKm : Number.POSITIVE_INFINITY;

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  return (right.initiatedAt || 0) - (left.initiatedAt || 0);
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
  const [exportingCalendar, setExportingCalendar] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showImmediate, setShowImmediate] = useState(true);
  const [showNeighbourhood, setShowNeighbourhood] = useState(false);
  const additionalServices = upcomingServices.slice(1);
  const visibleCollectionItems = (nextCollection?.items || []).filter((item) => !isZoneLabel(item));
  const immediateAlertsAll = nearbyAlerts
    .filter((item) => item.urgencyBucket === 'immediate')
    .sort(byClosestThenNewest);
  const neighbourhoodAlertsAll = nearbyAlerts
    .filter((item) => item.urgencyBucket !== 'immediate')
    .sort(byClosestThenNewest);
  const immediateAlerts = immediateAlertsAll.slice(0, HOME_ALERTS_PER_BUCKET);
  const neighbourhoodAlerts = neighbourhoodAlertsAll.slice(0, HOME_ALERTS_PER_BUCKET);
  const visibleAlertCount = immediateAlerts.length + neighbourhoodAlerts.length;

  const handleExportCalendar = async () => {
    setExportingCalendar(true);

    try {
      const result = await exportPickupScheduleToCalendar({
        address,
        services: upcomingServices,
      });

      const summary =
        result.skippedCount > 0
          ? `Added ${result.createdCount} pickup day${result.createdCount === 1 ? '' : 's'} to ${result.calendarTitle}. ${result.skippedCount} already existed.`
          : `Added ${result.createdCount} pickup day${result.createdCount === 1 ? '' : 's'} to ${result.calendarTitle}.`;

      Alert.alert('Calendar updated', summary);
    } catch (exportError) {
      Alert.alert('Calendar export failed', exportError.message || 'Unable to export pickup days.');
    } finally {
      setExportingCalendar(false);
    }
  };

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
              {visibleCollectionItems.map((item) => (
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
            {upcomingServices.length ? (
              <View style={styles.scheduleSection}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTitle}>Upcoming Schedule</Text>
                  <Pressable
                    disabled={exportingCalendar}
                    onPress={handleExportCalendar}
                  >
                    <Text
                      style={[
                        styles.scheduleAction,
                        exportingCalendar && styles.scheduleActionDisabled,
                      ]}
                    >
                      {exportingCalendar ? 'Exporting...' : 'Add Schedule to Calendar'}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.scheduleList}>
                  {additionalServices.length ? (
                    additionalServices.map((service) => (
                      <View key={service.id} style={styles.scheduleItem}>
                        <Text style={styles.scheduleItemDay}>{service.day}</Text>
                        <Text style={styles.scheduleItemText}>{formatScheduleLine(service.items)}</Text>
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
      </View>

      <View style={styles.alertList}>
        {loading ? (
          <LoadingState label="Loading nearby Cityworks requests..." />
        ) : visibleAlertCount ? (
          <>
            <BucketSection
              title="Immediate"
              subtitle="Safety and access around your home"
              tone="immediate"
              items={immediateAlerts}
              expanded={showImmediate}
              onToggle={() => setShowImmediate((prev) => !prev)}
              onSelectAlert={setSelectedAlert}
              onViewMap={onViewMap}
            />
            <BucketSection
              title="Neighbourhood"
              subtitle="Quality and maintenance nearby"
              tone="neighbourhood"
              items={neighbourhoodAlerts}
              expanded={showNeighbourhood}
              onToggle={() => setShowNeighbourhood((prev) => !prev)}
              onSelectAlert={setSelectedAlert}
              onViewMap={onViewMap}
            />
          </>
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

      <AlertDetailSheet
        alertItem={selectedAlert}
        visible={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
      />
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

function BucketSection({
  title,
  subtitle,
  tone,
  items,
  expanded,
  onToggle,
  onSelectAlert,
  onViewMap,
}) {
  const hasHiddenItems = items.length > 0;

  return (
    <View style={styles.bucketSection}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.bucketHeader,
          tone === 'immediate' ? styles.bucketHeaderImmediate : styles.bucketHeaderNeighbourhood,
          pressed && styles.bucketHeaderPressed,
        ]}
      >
        <View style={styles.bucketCopy}>
          <Text style={styles.bucketTitle}>{title}</Text>
          <Text style={styles.bucketSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.bucketRight}>
          <View
            style={[
              styles.bucketCountPill,
              tone === 'immediate' ? styles.bucketCountPillImmediate : styles.bucketCountPillNeighbourhood,
            ]}
          >
            <Text
              style={[
                styles.bucketCountText,
                tone === 'immediate' ? styles.bucketCountTextImmediate : styles.bucketCountTextNeighbourhood,
              ]}
            >
              {items.length}
            </Text>
          </View>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color={colors.muted}
          />
        </View>
      </Pressable>

      {expanded ? (
        items.length ? (
          <>
            <View style={styles.bucketBody}>
              {items.map((item, idx) => (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectAlert(item)}
                  style={({ pressed }) => [
                    styles.alertRow,
                    idx < items.length - 1 && styles.divider,
                    pressed && styles.alertRowPressed,
                  ]}
                >
                  <View style={[styles.iconWrap, tone === 'immediate' ? styles.iconWrapImmediate : styles.iconWrapNeighbourhood]}>
                    <MaterialIcons
                      name={iconForType[item.type] || 'info'}
                      size={20}
                      color={tone === 'immediate' ? '#A44A17' : '#1E7A53'}
                    />
                  </View>
                  <View style={styles.alertBody}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertDescription}>{item.description}</Text>
                    <Text style={styles.alertMeta}>{item.meta}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                </Pressable>
              ))}
            </View>

            {hasHiddenItems ? (
              <Pressable onPress={onViewMap} style={styles.bucketHintWrap}>
                <Text style={styles.bucketHintText}>
                  Showing closest {items.length}. View map for all.
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text style={styles.bucketEmpty}>No current alerts in this bucket.</Text>
        )
      ) : null}
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
  scheduleActionDisabled: {
    color: colors.muted,
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
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  bucketSection: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  bucketHeader: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  bucketHeaderImmediate: {
    backgroundColor: '#F8EFE7',
  },
  bucketHeaderNeighbourhood: {
    backgroundColor: '#EAF6F0',
  },
  bucketHeaderPressed: {
    opacity: 0.8,
  },
  bucketCopy: {
    flex: 1,
  },
  bucketTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  bucketSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  bucketRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bucketCountPill: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bucketCountPillImmediate: {
    backgroundColor: '#F2DCC8',
  },
  bucketCountPillNeighbourhood: {
    backgroundColor: '#D6ECE0',
  },
  bucketCountText: {
    fontWeight: '800',
    fontSize: 12,
  },
  bucketCountTextImmediate: {
    color: '#A44A17',
  },
  bucketCountTextNeighbourhood: {
    color: '#1E7A53',
  },
  bucketBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bucketEmpty: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  bucketHintWrap: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bucketHintText: {
    color: colors.halifaxBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  alertRowPressed: {
    opacity: 0.8,
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
  iconWrapImmediate: {
    backgroundColor: '#FDF4ED',
    borderColor: '#F2DDCB',
  },
  iconWrapNeighbourhood: {
    backgroundColor: '#F2FBF6',
    borderColor: '#D5ECE1',
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
