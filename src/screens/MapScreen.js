import React from 'react';
import { Pressable, StyleSheet, Text, View, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Circle, Marker } from 'react-native-maps';
import { colors, radius, spacing } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

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
          <Pressable style={styles.captureButton} onPress={handleReportPress}>
            <MaterialIcons name="add-a-photo" size={20} color="#fff" />
            <Text style={styles.captureText}>Report illegal vehicle parking</Text>
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
