import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Screen = ({ children }: PropsWithChildren) => (
  <SafeAreaView className="flex-1 bg-slate-50">
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-5 py-6">{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
