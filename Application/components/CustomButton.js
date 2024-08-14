// CustomButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

const CustomButton = ({ onPress, title, style, icon }) => {
  return (
    // <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    //   <Text style={styles.buttonText}> {title}</Text>
    // </TouchableOpacity>
    <View style={styles.container}>
      <Button
        mode="contained-tonal"
        onPress={onPress}
        labelStyle={{ fontSize: 18 }}
        icon={icon}
      >
        {title}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ab73f0',
    padding: 16,
    borderRadius: 20,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    marginVertical: 10,
  }
});

export default CustomButton;