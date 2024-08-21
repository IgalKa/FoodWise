import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userLastName, setUserLastName] = useState(null);
    const [fridgeId, setFridgeId] = useState(null);
    const [userId, setUserId] = useState(null)
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAuthData = async () => {
            try {
                const [token, fridge, name, lastName, user] = await Promise.all([
                    AsyncStorage.getItem('token'),
                    AsyncStorage.getItem('fridgeId'),
                    AsyncStorage.getItem('userName'),
                    AsyncStorage.getItem('userLastName'),
                    AsyncStorage.getItem('userId')
                ]);

                if (token) {
                    setToken(token);
                }
                if (fridge) {
                    setFridgeId(fridge);
                }
                if (user) {
                    setUserId(user);
                }
                if (name) {
                    setUserName(name);
                }
                if (lastName) {
                    setUserLastName(lastName);
                }
            } catch (e) {
                console.error('Failed to retrieve auth data:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAuthData();
    }, []);

    const saveToken = async (token) => {
        setToken(token);
        await AsyncStorage.setItem('token', token);
    };

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

    const clearToken = async () => {
        setToken(null);
        await AsyncStorage.removeItem('token');
    };

    const clearUserId = async () => {
        setUserId(null)
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
        <AuthContext.Provider value={{ token: token, userId: userId, fridgeId, userName, userLastName, setToken: saveToken, setUserId: saveUserId, setFridgeId: saveFridgeId, setUserName: saveUserName, setUserLastName: saveUserLastName, clearToken: clearToken, clearUserId: clearUserId, clearFridgeId, clearUserName, clearUserLastName, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);