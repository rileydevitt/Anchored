import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

export default function MapScreen({ nearbyAlerts, loading, error, community }) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nearby Civic Issues</Text>
      <Text style={styles.subtitle}>
        {community
          ? `Live Cityworks requests near ${community}. The interactive map is still the next milestone.`
          : 'Live Cityworks requests for your saved Halifax address. The interactive map is still the next milestone.'}
      </Text>

      <View style={styles.fakeMap}>
        <MaterialIcons name="map" size={36} color={colors.halifaxBlue} />
        <Text style={styles.fakeMapText}>Interactive map coming next</Text>
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={colors.halifaxBlue} />
          <Text style={styles.stateText}>Loading nearby Cityworks requests...</Text>
        </View>
      ) : nearbyAlerts.length ? (
        nearbyAlerts.map((alert) => (
          <View key={alert.id} style={styles.item}>
            <Text style={styles.itemTitle}>{alert.title}</Text>
            <Text style={styles.itemBody}>{alert.description}</Text>
            <Text style={styles.itemMeta}>{alert.meta}</Text>
          </View>
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
  fakeMap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: '#EFF6FF',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fakeMapText: {
    color: colors.halifaxBlue,
    fontWeight: '700',
  },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
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
