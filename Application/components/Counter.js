import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Counter = ({ initialValue = 0 }) => {
    const [count, setCount] = useState(initialValue);
    const timerRef = useRef(null);

    const increase = () => {
        setCount(prevCount => prevCount + 1);
    };

    const decrease = () => {
        setCount(prevCount => {
            const newCount = Math.max(prevCount - 1, 0);
            return newCount;
        });
    };

    const startDecreasing = () => {
        timerRef.current = setInterval(() => {
            if (count > 0) {
                decrease();
            }
        }, 100);
    };

    const stopDecreasing = () => {
        clearInterval(timerRef.current);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: count === 0 ? '#ccc' : '#465881' }]}
                onPressIn={startDecreasing}
                onPressOut={stopDecreasing}
                onPress={decrease}
                disabled={count === 0}
            >
                <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.count}>{count}</Text>
            <TouchableOpacity style={styles.button} onPress={increase}>
                <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#465881',
        borderRadius: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 25,
        fontWeight: "bold",
    },
    count: {
        fontSize: 30,
        marginHorizontal: 40,
        fontWeight: "bold",
    },
});

export default Counter;