import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthForm from '../components/AuthForm';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config'; // Your config file for the server URL

export default function SignupScreen() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 7500);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSignup = async () => {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (!email || !password || !firstName || !lastName) {
      setError('All fields are required.');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError('Password must be at least 6 characters long and contain both letters and numbers.');
      return;
    }

    setLoading(true);

    console.log('Email:', email);
    console.log('Password:', password);

    try {
      const response = await axios.post(`${CONFIG.SERVER_URL}/register`, {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.status === 200) {
        navigation.navigate('Login');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.log(error.response.data);
      if (error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.log('Error signing up:', error);
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
            title="Sign Up"
            fields={[
              {
                placeholder: 'Email',
                value: email,
                onChangeText: setEmail,
                keyboardType: 'email-address',
              },
              {
                placeholder: 'First Name',
                value: firstName,
                onChangeText: setFirstName,
              },
              {
                placeholder: 'Last Name',
                value: lastName,
                onChangeText: setLastName,
              },
              {
                placeholder: 'Password',
                value: password,
                onChangeText: setPassword,
                secureTextEntry: true,
              },
            ]}
            buttonText="Sign Up"
            onSubmit={handleSignup}
            footerText="Already registered?"
            footerActionText="Login"
            onFooterActionPress={() => navigation.navigate('Login')}
            loading={loading}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

      </View >
    </ImageBackground>
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