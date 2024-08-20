import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const InitialLoadingScreen = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#fff" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default InitialLoadingScreen;