import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import CONFIG from '../config';
import { Avatar } from '@rneui/themed';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import TextInputModal from '../components/TextInputModal';



const SettingsScreen = () => {

    const { userName, userLastName, clearFridgeId, clearUserName, clearUserLastName, clearUserId } = useAuth();
    const navigation = useNavigation();
    const [isEmailModalVisible, setEmailModalVisible] = useState(false);
    const [isPassModalVisible, setPassModalVisible] = useState(false);
    const [textField, setTextField] = useState("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;


    const handleLogout = async () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            })
        );
        await clearFridgeId();
        await clearUserId();
        await clearUserName();
        await clearUserLastName();
    }

    const handleEmailChange = async () => {

        console.log("Im before check");

        if (!emailRegex.test(textField)) {
            Alert.alert("", 'Please enter a valid email address.');
            return;
        }

        console.log("Im past check");

        try {
            //server request to change email
            if (Response.status === 200)
                Alert.alert("Email changed succesfully");
        }
        catch (err) {
            Alert.alert("There was a problem, try again.");
        }
    }

    const handlePasswordChange = async () => {

        if (!passwordRegex.test(textField)) {
            Alert.alert("", 'Password must be at least 6 characters long and contain both letters and numbers.');
            return;
        }

        try {
            //server request to change email
            if (Response.status === 200)
                Alert.alert("Password changed succesfully");
        }
        catch (err) {
            Alert.alert("There was a problem, try again.");
        }
    }

    const handleModalClose = () => {
        setTextField("");
        setEmailModalVisible(false);
        setPassModalVisible(false);
    }

    const fullUserName = `${userName || ''} ${userLastName || ''}`.trim();
    const initials = `${userName ? userName[0] : ''}${userLastName ? userLastName[0] : ''}`.toUpperCase();

    return (
        <ScreenLayout>
            <View style={styles.container}>
                <Avatar
                    size={100}
                    rounded
                    title={initials}
                    containerStyle={{ backgroundColor: "#465881" }}
                />
                <Text style={styles.name}>Hey, {fullUserName}</Text>
                <View style={styles.buttonContainer}>
                    <Button mode="contained" onPress={() => setEmailModalVisible(true)}>Change Email</Button>
                </View>
                <View style={styles.buttonContainer}>
                    <Button mode="contained" onPress={() => setPassModalVisible(true)}>Change Password</Button>
                </View>
                <View style={styles.logoutContainer}>
                    <Button mode="contained-tonal" onPress={handleLogout}>Logout</Button>
                </View>
            </View>
            <TextInputModal
                isVisible={isEmailModalVisible}
                onClose={handleModalClose}
                newName={textField}
                setNewName={setTextField}
                onAction={handleEmailChange}
                title={"Change Email"}
                actionButtonTitle={"Save"}
            />
            <TextInputModal
                isVisible={isPassModalVisible}
                onClose={handleModalClose}
                newName={textField}
                setNewName={setTextField}
                onAction={handlePasswordChange}
                title={"Change Password"}
                actionButtonTitle={"Save"}
            />
        </ScreenLayout>

    );
};


export default SettingsScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        alignItems: 'center',
    },
    name: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#fff',
        paddingTop: 5,
        paddingBottom: 5,
    },
    buttonContainer: {
        marginVertical: 15,
        width: '80%',
        alignItems: 'center',
    },
    logoutContainer: {
        flex: 1,
        justifyContent: "flex-end",
        marginBottom: 30,
    },

});