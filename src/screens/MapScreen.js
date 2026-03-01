import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';
import { colors, radius, spacing } from '../constants/theme';

const DEFAULT_REGION = {
  latitude: 44.6488,
  longitude: -63.5752,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const markerColorByType = {
  construction: '#D97706',
  traffic: '#DC2626',
  info: colors.halifaxBlue,
};

function buildRegion(resolvedAddress, nearbyAlerts) {
  const latitude = resolvedAddress?.latitude ?? nearbyAlerts[0]?.latitude ?? DEFAULT_REGION.latitude;
  const longitude = resolvedAddress?.longitude ?? nearbyAlerts[0]?.longitude ?? DEFAULT_REGION.longitude;

  if (!nearbyAlerts.length) {
    return {
      latitude,
      longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }

  const latitudes = nearbyAlerts.map((alert) => alert.latitude).concat(latitude);
  const longitudes = nearbyAlerts.map((alert) => alert.longitude).concat(longitude);
  const maxLat = Math.max(...latitudes);
  const minLat = Math.min(...latitudes);
  const maxLon = Math.max(...longitudes);
  const minLon = Math.min(...longitudes);

  return {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLon + minLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.03),
    longitudeDelta: Math.max((maxLon - minLon) * 1.6, 0.03),
  };
}

export default function MapScreen({ resolvedAddress, nearbyAlerts, loading, error, community }) {
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  useEffect(() => {
    setSelectedIssueId(nearbyAlerts[0]?.id ?? null);
  }, [nearbyAlerts]);

  const selectedIssue =
    nearbyAlerts.find((alert) => alert.id === selectedIssueId) ?? nearbyAlerts[0] ?? null;
  const region = buildRegion(resolvedAddress, nearbyAlerts);
  const mapKey = `${region.latitude}:${region.longitude}:${nearbyAlerts.length}`;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nearby Civic Issues</Text>
      <Text style={styles.subtitle}>
        {community
          ? `Live Cityworks requests near ${community}. Tap a marker to inspect the issue.`
          : 'Live Cityworks requests for your saved Halifax address. Tap a marker to inspect the issue.'}
      </Text>

      <View style={styles.mapCard}>
        <MapView key={mapKey} style={styles.map} initialRegion={region}>
          {resolvedAddress ? (
            <>
              <Marker
                coordinate={{
                  latitude: resolvedAddress.latitude,
                  longitude: resolvedAddress.longitude,
                }}
                pinColor={colors.halifaxBlue}
                title="Saved address"
                description={resolvedAddress.canonicalAddress}
              />
              <Circle
                center={{
                  latitude: resolvedAddress.latitude,
                  longitude: resolvedAddress.longitude,
                }}
                radius={500}
                fillColor="rgba(0, 75, 141, 0.10)"
                strokeColor="rgba(0, 75, 141, 0.28)"
              />
            </>
          ) : null}

          {nearbyAlerts.map((alert) => (
            <Marker
              key={alert.id}
              coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
              pinColor={markerColorByType[alert.type] || colors.halifaxBlue}
              onPress={() => setSelectedIssueId(alert.id)}
            >
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{alert.title}</Text>
                  <Text style={styles.calloutBody}>{alert.description}</Text>
                  <Text style={styles.calloutMeta}>{alert.meta}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      {selectedIssue ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>{selectedIssue.title}</Text>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selectedIssue.status || 'Open'}</Text>
            </View>
          </View>
          <Text style={styles.selectedBody}>{selectedIssue.description}</Text>
          <Text style={styles.selectedMeta}>{selectedIssue.meta}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={colors.halifaxBlue} />
          <Text style={styles.stateText}>Loading nearby Cityworks requests...</Text>
        </View>
      ) : nearbyAlerts.length ? (
        nearbyAlerts.map((alert) => (
          <Pressable
            key={alert.id}
            style={[styles.item, selectedIssue?.id === alert.id && styles.itemSelected]}
            onPress={() => setSelectedIssueId(alert.id)}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{alert.title}</Text>
              <MaterialIcons
                name="place"
                size={18}
                color={markerColorByType[alert.type] || colors.halifaxBlue}
              />
            </View>
            <Text style={styles.itemBody}>{alert.description}</Text>
            <Text style={styles.itemMeta}>{alert.meta}</Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>
            {error || 'No nearby live civic issues were found for this address.'}
          </Text>
        </View>
      )}

      <Pressable style={styles.captureButton}>
        <MaterialIcons name="add-a-photo" size={20} color="#fff" />
        <Text style={styles.captureText}>Capture Photo + Redirect to 311</Text>
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
    paddingTop: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  mapCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  map: {
    height: 260,
    width: '100%',
  },
  callout: {
    maxWidth: 220,
    paddingVertical: 2,
  },
  calloutTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  calloutBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  calloutMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  selectedCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '800',
  },
  selectedBadge: {
    borderRadius: radius.pill,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedBadgeText: {
    color: colors.halifaxBlue,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  selectedMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemSelected: {
    borderColor: '#9CC2E6',
    backgroundColor: '#F8FBFF',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  itemBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  stateWrap: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stateText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  captureButton: {
    marginTop: spacing.sm,
    minHeight: 52,
    backgroundColor: colors.halifaxBlue,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  captureText: {
    color: '#fff',
    fontWeight: '700',
  },
});
