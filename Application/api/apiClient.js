import axios from 'axios';
import CONFIG from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';


const apiClient = axios.create({
    // baseURL: 'http://10.100.102.7:12345',
    baseURL: 'https://foodwise-5jxeyknkuq-uc.a.run.app',
    timeout: 20000,
});

apiClient.interceptors.request.use(
    async config => {
        try {
            // Check if the request is not for login
            if (config.url !== '/user_login') {
                // Retrieve the token from AsyncStorage
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('Error fetching token from AsyncStorage:', error);
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);


export default apiClient;