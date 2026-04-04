import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

// Shared helper for opening external pages while keeping user-facing errors friendly.
async function openExternalUrl(url, failureMessage) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      throw new Error('unsupported-url');
    }

    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Action unavailable', failureMessage);
  }
}

// Only show rows for permit data that actually exists.
function DetailRow({ label, value }) {
  if (!value && value !== 0) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// Compact badge used near the top of the sheet for quick facts.
function MetaPill({ label, tone = 'default' }) {
  if (!label) {
    return null;
  }

  return (
    <View style={[styles.metaPill, tone === 'accent' && styles.metaPillAccent]}>
      <Text style={[styles.metaPillText, tone === 'accent' && styles.metaPillTextAccent]}>{label}</Text>
    </View>
  );
}

// Bottom sheet for one nearby permit with impact, details, and quick actions.
export default function PermitDetailSheet({ permitItem, visible, onClose }) {
  if (!permitItem) {
    return null;
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${permitItem.latitude},${permitItem.longitude}`;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="home-work" size={22} color={colors.halifaxBlue} />
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>Nearby building permit</Text>
              <Text style={styles.title}>{permitItem.title}</Text>
              {permitItem.description ? <Text style={styles.subtitle}>{permitItem.description}</Text> : null}
            </View>

            <View style={styles.metaRow}>
              <MetaPill label={permitItem.impactLabel} tone="accent" />
              <MetaPill label={permitItem.statusLabel} />
              <MetaPill label={permitItem.distanceLabel} />
              <MetaPill label={permitItem.issuedAtLabel} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why this may matter</Text>
              {(permitItem.whyItMatters || []).length ? (
                permitItem.whyItMatters.map((point) => (
                  <View key={point} style={styles.pointRow}>
                    <MaterialIcons name="circle" size={8} color={colors.halifaxBlue} />
                    <Text style={styles.pointText}>{point}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noteText}>Recent permit activity can indicate upcoming construction activity around your area.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Permit details</Text>
              <DetailRow label="Permit number" value={permitItem.permitNumber} />
              <DetailRow label="Address" value={permitItem.address} />
              <DetailRow label="Community" value={permitItem.community} />
              <DetailRow label="District" value={permitItem.district} />
              <DetailRow label="Work type" value={permitItem.workType} />
              <DetailRow label="Work scope" value={permitItem.workScope} />
              <DetailRow label="Structure type" value={permitItem.typeLabel} />
              <DetailRow label="Estimated project value" value={permitItem.estimatedValueLabel} />
              <DetailRow label="Net new units" value={permitItem.netNewUnits} />
              <DetailRow label="Permit status" value={permitItem.statusLabel} />
              <DetailRow label="Issued" value={permitItem.exactIssuedAt} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionList}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => openExternalUrl(directionsUrl, 'Directions could not be opened.')}
                >
                  <MaterialIcons name="directions" size={18} color={colors.halifaxBlue} />
                  <Text style={styles.actionText}>Get directions</Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() =>
                    openExternalUrl(
                      'https://www.halifax.ca/home-property/building-development-permits',
                      'Permit information page could not be opened.'
                    )
                  }
                >
                  <MaterialIcons name="open-in-new" size={18} color={colors.halifaxBlue} />
                  <Text style={styles.actionText}>Permit info in Halifax</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.36)',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F1FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.halifaxBlue,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaPillAccent: {
    backgroundColor: '#E8F1FA',
    borderColor: '#B7D0EB',
  },
  metaPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  metaPillTextAccent: {
    color: colors.halifaxBlue,
  },
  section: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  noteText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  actionList: {
    gap: spacing.sm,
  },
  actionButton: {
    minHeight: 50,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
