import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const planeAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate plane
    Animated.timing(planeAnim, {
      toValue: width,
      duration: 2000,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon name="airplane" size={80} color={Colors.white} />
        </View>
        <Text style={styles.title}>TravelMate</Text>
        <Text style={styles.subtitle}>Your Smart Travel Companion</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.plane,
          {
            transform: [{ translateX: planeAnim }],
          },
        ]}
      >
        <Icon name="airplane" size={30} color={Colors.white} />
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading your travel data...</Text>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  plane: {
    position: 'absolute',
    top: '30%',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 12,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
});