import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import CONFIG from '../config'; // Your config file for the server URL

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();
    const [error, setError] = useState('');
    const { setUserId } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 7500); // Clear error after 7.5 seconds

            return () => clearTimeout(timer); // Cleanup timer on unmount
        }
    }, [error]);

    const handleLogin = async () => {

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${CONFIG.SERVER_URL}/login`, {
                email,
                password,
            });

            if (response.data.success) {
                await setUserId(response.userId);
                navigation.navigate('Inventory');
            } else {
                setError(response.data.message); // Set error message from server response
            }
        } catch (error) {
            setError('An error occurred during login. Please try again.');
            console.log('Error during login:', error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')} // Adjust the path to your background image
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
                    {/* <View style={styles.formContainer}>
                        <Text style={styles.loginText}>Login</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Login</Text>
                        </TouchableOpacity>
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')} >
                                <Text style={styles.signupButton}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View> */}
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
        resizeMode: 'cover', // or 'stretch' or 'contain'
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Adjust the opacity as needed
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 30,
    },
    // formContainer: {
    //     width: '80%',
    // },
    // loginText: {
    //     fontSize: 50,
    //     fontWeight: 'bold',
    //     marginBottom: 20,
    //     textAlign: 'left',
    //     color: '#fff',
    // },
    // input: {
    //     height: 40,
    //     borderColor: '#fff',
    //     borderWidth: 1,
    //     borderRadius: 5,
    //     paddingHorizontal: 10,
    //     marginBottom: 15,
    //     color: '#fff',
    // },
    // loginButton: {
    //     backgroundColor: '#cd87ff',
    //     paddingVertical: 12,
    //     borderRadius: 5,
    // },
    // buttonText: {
    //     color: '#fff',
    //     fontSize: 18,
    //     fontWeight: 'bold',
    //     textAlign: 'center',
    // },
    // signupText: {
    //     fontSize: 16,
    //     marginTop: 20,
    //     lineHeight: 20, // Set line height to match button height
    //     // Other styles
    // },
    // signupButton: {
    //     textAlign: 'center',
    // },
    // signupButtonText: {
    //     fontSize: 16,
    //     fontWeight: 'bold',
    //     color: '#fff', // or any other color you prefer
    //     // Other styles
    // },
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
    // signupContainer: {
    //     flexDirection: 'row',
    //     paddingTop: 15,
    //     justifyContent: 'center',

    // },
    // signupButton: {
    //     fontSize: 16,
    //     fontWeight: 'bold',
    //     color: '#fff',
    // },
    // signupText: {
    //     fontSize: 16,
    // },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default LoginScreen;

