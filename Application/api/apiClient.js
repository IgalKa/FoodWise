import axios from 'axios';
import CONFIG from '../config';


const apiClient = axios.create({
    baseURL: 'https://michaelshu.pythonanywhere.com', 
    timeout: 20000,
});


export default apiClient;