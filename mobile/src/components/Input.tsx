import { Text, TextInput, View } from "react-native";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad" | "numeric";
}

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default"
}: InputProps) => (
  <View className="mb-4">
    <Text className="mb-2 text-sm font-medium text-slate-700">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900"
      placeholderTextColor="#94a3b8"
    />
  </View>
);
