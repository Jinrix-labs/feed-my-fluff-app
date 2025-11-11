import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const AnimatedSplashScreen = ({ onAnimationComplete }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1.3)).current;
    const pressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initial fade in with scale down (paw coming towards screen)
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // After landing, do the "press" effect
            Animated.sequence([
                // Press down
                Animated.spring(pressAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                }),
                // Release back
                Animated.spring(pressAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // After press animation completes, wait then fade out
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(fadeAnim, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleAnim, {
                            toValue: 0.8,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        onAnimationComplete?.();
                    });
                }, 2000); // Hold for 2 seconds after press animation
            });
        });

        return () => {
            // Cleanup if component unmounts
            fadeAnim.stopAnimation();
            scaleAnim.stopAnimation();
            pressAnim.stopAnimation();
        };
    }, [fadeAnim, scaleAnim, pressAnim, onAnimationComplete]);

    // Interpolate the press animation for subtle scale change
    const pressScale = pressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.95], // Slightly smaller when pressed
    });

    // Combine scale animations
    const combinedScale = Animated.multiply(scaleAnim, pressScale);

    return (
        <View style={styles.container}>
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [
                        { scale: combinedScale },
                    ],
                }}
            >
                <Image
                    source={require('../../assets/images/splash-paw.png')}
                    style={styles.pawPrint}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pawPrint: {
        width: 400,
        height: 400,
    },
});

export default AnimatedSplashScreen;