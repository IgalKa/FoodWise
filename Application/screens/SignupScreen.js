import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SignupScreen() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigation = useNavigation();

  const handleLogin = () => {
    // Add your login logic here
    console.log('Email:', email);
    console.log('Password:', password);
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
          <View style={styles.formContainer}>
            <Text style={styles.loginText}>Sign Up</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              keyboardType="default"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.signButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Already registered? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signupButton}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  formContainer: {
    width: '80%',
  },
  loginText: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: '#fff',
  },
  signButton: {
    backgroundColor: '#cd87ff',
    paddingVertical: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signupText: {
    fontSize: 16,
    marginTop: 20,
    lineHeight: 20, // Set line height to match button height
    // Other styles
  },
  signupButton: {
    textAlign: 'center',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff', // or any other color you prefer
    // Other styles
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
  signupContainer: {
    flexDirection: 'row',
    paddingTop: 15,
    justifyContent: 'center',

  },
  signupButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  signupText: {
    fontSize: 16,
  },
});