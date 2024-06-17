import apiClient from './apiClient';


export const userLogin = (email, password) => {
    const response = apiClient.post('/user_login', { email, password });
    return response;
};

export const userSignup = (email, password, firstName, lastName) => {
    const response = apiClient.post('/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
    });
    return response;
};