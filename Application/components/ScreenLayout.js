import React from 'react';
import { StyleSheet, ImageBackground, BackHandler, View } from 'react-native';
import { useDoubleBackPressExit } from '../hooks/DoubleBackExit';

function ScreenLayout({ children }) {

    useDoubleBackPressExit(() => {
        BackHandler.exitApp();
    });

    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')} // Adjust the path to your background image
            style={styles.background}
        >
            <View style={styles.container}>
                {children}
            </View>
        </ImageBackground>
    );
}

export default ScreenLayout;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    background: {
        flex: 1,
        resizeMode: 'cover', // or 'stretch' or 'contain'
    },
});