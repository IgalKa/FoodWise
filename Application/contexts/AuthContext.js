import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [fridgeId, setFridgeId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAuthData = async () => {
            const id = await AsyncStorage.getItem('userId');
            const fridge = await AsyncStorage.getItem('fridgeId');
            const name = await AsyncStorage.getItem('userName');
            if (id) {
                setUserId(id);
            }
            if (fridge) {
                setFridgeId(fridge);
            }
            if (name) {
                setUserName(name);
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

    const clearUserId = async () => {
        setUserId(null);
        await AsyncStorage.removeItem('userId');
    };

    const clearFridgeId = async () => {
        setFridgeId(null);
        await AsyncStorage.removeItem('fridgeId');
    };

    const clearUserName = async () => {
        setuUserName(null);
        await AsyncStorage.removeItem('userName');
    };

    return (
        <AuthContext.Provider value={{ userId, fridgeId, userName, setUserId: saveUserId, setFridgeId: saveFridgeId, setUserName: saveUserName, clearUserId, clearFridgeId, clearUserName, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);