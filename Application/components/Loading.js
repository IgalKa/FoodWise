import { View,ActivityIndicator } from "react-native";

const Loading = () => {
    return (
        <View style={styles.centeredView}>
            < ActivityIndicator size="large" color="#fff" />
        </View>
    );
}


const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center', // Centers content vertically
        alignItems: 'center',     // Centers content horizontally
    },
});

export default Loading;