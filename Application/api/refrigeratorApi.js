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

export const getExpiringProducts = (fridgeId) => {
  const response = apiClient.get('/get_refrigerator_content_by_alert_date_passed', {
    params: { refrigerator_id: fridgeId }
  });
  return response;
};


export const getAlertDate = (fridgeId,productName) => {
  console.log(fridgeId);
  console.log(productName);
  const response = apiClient.get('/get_product_alert_date', {
    params: { 
              refrigerator_id: fridgeId ,
              product_name: productName,
            }
  });
  return response;
}


export const updateAlertDate = (fridgeId,productName,alertDate) => {
  const response = apiClient.post('/update_product_alert_date', {
      refrigerator_id: fridgeId,
      product_name: productName,
      alert_date: alertDate
  });
  return response;
}


