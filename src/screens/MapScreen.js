import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle, Marker } from 'react-native-maps';
import AlertDetailSheet from '../components/AlertDetailSheet';
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

function byClosestThenNewest(left, right) {
  const leftDistance = Number.isFinite(left.distanceKm) ? left.distanceKm : Number.POSITIVE_INFINITY;
  const rightDistance = Number.isFinite(right.distanceKm) ? right.distanceKm : Number.POSITIVE_INFINITY;

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  return (right.initiatedAt || 0) - (left.initiatedAt || 0);
}

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

export default function MapScreen({ resolvedAddress, nearbyAlerts, issueRadiusKm = 0.5 }) {
  const markerLimit = getMapMarkerDisplayLimit(issueRadiusKm);
  const immediateAlerts = nearbyAlerts
    .filter((alert) => alert.urgencyBucket === 'immediate')
    .sort(byClosestThenNewest);
  const neighbourhoodAlerts = nearbyAlerts
    .filter((alert) => alert.urgencyBucket !== 'immediate')
    .sort(byClosestThenNewest);
  const displayedAlerts = pickDisplayedAlerts(immediateAlerts, neighbourhoodAlerts, markerLimit);
  const region = buildRegion(resolvedAddress, nearbyAlerts);
  const mapKey = `${region.latitude}:${region.longitude}:${displayedAlerts.length}`;
  const [selectedAlert, setSelectedAlert] = useState(null);
  const immediateCount = displayedAlerts.filter((alert) => alert.urgencyBucket === 'immediate').length;
  const neighbourhoodCount = displayedAlerts.length - immediateCount;
  const formattedRadiusLabel = issueRadiusKm < 1
    ? `${Math.round(issueRadiusKm * 1000)} m`
    : `${issueRadiusKm.toFixed(1)} km`;

  const open311Form = async () => {
    const url = 'https://www.halifax.ca/home/online-services/illegally-parked-vehicle';
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
  };

const captureAndRedirect = async () => {
  try {
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
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

    // Request AFTER capture so the user has context for why you need it
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();

    if (mediaStatus === 'granted') {
      try {
        await MediaLibrary.saveToLibraryAsync(uri); // simpler than createAsset + createAlbum
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

        {displayedAlerts.map((alert) => (
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
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.topStack}>
          <Text style={styles.mapSummaryText}>
            Nearby alerts within {formattedRadiusLabel}.
          </Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendPill, styles.legendPillImmediate]}>
              <View style={[styles.legendDot, styles.legendDotImmediate]} />
              <Text style={styles.legendText}>Immediate ({immediateCount})</Text>
            </View>
            <View style={[styles.legendPill, styles.legendPillNeighbourhood]}>
              <View style={[styles.legendDot, styles.legendDotNeighbourhood]} />
              <Text style={styles.legendText}>Neighbourhood ({neighbourhoodCount})</Text>
            </View>
          </View>
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
  legendText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
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
