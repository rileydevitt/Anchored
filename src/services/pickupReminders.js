import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { colors } from '../constants/theme';

const PICKUP_REMINDER_KIND = 'pickup-reminder';
const PICKUP_REMINDER_CHANNEL_ID = 'pickup-reminders';
const DEFAULT_REMINDER_HOUR = 20;

export const REMINDER_HOUR_OPTIONS = [18, 20, 21];

let notificationsInitialized = false;

export function normalizeReminderHour(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_REMINDER_HOUR;
  }

  const roundedValue = Math.round(numericValue);

  return REMINDER_HOUR_OPTIONS.includes(roundedValue) ? roundedValue : DEFAULT_REMINDER_HOUR;
}

export function formatReminderHourLabel(hour) {
  const normalizedHour = normalizeReminderHour(hour);
  const suffix = normalizedHour >= 12 ? 'PM' : 'AM';
  const twelveHourValue = normalizedHour % 12 || 12;

  return `${twelveHourValue}:00 ${suffix}`;
}

function isPermissionGranted(status) {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function normalizeServiceLabel(items) {
  if (!items) {
    return 'Civic pickup';
  }

  return items
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' + ');
}

function buildReminderDate(dateISO, reminderHour) {
  const normalizedHour = normalizeReminderHour(reminderHour);
  const reminderDate = new Date(`${dateISO}T${String(normalizedHour).padStart(2, '0')}:00:00`);
  reminderDate.setDate(reminderDate.getDate() - 1);
  return reminderDate;
}

function buildReminderBody(service, address, reminderHour) {
  const itemLabel = normalizeServiceLabel(service.items);
  const locationSuffix = address ? ` for ${address}` : '';
  return `${itemLabel} pickup is tomorrow${locationSuffix}. Reminder set for ${formatReminderHourLabel(reminderHour)} the night before.`;
}

async function getAnchoredReminderRequests() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  return scheduled.filter(
    (request) => request.content?.data?.kind === PICKUP_REMINDER_KIND
  );
}

export async function initializePickupReminders() {
  if (!notificationsInitialized) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    notificationsInitialized = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PICKUP_REMINDER_CHANNEL_ID, {
      name: 'Pickup reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.halifaxBlue,
    });
  }
}

export async function ensurePickupReminderPermissions() {
  await initializePickupReminders();

  const currentStatus = await Notifications.getPermissionsAsync();

  if (isPermissionGranted(currentStatus)) {
    return currentStatus;
  }

  const requestedStatus = await Notifications.requestPermissionsAsync();

  if (isPermissionGranted(requestedStatus)) {
    return requestedStatus;
  }

  throw new Error('Notification permission is required to enable pickup reminders.');
}

export async function getPickupReminderPermissionGranted() {
  await initializePickupReminders();

  const currentStatus = await Notifications.getPermissionsAsync();

  return isPermissionGranted(currentStatus);
}

export async function cancelPickupReminders() {
  await initializePickupReminders();

  const requests = await getAnchoredReminderRequests();

  await Promise.all(
    requests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );

  return requests.length;
}

export async function syncPickupReminders({ address, services, reminderHour = DEFAULT_REMINDER_HOUR }) {
  await initializePickupReminders();

  const permissionStatus = await Notifications.getPermissionsAsync();

  if (!isPermissionGranted(permissionStatus)) {
    return {
      permissionGranted: false,
      scheduledCount: 0,
      skippedCount: services?.length || 0,
    };
  }

  const datedServices = (services || []).filter((service) => service.dateISO);
  const normalizedReminderHour = normalizeReminderHour(reminderHour);
  const upcomingReminders = datedServices.filter(
    (service) => buildReminderDate(service.dateISO, normalizedReminderHour) > new Date()
  );

  await cancelPickupReminders();

  await Promise.all(
    upcomingReminders.map((service) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pickup reminder for tomorrow',
          body: buildReminderBody(service, address, normalizedReminderHour),
          sound: false,
          data: {
            kind: PICKUP_REMINDER_KIND,
            dateISO: service.dateISO,
            serviceId: service.id,
            reminderHour: normalizedReminderHour,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          channelId: PICKUP_REMINDER_CHANNEL_ID,
          date: buildReminderDate(service.dateISO, normalizedReminderHour),
        },
      })
    )
  );

  return {
    permissionGranted: true,
    scheduledCount: upcomingReminders.length,
    skippedCount: datedServices.length - upcomingReminders.length,
  };
}