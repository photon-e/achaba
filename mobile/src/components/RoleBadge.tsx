import { Text, View } from "react-native";

export const RoleBadge = ({ role }: { role: string }) => (
  <View className="self-start rounded-full bg-brand-100 px-3 py-1">
    <Text className="text-xs font-semibold uppercase tracking-widest text-brand-700">{role}</Text>
  </View>
);
