import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, Modal, ImageBackground, TouchableOpacity, LinearGradient } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Share from 'react-native-share';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../contexts/AuthContext';
import { fetchSavedShoppingList } from '../api/ShoppingListApi';
import NoFridge from '../components/NoFridge';
import ScreenLayout from '../components/ScreenLayout';
import ShoppingIcon from '../assets/images/shopping-basket.png';
import SparklesIcon from '../assets/images/sparkles.png';
import SettingsIcon from '../assets/images/settings.png';




export default function ShoppingList({ route }) {
  const { fridgeId } = useAuth();
  const navigation = useNavigation();


  const [modalVisible, setModalVisible] = useState(false);

  const [ShoppingList, setShoppingList] = useState([]);


  const handleShoppingList = async () => {
    try {
      const response = await fetchSavedShoppingList(fridgeId);
      setShoppingList(response.data);
      setModalVisible(true);
    }
    catch (error) {
      console.error('Error fetching search results:', error);
    }
  };


  const handleShareList = () => {
    const listString = ShoppingList.map(item => `${item.product_name}, ${item.amount}`).join('\n');

    const shareOptions = {
      title: 'My List',
      message: listString,
    };

    Share.open(shareOptions)
      .then((res) => console.log(res))
      .catch((err) => err && console.log(err));
  };


  const renderShoppingItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.product_name}</Text>
      <Text style={styles.itemText}>{item.amount}</Text>
    </View>
  );

  return (
    // <ImageBackground
    //   source={require('../assets/images/background.jpg')}
    //   style={styles.imageBackground}
    // // >
    <ScreenLayout>
      <View style={styles.container}>
        {fridgeId !== null &&
          <View>
            <CustomButton
              title="Saved shopping list"
              onPress={handleShoppingList}
              icon={ShoppingIcon}
            />

            <CustomButton
              title="Generate shopping list"
              icon={SparklesIcon}
              onPress={() => navigation.navigate('EditList', {
                getUrl: "/generate_initial_shopping_list",
                postUrl: "/save_shopping_list",
                title: "Shopping list creation",
                fridgeId: 1
              })}
            />

            <CustomButton
              title="Edit shopping list preferences"
              icon={SettingsIcon}
              onPress={() => navigation.navigate('EditList', {
                getUrl: "/get_refrigerator_parameters",
                postUrl: "/update_refrigerator_parameters",
                title: "Desired products list",
                fridgeId: 1
              })}
            />


            <Modal
              animationType="slide"
              transparent={false}
              visible={modalVisible}
              onRequestClose={() => { setModalVisible(false); }}
            >
              <ImageBackground
                source={require('../assets/images/background.jpg')}
                style={styles.imageBackground}
              >
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Shopping List</Text>
                  <FlatList
                    data={ShoppingList}
                    renderItem={renderShoppingItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                  />
                  <View style={styles.buttonContainer}>
                    <CustomButton title="Close" onPress={() => setModalVisible(false)} />
                    <CustomButton title="Share" onPress={handleShareList} />
                  </View>
                </View>
              </ImageBackground>
            </Modal>
          </View>
        }

        {fridgeId === null &&
          <NoFridge />
        }
      </View>
    </ScreenLayout>

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
  modalContainer: {
    flex: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  modalTitle: {
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
    backgroundColor: '#100000',
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: 0,
    width: '100%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center',     // Centers content horizontally
  },
  title: {
    fontSize: 20,
    color: '#fff', // White color for the text
    textAlign: 'center', // Centers text horizontally
  },
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
  },
});

