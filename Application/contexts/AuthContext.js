import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userLastName, setUserLastName] = useState(null);
    const [fridgeId, setFridgeId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAuthData = async () => {
            const id = await AsyncStorage.getItem('userId');
            const fridge = await AsyncStorage.getItem('fridgeId');
            const name = await AsyncStorage.getItem('userName');
            const lastName = await AsyncStorage.getItem('userLastName');
            if (id) {
                setUserId(id);
            }
            if (fridge) {
                setFridgeId(fridge);
            }
            if (name) {
                setUserName(name);
            }
            if (lastName) {
                setUserLastName(lastName);
            }
            setIsLoading(false);
        };
        fetchAuthData();
    }, []);

    const saveUserId = async (id) => {
        setUserId(id);
        await AsyncStorage.setItem('userId', id);
    };

    const saveFridgeId = async (id) => {
        if (id === null) {
            await AsyncStorage.removeItem('fridgeId');
        } else {
            await AsyncStorage.setItem('fridgeId', id);
        }
        setFridgeId(id);
    };

    const saveUserName = async (name) => {
        setUserName(name);
        await AsyncStorage.setItem('userName', name);
    };

    const saveUserLastName = async (lastName) => {
        setUserLastName(lastName);
        await AsyncStorage.setItem('userLastName', lastName);
    };

    const clearUserId = async () => {
        setUserId(null);
        await AsyncStorage.removeItem('userId');
    };

    const clearFridgeId = async () => {
        setFridgeId(null);
        await AsyncStorage.removeItem('fridgeId');
    };

    const clearUserName = async () => {
        setUserName(null);
        await AsyncStorage.removeItem('userName');
    };

    const clearUserLastName = async () => {
        setUserLastName(null);
        await AsyncStorage.removeItem('userLastName');
    };

    return (
        <AuthContext.Provider value={{ userId, fridgeId, userName, userLastName, setUserId: saveUserId, setFridgeId: saveFridgeId, setUserName: saveUserName, setUserLastName: saveUserLastName, clearUserId, clearFridgeId, clearUserName, clearUserLastName, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);