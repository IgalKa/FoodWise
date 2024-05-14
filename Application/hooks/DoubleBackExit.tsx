import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect from React Navigation
import { BackHandler, Platform, ToastAndroid } from 'react-native';

let backPressedCount = 0;

export const useDoubleBackPressExit = (exitHandler: () => void) => {
  if (Platform.OS === 'ios') return;

  useFocusEffect(() => {
    const backHandler = () => {
      if (backPressedCount === 1) {
        exitHandler();
        return true;
      } else {
        backPressHandler();
        return true;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => subscription.remove();
  });
};

const backPressHandler = () => {
  if (backPressedCount < 1) {
    backPressedCount += 1;
    ToastAndroid.show('Tap again to exit', ToastAndroid.SHORT);
    setTimeout(() => {
      backPressedCount = 0;
    }, 2000);
  }
};
