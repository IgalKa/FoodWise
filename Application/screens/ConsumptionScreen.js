import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, View, ScrollView, Dimensions, Image, Alert, Animated } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { getStatistics } from '../api/refrigeratorApi';
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
import NoFridge from '../components/NoFridge';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
};

const minDate = new Date(2023, 0, 1);
const maxDate = new Date;


const ConsumptionScreen = () => {

    const currentDate = new Date();
    const oneMonthEarlier = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    const [loading, setLoading] = useState(false);
    const [entrySort, setEntrySort] = useState(true);
    const [exitSort, setExitSort] = useState(true);
    const [sortedEntryData, setSortedEntryData] = useState(null);
    const [sortedExitData, setSortedExitData] = useState(null);
    const { fridgeId } = useAuth();
    const [startDate, setStartDate] = useState(oneMonthEarlier);
    const [showStart, setShowStart] = useState(false);
    const [endDate, setEndDate] = useState(new Date());
    const [showEnd, setShowEnd] = useState(false);
    const [chartEntryWidth, setChartEntryWidth] = useState(screenWidth - 25);
    const [chartExitWidth, setChartExitWidth] = useState(screenWidth - 25);
    const fadeAnimEntry = useRef(new Animated.Value(0)).current; // Initial opacity of 0 for entry chart
    const fadeAnimExit = useRef(new Animated.Value(0)).current;  // Initial opacity of 0 for exit chart




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
        if (sortedEntryData !== null) {
            if (entrySort) {
                setSortedEntryData(sortProducts(sortedEntryData, 'desc'));
            } else {
                setSortedEntryData(sortProducts(sortedEntryData, 'asc'));
            }
        }

    }, [entrySort]);


    useEffect(() => {
        if (sortedExitData !== null) {
            if (exitSort) {
                setSortedExitData(sortProducts(sortedExitData, 'desc'));
            } else {
                setSortedExitData(sortProducts(sortedExitData, 'asc'));
            }
        }

    }, [exitSort]);



    function sortProducts(data, sortOrder = 'desc') {

        const productNames = data.labels;
        const quantities = data.datasets[0].data;

        console.log("in function exit data:", sortedEntryData);
        console.log("in function entry data", sortedExitData);


        const sortedPairs = quantities
            .map((quantity, index) => ({ quantity, product_name: productNames[index] }))
            .sort((a, b) => {
                return sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
            });


        const sortedQuantities = sortedPairs.map(pair => pair.quantity);
        const sortedProductNames = sortedPairs.map(pair => pair.product_name);

        return {
            labels: sortedProductNames,
            datasets: [
                {
                    data: sortedQuantities,
                },
            ],
        };
    }

    const transformData = (data) => {

        const labels = data.map(item => item.product_name);
        const dataPoints = data.map(item => item.quantity);
        return {
            labels,
            datasets: [
                {
                    data: dataPoints,
                },
            ],
        };
    };

    const fetchStatistics = async () => {
        try {
            const response = await getStatistics(fridgeId, startDate.toLocaleDateString('en-CA'), endDate.toLocaleDateString('en-CA'));

            if (response.status === 200) {
                let entryData = response.data.entry_statistics.products;
                let exitData = response.data.exit_statistics.products
                console.log("in fetch exit data:", exitData);
                console.log("in fetch entry data", entryData);
                console.log(response.data);
                if (entryData !== undefined) {
                    if (entryData.length > 0) {
                        const transformedData = transformData(entryData);
                        setSortedEntryData(sortProducts(transformedData));
                        entryData = sortProducts(transformedData);
                    }
                    else
                        setSortedEntryData(null);

                }
                if (exitData !== undefined) {
                    if (exitData.length > 0) {
                        const transformedData = transformData(exitData);
                        setSortedExitData(sortProducts(transformedData));
                        exitData = sortProducts(transformedData);
                    }
                    else
                        setSortedExitData(null);

                }

                if ((entryData === undefined && exitData === undefined)) {
                    setSortedEntryData(null);
                    setSortedExitData(null);
                    return null;
                }

                console.log("in fetch exit data:", exitData);
                console.log("in fetch entry data", entryData);

                return {
                    entry: entryData,
                    exit: exitData,
                };

            }

        } catch (error) {
            console.log('Error fetching data:', error);
            console.log(fridgeId);
            return null
        }
    };


    const handleApply = async () => {
        if (startDate > endDate) {
            Alert.alert("Error", "Start date cant be after end date");
        }
        setLoading(true);
        const sortedData = await fetchStatistics();
        // console.log("sorted data in handleApply is:", sortedData);
        //console.log(sortedData.entry.length == 0);
        if (sortedData) {
            if (sortedData.entry !== null && sortedData.entry.length != 0 && sortedData.entry.labels.length > 0) {
                console.log("im in entry width");
                const newEntryWidth = Math.max(screenWidth - 25, sortedData.entry.labels.length * 150);
                console.log("new entry width", newEntryWidth);
                setChartEntryWidth(newEntryWidth);
            }
            if (sortedData.exit !== null && sortedData.exit.length != 0 && sortedData.exit.labels.length > 0) {
                const newExitWidth = Math.max(screenWidth - 25, sortedData.exit.labels.length * 150);
                setChartExitWidth(newExitWidth);
            }
            // console.log("exit width:", chartExitWidth);
            // console.log("exit length:", sortedData.exit.labels.length);
            // console.log("entry width:", chartEntryWidth);
            // console.log("entry length:", sortedData.entry.length);
            // console.log("entry data:", sortedData.entry.labels.length);
        }
        //console.log(Math.max(screenWidth - 25, sortedData.entry.labels.length * 150));
        console.log("entry width is:", chartEntryWidth);
        setLoading(false);
    };

    useEffect(() => {
        console.log("Updated entry width:");
    }, [chartEntryWidth]);


    const animateChart = (fadeAnim) => {
        fadeAnim.setValue(0); // Reset the opacity to 0 before starting the animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        if (sortedEntryData) {
            animateChart(fadeAnimEntry);
        }
    }, [sortedEntryData]);

    useEffect(() => {
        if (sortedExitData) {
            animateChart(fadeAnimExit);
        }
    }, [sortedExitData]);


    return (
        <ScreenLayout>
            {fridgeId && (<ScrollView style={styles.scrollContainer}>
                <View style={styles.container}>
                    <View style={styles.rowContainer}>
                        <Button icon={({ size, color }) => (
                            <Image source={calendarIcon} style={{ width: size, height: size, tintColor: color }} />
                        )} mode="contained-tonal" onPress={() => showDatepicker(true)}>
                            From: {startDate.toLocaleDateString()}
                        </Button>
                        <Button icon={({ size, color }) => (
                            <Image source={calendarIcon} style={{ width: size, height: size, tintColor: color }} />
                        )} mode="contained-tonal" onPress={() => showDatepicker(false)}>
                            To: {endDate.toLocaleDateString()}
                        </Button>
                    </View>
                    {showStart && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={startDate}
                            mode="date"
                            display="spinner"
                            onChange={onStartDateChange}
                            minimumDate={minDate}
                            maximumDate={maxDate}
                        />
                    )}
                    {showEnd && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={endDate}
                            mode="date"
                            display="spinner"
                            onChange={onEndDateChange}
                            minimumDate={minDate}
                            maximumDate={maxDate}
                        />
                    )}
                    {/* <View style={styles.rowContainer}>
                        <Text style={styles.dateText}>
                            Start Date: {startDate.toLocaleDateString()}
                        </Text>
                        <Text style={styles.dateText}>
                            End Date: {endDate.toLocaleDateString()}
                        </Text>
                    </View> */}
                    <View style={styles.applyContainer}>
                        <Button mode="contained-tonal" onPress={handleApply} style={styles.applyButton}>
                            Get Consumption Data
                        </Button>
                    </View>
                    {!loading && (sortedEntryData !== null || sortedExitData !== null) && (
                        <View style={styles.container}>
                            <Text style={styles.titleText}>Added Products</Text>
                            {sortedEntryData !== null && (
                                <Animated.View style={{ ...styles.container, opacity: fadeAnimEntry }}>
                                    <SegmentedButtons
                                        value={entrySort}
                                        onValueChange={setEntrySort}
                                        uncheckedColor={{
                                            textColor: '#fff',
                                        }}
                                        buttons={[
                                            {
                                                value: true,
                                                label: 'Highest To Lowest',
                                                uncheckedColor: '#fff',
                                            },
                                            {
                                                value: false,
                                                label: 'Lowest To Highest',
                                                uncheckedColor: '#fff',
                                            },
                                        ]}
                                    />

                                    <View style={styles.chartContainer}>
                                        <ScrollView horizontal style={styles.chartWrapper}>
                                            <LineChart
                                                data={sortedEntryData}
                                                width={chartEntryWidth}
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
                                </Animated.View>
                            )}
                            {sortedEntryData === null && (
                                <Text style={styles.defaultText}>No Data</Text>
                            )}
                            <Text style={styles.titleText}>Discarded Products</Text>
                            {sortedExitData !== null && (
                                <Animated.View style={{ ...styles.container, opacity: fadeAnimExit }}>
                                    <SegmentedButtons
                                        value={exitSort}
                                        onValueChange={setExitSort}
                                        uncheckedColor={{
                                            textColor: '#fff',
                                        }}
                                        buttons={[
                                            {
                                                value: true,
                                                label: 'Highest To Lowest',
                                                uncheckedColor: '#fff',
                                            },
                                            {
                                                value: false,
                                                label: 'Lowest To Highest',
                                                uncheckedColor: '#fff',
                                            },
                                        ]}
                                    />
                                    <View style={styles.chartContainer}>
                                        <ScrollView horizontal style={styles.chartWrapper}>
                                            <LineChart
                                                data={sortedExitData}
                                                width={chartExitWidth}
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
                                </Animated.View>
                            )}
                            {sortedExitData === null && (
                                <Text style={styles.defaultText}>No Data</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
            )}
            {loading && (
                <View style={styles.noDataContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
            {!loading && sortedEntryData === null && sortedExitData === null && fridgeId && (
                <View style={styles.noDataContainer}>
                    <Text style={styles.defaultText}>No Data</Text>
                </View>
            )}
            {!fridgeId && (
                // <View style={styles.container}>
                //     <Text style={styles.defaultText}>Please select a fridge.</Text>
                // </View>
                <NoFridge></NoFridge>
            )}
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
        gap: 30,
    },
    applyButton: {
        width: '90%',
    },
    applyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 10,
        marginBottom: 10,
        marginTop: 20,
    },
    titleText: {
        color: '#ededed',
        fontWeight: "bold",
        marginVertical: 10,
        fontSize: 15,
    },
    defaultText: {
        color: '#ededed'
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        marginBottom: 250,
    },
    scrollContainer: {
        flexGrow: 1,
    }
});


export default ConsumptionScreen;