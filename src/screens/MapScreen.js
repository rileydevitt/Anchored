import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle, Marker } from 'react-native-maps';
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

export default function MapScreen({ resolvedAddress, nearbyAlerts }) {
  const region = buildRegion(resolvedAddress, nearbyAlerts);
  const mapKey = `${region.latitude}:${region.longitude}:${nearbyAlerts.length}`;

  return (
    <View style={styles.root}>
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
          />
        ))}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.bottomStack}>
          <Pressable style={styles.captureButton}>
            <MaterialIcons name="add-a-photo" size={20} color="#fff" />
            <Text style={styles.captureText}>Capture Photo + Redirect to 311</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  bottomStack: {
    gap: spacing.sm,
  },
  captureButton: {
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
