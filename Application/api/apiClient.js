import axios from 'axios';
import CONFIG from '../config';


const apiClient = axios.create({
    baseURL: 'http://10.0.0.8:12345', 
    timeout: 20000,
});


export default apiClient;