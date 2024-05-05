import { View, Text, Button } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
    const navigation = useNavigation();
    return (
        <View>
            <Text>WelcomeScreen</Text>
            <Button
                title="Sign Up"
                onPress={() => navigation.navigate('Signup')}
            />
            <Button
                title="Login"
                onPress={() => navigation.navigate('Login')}
            />
            <Button
                title="Inventory"
                onPress={() => navigation.navigate('Inventory')}
            />
        </View>
    )
}


