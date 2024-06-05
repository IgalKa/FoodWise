import { Button } from '@rneui/themed';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import CONFIG from '../config';
import { Avatar } from '@rneui/themed';
import { CommonActions, useNavigation } from '@react-navigation/native';



const SettingsScreen = () => {

    const { userName, userLastName, clearFridgeId, clearUserName, clearUserLastName, clearUserId } = useAuth();
    const navigation = useNavigation();

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
                <Button color="warning" title="Logout" onPress={handleLogout} />
            </View>
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

});