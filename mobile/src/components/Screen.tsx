import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

export const Screen = ({ children }: PropsWithChildren) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    className="flex-1 bg-slate-50"
  >
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 px-5 py-6">{children}</View>
    </ScrollView>
  </KeyboardAvoidingView>
);
