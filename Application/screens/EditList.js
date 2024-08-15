import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Text, FlatList,
  TouchableOpacity, ImageBackground, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';
import apiClient from '../api/apiClient';
import ScreenLayout from '../components/ScreenLayout';


export default function EditList({ route }) {
  const navigation = useNavigation();

  const [title, setTitle] = useState(route.params.title);
  const [fridgeId, setFridgeId] = useState(route.params.fridgeId);
  const [getUrl, setGetUrl] = useState(route.params.getUrl);
  const [postUrl, setPostUrl] = useState(route.params.postUrl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [List, setList] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      if (!getUrl || !fridgeId) {
        console.error('Invalid URL or fridgeId');
        setError('Invalid URL or fridgeId');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching data from:', getUrl);
        const response = await apiClient.get(getUrl, {
          params: { refrigerator_id: fridgeId },
        });
        console.log('Response data:', response.data);
        setList(response.data);
      } catch (error) {
        console.error('Error details:', error.response || error.message || error);
        setError('Failed to fetch search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (route.params?.item) {
      const newItem = route.params.item;

      const itemExists = List.some(item => item.product_name === newItem.product_name);

      console.log("value of itemExists " + itemExists);

      if (!itemExists) {
        setList((prevParameters) => [...prevParameters, {
          product_name: newItem.product_name,
          barcode: newItem.barcode,
          amount: 1
        }]);
      }
    }
  }, [route.params?.item]);



  const handleRemoveList = (item) => {
    if (item.amount == 1) {
      const newList = List.filter(currentItem => currentItem.product_name != item.product_name);
      setList(newList);
    }
    else {
      newAmount = item.amount - 1;
      updateListAmount(item.product_name, newAmount)
    }
  };

  const handleAddList = (item) => {
    newAmount = item.amount + 1;
    updateListAmount(item.product_name, newAmount);
  };


  const updateListAmount = (product_name, newAmount) => {
    setList(prevItems =>
      prevItems.map(item =>
        item.product_name === product_name ? { ...item, amount: newAmount } : item
      )
    );
  };

  const handleApplyChanges = async () => {
    try {
      await apiClient.post(postUrl, List, {
        params: {
          refrigerator_id: fridgeId
        }
      });
      navigation.navigate('Inventory', { screen: 'ShoppingList' });
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError('Failed to fetch search results. Please try again.');
    }
  }


  const renderListItem = ({ item }) => (
    <View style={styles.parameterItemContainer}>
      <View style={styles.parameterItem}>
        <TouchableOpacity
          onPress={() => handleAddList(item)}
          style={styles.parameterButton}
        >
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
        <Text style={styles.itemText}>{item.product_name}</Text>
        <TouchableOpacity
          onPress={() => handleRemoveList(item)}
          style={styles.parameterButton}
        >
          {item.amount == 1 && <Text style={styles.remove}>X</Text>}
          {item.amount != 1 && <View style={styles.minusSign} />}
        </TouchableOpacity>
      </View>
      <Text style={styles.itemText}>{item.amount}</Text>
    </View>
  );

  return (
    // <ImageBackground
    //   source={require('../assets/images/background.jpg')}
    //   style={styles.imageBackground}
    // >
    <ScreenLayout enableBackPressExit={false}>
      <View style={styles.outerContainer}>
        {!loading &&
          <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
              data={List}
              renderItem={renderListItem}
              keyExtractor={(item) => item.product_name}
              contentContainerStyle={styles.listContent}
            />
            <View style={styles.buttonContainer}>
              <CustomButton title="Save" onPress={handleApplyChanges} />
              <CustomButton
                title="Search"
                onPress={() => navigation.navigate('SearchProduct', { fridgeId: 1, from: "parametersList" })}
              />
            </View>
          </View>
        }
        {loading && (<View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>)}
      </View>
    </ScreenLayout>
    // </ImageBackground>
  );

};


const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    marginBottom: 20,
  },
  list: {
    marginTop: 16,
  },
  flatList: {
    maxHeight: '50%',
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    borderRadius: 10,
  },
  error: {
    color: 'red',
    marginVertical: 8,
  },
  container: {
    flex: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#100000',
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    width: '100%',
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  plus: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#00FF00',
  },
  remove: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#FF0000',
  },
  parameterButton: {
    padding: 5, // Increase padding to make it more touchable
  },
  minusSign: {
    width: 20, // Adjust the width to make the minus sign longer
    height: 2, // Thickness of the minus sign
    backgroundColor: '#FF0000',
  },

  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  parameterItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08062e',
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    width: '100%',
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: 0,
    width: '100%',
  },
  outerContainer: {
    flex: 1,
    paddingTop: 5,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  }
});
