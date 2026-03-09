export default {
  expo: {
    name: 'Anchored',
    slug: 'anchored',
    version: '1.0.0',
    plugins: [
      [
        'expo-calendar',
        {
          calendarPermission: 'Allow Anchored to add pickup days to your calendar.',
        },
      ],
      [
        'expo-image-picker',
        {
          cameraPermission: 'Allow Anchored to take photos for reports.',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow Anchored to save photos to your gallery.',
          savePhotosPermission: 'Allow Anchored to save photos to your gallery.',
          isAccessMediaLocationEnabled: true,
        },
      ],
    ],
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#F9FAFB',
    },
    ios: {
      supportsTablet: true,
      icon: './AnchoredIcon.png',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#F9FAFB',
        foregroundImage: './AnchoredIcon.png',
      },
      icon: './AnchoredIcon.png',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        'android.permission.ACCESS_MEDIA_LOCATION',
        'android.permission.READ_MEDIA_VIDEO',
      ],
      package: 'com.azain.anchored',
    },
    web: {
      bundler: 'metro',
    },
    extra: {
      eas: {
        projectId: '43466fa5-a843-4542-968f-19d3232c0c72',
      },
    },
  },
};
