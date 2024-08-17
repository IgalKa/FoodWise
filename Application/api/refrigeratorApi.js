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
  const response = apiClient.get('/get_refrigerator_content_expired', {
    params: { refrigerator_id: fridgeId }
  });
  return response;
};


export const getStatistics = (fridgeId, startDate, endDate) => {
  const response = apiClient.get('/get_statistics', {
    params: {
      refrigerator_id: fridgeId,
      start_date: startDate,
      end_date: endDate
    }
  });
  return response;
};


export const getAlertDate = (fridgeId, productName) => {
  console.log(fridgeId);
  console.log(productName);
  const response = apiClient.get('/get_product_alert_date', {
    params: {
      refrigerator_id: fridgeId,
      product_name: productName,
    }
  });
  return response;
}


export const updateAlertDate = (fridgeId, productName, alertDate) => {
  const response = apiClient.post('/update_product_alert_date', {
    refrigerator_id: fridgeId,
    product_name: productName,
    alert_date: alertDate
  });
  return response;
}


export const updateAlertAndQuantity = (fridgeId, productName, alertDate, quantity) => {
  const response = apiClient.post('/update_product_alert_date', {
    refrigerator_id: fridgeId,
    product_name: productName,
    alert_date: alertDate,
    product_quantity: quantity,
  });
  return response;
}

export const addProduct = (barcode, fridgeId) => {
  const response = apiClient.post('/add_product_with_app', {
    refrigerator_id: fridgeId,
    barcode: barcode,
  });
  return response;
}


