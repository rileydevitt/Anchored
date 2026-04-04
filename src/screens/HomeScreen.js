import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import AlertDetailSheet from '../components/AlertDetailSheet';
import PermitDetailSheet from '../components/PermitDetailSheet';
import { exportPickupScheduleToCalendar } from '../services/calendarExport';

const iconForType = {
  construction: 'construction',
  traffic: 'traffic',
  info: 'info',
};

const HOME_ALERTS_PER_BUCKET = 4;
const HOME_PERMITS_LIMIT = 4;

// Pick a simple icon based on the collection item label.
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

// Zone labels help with waste routing, but they are not useful as list items in the UI.
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

// Main home dashboard: collection info first, then the most relevant nearby activity.
export default function HomeScreen({
  address,
  nextCollection,
  upcomingServices,
  nearbyAlerts,
  nearbyPermits = [],
  liveDataDelta,
  homeBuckets,
  onChangeHomeBuckets,
  loading,
  error,
  onViewMap,
}) {
  const [exportingCalendar, setExportingCalendar] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const showImmediate = homeBuckets?.showImmediate ?? true;
  const showNeighbourhood = homeBuckets?.showNeighbourhood ?? false;
  const showPermits = homeBuckets?.showPermits ?? false;
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
  const visiblePermits = nearbyPermits.slice(0, HOME_PERMITS_LIMIT);
  const hasNewInsights =
    Number(liveDataDelta?.newAlertCount || 0) > 0 || Number(liveDataDelta?.newPermitCount || 0) > 0;

  // Open links safely so a device that cannot handle the action still gives a clear message.
  const openExternalUrl = async (url, failureMessage) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        throw new Error('unsupported-url');
      }

      await Linking.openURL(url);
    } catch (externalError) {
      Alert.alert('Action unavailable', failureMessage);
    }
  };

  // Export the upcoming pickup schedule into the user's calendar and summarize the result.
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

      {!loading && hasNewInsights ? (
        <View style={styles.digestCard}>
          <Text style={styles.digestTitle}>Since your last refresh</Text>
          <Text style={styles.digestText}>
            {liveDataDelta.newAlertCount} new alert{liveDataDelta.newAlertCount === 1 ? '' : 's'} and{' '}
            {liveDataDelta.newPermitCount} new permit{liveDataDelta.newPermitCount === 1 ? '' : 's'} in your area.
          </Text>
        </View>
      ) : null}

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
          <LoadingState label="Loading nearby civic activity..." />
        ) : visibleAlertCount || visiblePermits.length ? (
          <>
            <BucketSection
              title="Immediate"
              subtitle="Safety and access around your home"
              tone="immediate"
              items={immediateAlerts}
              expanded={showImmediate}
              onToggle={() =>
                onChangeHomeBuckets((prev) => ({
                  ...prev,
                  showImmediate: !prev.showImmediate,
                }))
              }
              onSelectAlert={setSelectedAlert}
              onViewMap={onViewMap}
            />
            <BucketSection
              title="Neighbourhood"
              subtitle="Quality and maintenance nearby"
              tone="neighbourhood"
              items={neighbourhoodAlerts}
              expanded={showNeighbourhood}
              onToggle={() =>
                onChangeHomeBuckets((prev) => ({
                  ...prev,
                  showNeighbourhood: !prev.showNeighbourhood,
                }))
              }
              onSelectAlert={setSelectedAlert}
              onViewMap={onViewMap}
            />
            <BucketSection
              title="Permits"
              subtitle="Building and development activity nearby"
              tone="permits"
              items={visiblePermits}
              expanded={showPermits}
              onToggle={() =>
                onChangeHomeBuckets((prev) => ({
                  ...prev,
                  showPermits: !prev.showPermits,
                }))
              }
              onSelectPermit={setSelectedPermit}
              onViewMap={onViewMap}
            />
          </>
        ) : (
          <EmptyState label={error || 'No nearby civic activity was found for this address.'} />
        )}
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Need to report a civic issue?</Text>
        <Text style={styles.helpText}>
          Anchored surfaces local issues, but reporting is handled by Halifax 311.
        </Text>
        <View style={styles.helpActions}>
          <Pressable
            style={styles.helpActionButton}
            onPress={() => openExternalUrl('tel:311', 'Calling 311 is not available on this device.')}
          >
            <MaterialIcons name="call" size={16} color={colors.halifaxBlue} />
            <Text style={styles.helpActionText}>Call 311</Text>
          </Pressable>
          <Pressable
            style={styles.helpActionButton}
            onPress={() =>
              openExternalUrl(
                'https://www.halifax.ca/home/online-services',
                'The Halifax online services page could not be opened.'
              )
            }
          >
            <MaterialIcons name="open-in-new" size={16} color={colors.halifaxBlue} />
            <Text style={styles.helpActionText}>Open 311 Website</Text>
          </Pressable>
        </View>
      </View>

      <AlertDetailSheet
        alertItem={selectedAlert}
        visible={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
      />

      <PermitDetailSheet
        permitItem={selectedPermit}
        visible={Boolean(selectedPermit)}
        onClose={() => setSelectedPermit(null)}
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
  onSelectPermit,
  onViewMap,
}) {
  const hasHiddenItems = items.length > 0;
  const isPermitTone = tone === 'permits';

  return (
    <View style={styles.bucketSection}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.bucketHeader,
          tone === 'immediate'
            ? styles.bucketHeaderImmediate
            : isPermitTone
              ? styles.bucketHeaderPermits
              : styles.bucketHeaderNeighbourhood,
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
              tone === 'immediate'
                ? styles.bucketCountPillImmediate
                : isPermitTone
                  ? styles.bucketCountPillPermits
                  : styles.bucketCountPillNeighbourhood,
            ]}
          >
            <Text
              style={[
                styles.bucketCountText,
                tone === 'immediate'
                  ? styles.bucketCountTextImmediate
                  : isPermitTone
                    ? styles.bucketCountTextPermits
                    : styles.bucketCountTextNeighbourhood,
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
                  onPress={() => (isPermitTone ? onSelectPermit(item) : onSelectAlert(item))}
                  style={({ pressed }) => [
                    styles.alertRow,
                    idx < items.length - 1 && styles.divider,
                    pressed && styles.alertRowPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      tone === 'immediate'
                        ? styles.iconWrapImmediate
                        : isPermitTone
                          ? styles.iconWrapPermits
                          : styles.iconWrapNeighbourhood,
                    ]}
                  >
                    <MaterialIcons
                      name={isPermitTone ? 'home-work' : iconForType[item.type] || 'info'}
                      size={20}
                      color={tone === 'immediate' ? '#A44A17' : isPermitTone ? '#0B2F5B' : '#1E7A53'}
                    />
                  </View>
                  <View style={styles.alertBody}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertDescription}>
                      {isPermitTone
                        ? (item.address ? `Near ${item.address}` : item.description)
                        : item.description}
                    </Text>
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
  digestCard: {
    marginTop: spacing.xs,
    borderRadius: radius.card,
    backgroundColor: '#EEF4FB',
    borderWidth: 1,
    borderColor: '#CFE0F1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  digestTitle: {
    color: colors.halifaxBlue,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  digestText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
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
  bucketHeaderPermits: {
    backgroundColor: '#EAF0FB',
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
  bucketCountPillPermits: {
    backgroundColor: '#CFE0F1',
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
  bucketCountTextPermits: {
    color: '#0B2F5B',
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
  iconWrapPermits: {
    backgroundColor: '#F2F7FC',
    borderColor: '#CFE0F1',
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
  helpCard: {
    marginTop: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  helpTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  helpText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  helpActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helpActionButton: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#CFE0F1',
    backgroundColor: '#F2F7FC',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  helpActionText: {
    color: colors.halifaxBlue,
    fontWeight: '700',
    fontSize: 13,
  },
});
