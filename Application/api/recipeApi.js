import axios from 'axios';

const API_KEY = '8e8d414f08394bf6add2d690021e7f6a';


export const getRecipes = (ingredients) => {
    console.log(ingredients.map(item => item.name).join(', '));
    const response = axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
        params: {
            ingredients: ingredients.map(item => item.name).join(', '),
            ignorePantry: true,
            apiKey: API_KEY,
        },
        timeout: 20000,
    });
    return response;
};

export const getInstructions = (recipeId) => {
    const response = axios.get(`https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions`, {
        params: {
            stepBreakdown: true,
            apiKey: API_KEY,
        },
        timeout: 20000,
    });
    return response;
};