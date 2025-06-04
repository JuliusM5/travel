module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
  dependencies: {
    // Fix for react-native-vector-icons
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
};