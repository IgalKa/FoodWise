import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import CONFIG from '../config';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();
    const [error, setError] = useState('');
    const { setUserId, clearFridgeId, setUserName, setUserLastName } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 7500); // Clear error after 7.5 seconds

            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleLogin = async () => {

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${CONFIG.SERVER_URL}/user_login`, {
                email,
                password,
            });

            if (response.status === 200) {
                await setUserId(response.data[0].toString());
                await setUserName(response.data[1]);
                await setUserLastName(response.data[2]);
                await clearFridgeId();
                navigation.navigate('Inventory');
            } else {
                setError(response.data.message);
            }
        } catch (error) {

            if (error.response && error.response.data && error.response.data.error) {
                setError(error.response.data.error);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.log('Error logging in:', error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.background}
        >
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>FoodWise</Text>
            </View>

            <View style={styles.container}>

                <View style={styles.overlay}>
                    <AuthForm
                        title="Login"
                        fields={[
                            {
                                placeholder: 'Email',
                                value: email,
                                onChangeText: setEmail,
                                keyboardType: 'email-address',
                            },
                            {
                                placeholder: 'Password',
                                value: password,
                                onChangeText: setPassword,
                                secureTextEntry: true,
                            },
                        ]}
                        buttonText="Login"
                        onSubmit={handleLogin}
                        footerText="Don't have an account?"
                        footerActionText="Sign Up"
                        onFooterActionPress={() => navigation.navigate('Signup')}
                        loading={loading}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

            </View >
        </ImageBackground >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 30,
    },
    logoContainer: {
        flex: 0.25,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    logo: {
        fontWeight: 'bold',
        fontSize: 30,
        color: '#fff',
        paddingLeft: 15,
        marginTop: 15,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default LoginScreen;

