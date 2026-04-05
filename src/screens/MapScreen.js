import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle, Marker } from 'react-native-maps';
import AlertDetailSheet from '../components/AlertDetailSheet';
import PermitDetailSheet from '../components/PermitDetailSheet';
import { colors, radius, spacing } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

const DEFAULT_REGION = {
  latitude: 44.6488,
  longitude: -63.5752,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const iconForType = {
  construction: 'construction',
  traffic: 'traffic',
  info: 'info',
};

const immediateMarkerColor = '#A44A17';
const neighbourhoodMarkerColor = '#1E7A53';
const permitMarkerColor = '#004B8D';
const homeMarkerColor = '#0B2F5B';

// Show fewer markers when the search radius is small so the map stays readable.
function getMapMarkerDisplayLimit(radiusKm) {
  if (radiusKm <= 0.2) {
    return 15;
  }

  if (radiusKm <= 0.4) {
    return 22;
  }

  if (radiusKm <= 0.6) {
    return 28;
  }

  if (radiusKm <= 0.8) {
    return 34;
  }

  return 40;
}

function getPermitMarkerDisplayLimit(radiusKm) {
  if (radiusKm <= 0.2) {
    return 6;
  }

  if (radiusKm <= 0.4) {
    return 9;
  }

  if (radiusKm <= 0.6) {
    return 12;
  }

  if (radiusKm <= 0.8) {
    return 14;
  }

  return 16;
}

function byClosestThenNewest(left, right) {
  const leftDistance = Number.isFinite(left.distanceKm) ? left.distanceKm : Number.POSITIVE_INFINITY;
  const rightDistance = Number.isFinite(right.distanceKm) ? right.distanceKm : Number.POSITIVE_INFINITY;

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  return (right.initiatedAt || 0) - (left.initiatedAt || 0);
}

// Keep a mix of urgent and neighbourhood alerts on screen instead of letting
// one big group use every marker slot.
function pickDisplayedAlerts(immediateAlerts, neighbourhoodAlerts, markerLimit) {
  if (markerLimit <= 0) {
    return [];
  }

  const hasImmediate = immediateAlerts.length > 0;
  const hasNeighbourhood = neighbourhoodAlerts.length > 0;

  if (!hasImmediate || !hasNeighbourhood) {
    return immediateAlerts.concat(neighbourhoodAlerts).slice(0, markerLimit);
  }

  const reservedNeighbourhood = Math.min(
    neighbourhoodAlerts.length,
    Math.max(3, Math.floor(markerLimit * 0.35))
  );
  const reservedImmediate = Math.min(immediateAlerts.length, markerLimit - reservedNeighbourhood);

  const pickedImmediate = immediateAlerts.slice(0, reservedImmediate);
  const pickedNeighbourhood = neighbourhoodAlerts.slice(0, reservedNeighbourhood);
  const remainingSlots = markerLimit - pickedImmediate.length - pickedNeighbourhood.length;

  if (remainingSlots <= 0) {
    return pickedImmediate.concat(pickedNeighbourhood);
  }

  const remainingImmediate = immediateAlerts.slice(pickedImmediate.length);
  const remainingNeighbourhood = neighbourhoodAlerts.slice(pickedNeighbourhood.length);

  return pickedImmediate
    .concat(pickedNeighbourhood)
    .concat(remainingImmediate, remainingNeighbourhood)
    .slice(0, markerLimit);
}

function markerColorForAlert(alert) {
  return alert.urgencyBucket === 'immediate' ? immediateMarkerColor : neighbourhoodMarkerColor;
}

// Build a region that fits the saved address and nearby map points while also
// respecting the chosen search radius.
function buildRegion(resolvedAddress, nearbyAlerts, nearbyPermits, issueRadiusKm) {
  const firstPoint = nearbyAlerts[0] || nearbyPermits[0];
  const latitude = resolvedAddress?.latitude ?? firstPoint?.latitude ?? DEFAULT_REGION.latitude;
  const longitude = resolvedAddress?.longitude ?? firstPoint?.longitude ?? DEFAULT_REGION.longitude;
  const radiusPaddingFactor = 1.6;
  const radiusLatitudeDelta = Math.max((issueRadiusKm / 111) * radiusPaddingFactor * 2, 0.01);
  const radiusLongitudeDelta = Math.max(
    (issueRadiusKm / Math.max(Math.cos((latitude * Math.PI) / 180) * 111, 0.1)) * radiusPaddingFactor * 2,
    0.01
  );

  const allPoints = nearbyAlerts.concat(nearbyPermits);

  if (!allPoints.length) {
    return {
      latitude,
      longitude,
      latitudeDelta: radiusLatitudeDelta,
      longitudeDelta: radiusLongitudeDelta,
    };
  }

  const latitudes = allPoints.map((point) => point.latitude).concat(latitude);
  const longitudes = allPoints.map((point) => point.longitude).concat(longitude);
  const maxLat = Math.max(...latitudes);
  const minLat = Math.min(...latitudes);
  const maxLon = Math.max(...longitudes);
  const minLon = Math.min(...longitudes);

  return {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLon + minLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, radiusLatitudeDelta),
    longitudeDelta: Math.max((maxLon - minLon) * 1.6, radiusLongitudeDelta),
  };
}

