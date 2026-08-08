import "react-native-gesture-handler";
import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryProvider } from "./src/context/QueryContext";
import QueryBuilderScreen from "./src/screens/QueryBuilderScreen";
import TableScreen from "./src/screens/TableScreen";
import ChartsScreen from "./src/screens/ChartsScreen";
import ReportScreen from "./src/screens/ReportScreen";
import WebAppShell from "./src/web/WebAppShell";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        {Platform.OS === "web" ? (
          <>
            <StatusBar style="dark" />
            <WebAppShell />
          </>
        ) : (
          <NavigationContainer>
            <StatusBar style="dark" />
            <Tab.Navigator screenOptions={{ headerShown: false }}>
              <Tab.Screen name="Query" component={QueryBuilderScreen} />
              <Tab.Screen name="Table" component={TableScreen} />
              <Tab.Screen name="Charts" component={ChartsScreen} />
              <Tab.Screen name="Report" component={ReportScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        )}
      </QueryProvider>
    </SafeAreaProvider>
  );
}
