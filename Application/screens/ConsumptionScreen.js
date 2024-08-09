import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, View, ScrollView, Dimensions, Image } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { getRefrigeratorContents } from '../api/refrigeratorApi';
import { useAuth } from '../contexts/AuthContext';
import {
    LineChart,
    BarChart,
    PieChart,
    ProgressChart,
    ContributionGraph,
    StackedBarChart
} from "react-native-chart-kit";
import { SegmentedButtons, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import calendarIcon from '../assets/images/calendar-svg.png';

const screenWidth = Dimensions.get('window').width;

const generateData = () => {
    const labels = [];
    const data = [];
    for (let i = 1; i <= 10; i++) {
        labels.push(`Day kfjk sdkj  ksjd ksdj ${i}`);
        data.push(Math.floor(Math.random() * 100));
    }
    return { labels, data };
};

const chartData = generateData();

const chartWidth = Math.max(screenWidth - 25, chartData.labels.length * 150); // Adjust width based on number of labels


const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
};




const ConsumptionScreen = () => {

    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState(true);
    const [sortedData, setSortedData] = useState(chartData.data);
    const { fridgeId } = useAuth();
    const [startDate, setStartDate] = useState(new Date());
    const [showStart, setShowStart] = useState(false);
    const [endDate, setEndDate] = useState(new Date());
    const [showEnd, setShowEnd] = useState(false);

    const onStartDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || startDate;
        setShowStart(Platform.OS === 'ios');
        setStartDate(currentDate);
    };

    const onEndDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || endDate;
        setShowEnd(Platform.OS === 'ios');
        setEndDate(currentDate);
    };


    const showDatepicker = (start) => {
        if (start)
            setShowStart(true);
        else
            setShowEnd(true);
    };

    useEffect(() => {
        const sorted = [...chartData.data];

        if (value) {
            sorted.sort((a, b) => b - a);
        } else {
            sorted.sort((a, b) => a - b);
        }

        setSortedData(sorted);
    }, [value]);

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                data: sortedData,
            },
        ],
    };

    return (
        <ScreenLayout>
            <ScrollView>
                <View style={styles.container}>
                    <View style={styles.rowContainer}>
                        <Button icon={({ size, color }) => (
                            <Image source={calendarIcon} style={{ width: size, height: size, tintColor: color }} />
                        )} mode="contained" onPress={() => showDatepicker(true)}>
                            Pick Start Date
                        </Button>
                        <Button icon={({ size, color }) => (
                            <Image source={calendarIcon} style={{ width: size, height: size, tintColor: color }} />
                        )} mode="contained" onPress={() => showDatepicker(false)}>
                            Pick End Date
                        </Button>
                    </View>
                    {showStart && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={startDate}
                            mode="date"
                            display="spinner"
                            onChange={onStartDateChange}
                        />
                    )}
                    {showEnd && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={endDate}
                            mode="date"
                            display="spinner"
                            onChange={onEndDateChange}
                        />
                    )}
                    <View style={styles.rowContainer}>
                        <Text style={styles.dateText}>
                            Start Date: {startDate.toLocaleDateString()}
                        </Text>
                        <Text style={styles.dateText}>
                            End Date: {endDate.toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.applyContainer}>
                        <Button mode="contained" onPress={showDatepicker} style={styles.applyButton}>
                            Apply
                        </Button>
                    </View>
                    <Text style={styles.titleText}>Products Consumption</Text>
                    <SegmentedButtons
                        value={value}
                        onValueChange={setValue}
                        uncheckedColor={{
                            textColor: '#fff',
                        }}
                        buttons={[
                            {
                                value: true,
                                label: 'Most Used',
                                uncheckedColor: '#fff',
                            },
                            {
                                value: false,
                                label: 'Least Used',
                                uncheckedColor: '#fff',
                            },
                        ]}
                    />
                    <View style={styles.chartContainer}>
                        <ScrollView horizontal style={styles.chartWrapper}>
                            <LineChart
                                data={data}
                                width={chartWidth}
                                height={220}
                                chartConfig={chartConfig}
                                style={{
                                    marginVertical: 15,
                                    borderRadius: 16,
                                    marginHorizontal: 2,
                                }}
                                bezier
                            />
                        </ScrollView>
                    </View>
                    <View style={styles.chartContainer}>
                        <ScrollView horizontal style={styles.chartWrapper}>
                            <LineChart
                                data={data}
                                width={chartWidth}
                                height={220}
                                chartConfig={chartConfig}
                                style={{
                                    marginVertical: 15,
                                    borderRadius: 16,
                                    marginHorizontal: 2,
                                }}
                                bezier
                            />
                        </ScrollView>
                    </View>
                    <View style={styles.chartContainer}>
                        <ScrollView horizontal style={styles.chartWrapper}>
                            <LineChart
                                data={data}
                                width={chartWidth}
                                height={220}
                                chartConfig={chartConfig}
                                style={{
                                    marginVertical: 15,
                                    borderRadius: 16,
                                    marginHorizontal: 2,
                                }}
                                bezier
                            />
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    chartContainer: {
        flexDirection: 'row',
    },
    yAxisContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 10,
    },
    yAxisLabel: {
        fontSize: 12,
        color: '#000',
        marginBottom: 10,
    },
    chartWrapper: {
        flex: 1,
    },
    dateText: {
        marginTop: 5,
        fontSize: 18,
        color: '#ededed',
        marginBottom: 15,

    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 25,
    },
    applyButton: {
        width: '90%',
    },
    applyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 10,
        marginBottom: 10,
    },
    titleText: {
        color: '#ededed',
        fontWeight: "bold",
        marginVertical: 10,
        fontSize: 15,
    },
});


export default ConsumptionScreen;