export default function MapScreen({
  resolvedAddress,
  nearbyAlerts,
  nearbyPermits = [],
  issueRadiusKm = 0.5,
}) {
  const markerLimit = getMapMarkerDisplayLimit(issueRadiusKm);
  const permitMarkerLimit = getPermitMarkerDisplayLimit(issueRadiusKm);
  const immediateAlerts = nearbyAlerts
    .filter((alert) => alert.urgencyBucket === 'immediate')
    .sort(byClosestThenNewest);
  const neighbourhoodAlerts = nearbyAlerts
    .filter((alert) => alert.urgencyBucket !== 'immediate')
    .sort(byClosestThenNewest);
  const displayedAlerts = pickDisplayedAlerts(immediateAlerts, neighbourhoodAlerts, markerLimit);
  const displayedPermits = nearbyPermits.slice(0, permitMarkerLimit);
  const region = buildRegion(resolvedAddress, nearbyAlerts, nearbyPermits, issueRadiusKm);
  const [showImmediate, setShowImmediate] = useState(true);
  const [showNeighbourhood, setShowNeighbourhood] = useState(true);
  const [showPermits, setShowPermits] = useState(true);
  const mapKey = `${region.latitude}:${region.longitude}:${issueRadiusKm}`;
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const immediateCount = displayedAlerts.filter((alert) => alert.urgencyBucket === 'immediate').length;
  const neighbourhoodCount = displayedAlerts.length - immediateCount;
  const permitCount = displayedPermits.length;
  const visibleAlerts = displayedAlerts.filter((alert) => {
    if (alert.urgencyBucket === 'immediate') {
      return showImmediate;
    }

    return showNeighbourhood;
  });
  const visiblePermits = showPermits ? displayedPermits : [];
  const hasVisibleLayers = showImmediate || showNeighbourhood || showPermits;
  const formattedRadiusLabel = issueRadiusKm < 1
    ? `${Math.round(issueRadiusKm * 1000)} m`
    : `${issueRadiusKm.toFixed(1)} km`;

  const open311Form = async () => {
    const url = 'https://www.halifax.ca/home/online-services/illegally-parked-vehicle';
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
  };

  // Let the user take a photo first, try to save it locally, and then send
  // them to Halifax's report form.
  const captureAndRedirect = async () => {
    try {
      const currentCameraPermission = await ImagePicker.getCameraPermissionsAsync();
      const cameraPermission = currentCameraPermission.granted
        ? currentCameraPermission
        : await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert('Camera permission required', 'Cannot open camera. Redirecting to the 311 form.');
        open311Form();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
      });

      const cancelled = result.canceled ?? result.assets?.length === 0;
      if (cancelled) {
        open311Form();
        return;
      }

      const uri = result.assets?.[0]?.uri ?? result.uri;
      if (!uri) {
        open311Form();
        return;
      }

      const currentMediaPermission = await MediaLibrary.getPermissionsAsync();
      const mediaPermission = currentMediaPermission.granted
        ? currentMediaPermission
        : await MediaLibrary.requestPermissionsAsync();

      if (mediaPermission.status === 'granted') {
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Photo saved', 'Your photo was saved to your gallery.');
        } catch (saveErr) {
          console.warn('Save error:', saveErr);
          Alert.alert('Could not save photo', 'The photo could not be saved, but you can still submit the report.');
        }
      } else {
        Alert.alert('Permission denied', 'Photo was not saved to gallery.');
      }

      open311Form();
    } catch (e) {
      console.warn('captureAndRedirect error:', e);
      open311Form();
    }
  };

  const handleReportPress = () => {
    Alert.alert(
      'Take a photo?',
      'Would you like to take a photo before reporting?',
      [
        { text: 'No', onPress: () => open311Form() },
        { text: 'Yes', onPress: () => captureAndRedirect() },
      ],
      { cancelable: true }
    );
  };

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
              anchor={{ x: 0.5, y: 0.5 }}
              title="Saved address"
              description={resolvedAddress.canonicalAddress}
            >
              <View style={[styles.markerBadge, styles.homeMarkerBadge]}>
                <MaterialCommunityIcons name="anchor" size={16} color="#fff" />
              </View>
            </Marker>
            <Circle
              center={{
                latitude: resolvedAddress.latitude,
                longitude: resolvedAddress.longitude,
              }}
              radius={issueRadiusKm * 1000}
              fillColor="rgba(0, 75, 141, 0.10)"
              strokeColor="rgba(0, 75, 141, 0.28)"
            />
          </>
        ) : null}

        {visibleAlerts.map((alert) => (
          <Marker
            key={alert.id}
            coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => setSelectedAlert(alert)}
          >
            <View style={[styles.markerBadge, { backgroundColor: markerColorForAlert(alert) }]}>
              <MaterialIcons name={iconForType[alert.type] || 'info'} size={16} color="#fff" />
            </View>
          </Marker>
        ))}

        {visiblePermits.map((permit) => (
          <Marker
            key={permit.id}
            coordinate={{ latitude: permit.latitude, longitude: permit.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => setSelectedPermit(permit)}
          >
            <View style={[styles.markerBadge, styles.permitMarkerBadge]}>
              <MaterialIcons name="home-work" size={15} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.topStack}>
          <Text style={styles.mapSummaryText}>
            Nearby activity within {formattedRadiusLabel}.
          </Text>
          <View style={styles.legendRow}>
            <Pressable
              onPress={() => setShowImmediate((prev) => !prev)}
              style={[styles.legendPill, styles.legendPillImmediate, !showImmediate && styles.legendPillMuted]}
            >
              <View style={[styles.legendDot, styles.legendDotImmediate]} />
              <Text style={styles.legendText}>Immediate ({immediateCount})</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowNeighbourhood((prev) => !prev)}
              style={[styles.legendPill, styles.legendPillNeighbourhood, !showNeighbourhood && styles.legendPillMuted]}
            >
              <View style={[styles.legendDot, styles.legendDotNeighbourhood]} />
              <Text style={styles.legendText}>Neighbourhood ({neighbourhoodCount})</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowPermits((prev) => !prev)}
              style={[styles.legendPill, styles.legendPillPermits, !showPermits && styles.legendPillMuted]}
            >
              <View style={[styles.legendDot, styles.legendDotPermits]} />
              <Text style={styles.legendText}>Permits ({permitCount})</Text>
            </Pressable>
          </View>
          {!hasVisibleLayers ? (
            <Text style={styles.legendHintText}>Select at least one layer to show map activity.</Text>
          ) : null}
        </View>
        <View style={styles.bottomStack}>
          <Pressable style={styles.captureButton} onPress={handleReportPress}>
            <MaterialIcons name="add-a-photo" size={20} color="#fff" />
            <Text style={styles.captureText}>Report illegal vehicle parking</Text>
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
  topStack: {
    gap: spacing.xs,
  },
  mapSummaryText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  legendPillImmediate: {
    backgroundColor: '#F8EFE7',
    borderColor: '#F2DDCB',
  },
  legendPillNeighbourhood: {
    backgroundColor: '#EAF6F0',
    borderColor: '#D5ECE1',
  },
  legendPillPermits: {
    backgroundColor: '#E8F1FA',
    borderColor: '#B7D0EB',
  },
  legendPillMuted: {
    opacity: 0.45,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  legendDotImmediate: {
    backgroundColor: immediateMarkerColor,
  },
  legendDotNeighbourhood: {
    backgroundColor: neighbourhoodMarkerColor,
  },
  legendDotPermits: {
    backgroundColor: permitMarkerColor,
  },
  legendText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  legendHintText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  markerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  permitMarkerBadge: {
    backgroundColor: permitMarkerColor,
  },
  homeMarkerBadge: {
    backgroundColor: homeMarkerColor,
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
