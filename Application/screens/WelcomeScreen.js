import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@rneui/base';


export default function WelcomeScreen() {
    const navigation = useNavigation();
    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.background}
        >
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>Welcome.</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.slogan}>Join </Text>
                        <Text style={{ fontSize: 30, color: '#fff', fontWeight: 'bold' }}>FoodWise</Text>
                        <Text style={styles.slogan}>,</Text>
                    </View>
                    <Text style={styles.slogan}>Your Ultimate Kitchen Companion</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.buttonText}>Lets Get Started</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Already registered? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.signupButton}>Login</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('ShoppingList',{fridgeId:1})}>
                        <Text style={styles.buttonText}>Shooping list</Text>
                    </TouchableOpacity>
                </View>

                
            </View>
        </ImageBackground>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    logo: {
        fontSize: 60,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'left'
    },
    logoContainer: {
        flex: 1,
        paddingTop: 30,
        paddingLeft: 15
    },
    slogan: {
        fontSize: 30,
        color: '#ededed',
    },
    startButton: {
        backgroundColor: '#ab73f0',
        paddingVertical: 25,
        borderRadius: 5,
        width: '80%'

    },
    buttonText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    signupContainer: {
        flexDirection: 'row',
        paddingTop: 15,
        justifyContent: 'center',
        paddingBottom: 50,

    },
    signupButton: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    signupText: {
        fontSize: 16,
        color: '#ededed',
    },
});


