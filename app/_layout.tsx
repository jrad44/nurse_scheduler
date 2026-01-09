import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScheduleProvider } from "@/providers/ScheduleProvider";
import { StaffProvider } from "@/providers/StaffProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: {
        backgroundColor: '#ffffff',
      },
      headerTintColor: '#1a1a1a',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="staff/[id]" 
        options={{ 
          title: "Staff Details",
          presentation: "modal",
          headerStyle: {
            backgroundColor: '#ffffff',
          },
        }} 
      />
      <Stack.Screen 
        name="shift-details" 
        options={{ 
          title: "Shift Details",
          presentation: "modal",
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StaffProvider>
          <ScheduleProvider>
            <RootLayoutNav />
          </ScheduleProvider>
        </StaffProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}