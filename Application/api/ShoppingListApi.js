import apiClient from "./apiClient";


export const fetchSavedShoppingList = (fridgeId) => {
    const response = apiClient.get('/fetch_saved_shopping_list',{
        params: { refrigerator_id:fridgeId },
    });
    return response;
}








