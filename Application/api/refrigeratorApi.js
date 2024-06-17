import apiClient from './apiClient';


export const getRefrigeratorContents = (fridgeId) => {
  const response = apiClient.get(`/refrigerator_contents`, {
    params: { refrigerator_id: fridgeId }
  });
  return response;
};

export const getLinkedRefrigerators = (userId) => {
  const response = apiClient.get('/linked_refrigerators', {
    params: { user_id: userId }
  });
  return response;
};

export const updateRefrigeratorName = (newName, renameId, userId) => {
  const response = apiClient.post('/update_refrigerator_name', {
    new_name: newName,
    refrigerator_id: renameId,
  }, {
    params: { user_id: userId },
  });
  console.log(response);
  return response;
};

