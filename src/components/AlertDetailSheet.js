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

const iconForType = {
  construction: 'construction',
  traffic: 'traffic',
  info: 'info',
};

// Shared helper for buttons that open phone links or map links.
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

// Only render a row when that piece of data exists.
function DetailRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// Compact label used for status, category, distance, and time.
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

// Bottom sheet that explains one nearby civic alert in plain sections.
export default function AlertDetailSheet({ alertItem, visible, onClose }) {
  if (!alertItem) {
    return null;
  }

  const typeIcon = iconForType[alertItem.type] || 'info';
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${alertItem.latitude},${alertItem.longitude}`;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MaterialIcons name={typeIcon} size={22} color={colors.halifaxBlue} />
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>Nearby civic alert</Text>
              <Text style={styles.title}>{alertItem.title}</Text>
              {alertItem.description ? (
                <Text style={styles.subtitle}>{alertItem.description}</Text>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              <MetaPill label={alertItem.statusLabel} tone="accent" />
              <MetaPill label={alertItem.categoryLabel} />
              <MetaPill label={alertItem.distanceLabel} />
              <MetaPill label={alertItem.initiatedAtLabel} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <DetailRow label="Address" value={alertItem.address} />
              <DetailRow label="Community" value={alertItem.community} />
              <DetailRow label="District" value={alertItem.district} />
              <DetailRow label="Priority" value={alertItem.priorityLabel} />
              <DetailRow label="Department" value={alertItem.department} />
              <DetailRow label="Work order" value={alertItem.workOrderLabel} />
              <DetailRow label="Request ID" value={alertItem.id} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <DetailRow label="Reported" value={alertItem.exactInitiatedAt} />
              <DetailRow label="Closed" value={alertItem.exactClosedAt} />
              <DetailRow label="Current status" value={alertItem.statusLabel} />
            </View>

            {alertItem.resolution ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>City note</Text>
                <Text style={styles.noteText}>{alertItem.resolution}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionList}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => openExternalUrl('tel:311', 'Calling 311 is not available on this device.')}
                >
                  <MaterialIcons name="call" size={18} color={colors.halifaxBlue} />
                  <Text style={styles.actionText}>Call 311</Text>
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => openExternalUrl(directionsUrl, 'Directions could not be opened.')}
                >
                  <MaterialIcons name="directions" size={18} color={colors.halifaxBlue} />
                  <Text style={styles.actionText}>Get directions</Text>
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
    fontSize: 24,
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