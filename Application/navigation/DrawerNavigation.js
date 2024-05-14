import 'react-native-gesture-handler';
import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import InventoryScreen from '../screens/InventoryScreen';
import WelcomeScreen from '../screens/WelcomeScreen';



const DrawerNavigator = () => {

    const Drawer = createDrawerNavigator()


    return (
        <Drawer.Navigator screenOptions={{
            drawerStyle: {
                backgroundColor: '#c6cbef',
                width: 240,
            },
            headerShown: true,
            headerTransparent: false,
            headerStyle: {
                backgroundColor: '#505a91',

            },
            headerTintColor: '#fff',
        }}>
            <Drawer.Screen name='InventoryScreen' component={InventoryScreen} options={{
                drawerLabel: 'Inventory',
                headerTitle: 'Inventory',
            }} />
            <Drawer.Screen name='Welcome' component={WelcomeScreen} options={{
                drawerLabel: 'Welcome',
                headerTitle: 'Welcome',
            }} />
        </Drawer.Navigator>
    )
}

export default DrawerNavigator