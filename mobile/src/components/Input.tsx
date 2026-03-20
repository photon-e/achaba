import { Text, TextInput, View } from "react-native";

interface InputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "phone-pad" | "numeric";
  error?: string;
  hint?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
}

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  hint,
  autoCapitalize = "none",
  editable = true
}: InputProps) => (
  <View className="mb-4">
    <Text className="mb-2 text-sm font-medium text-slate-700">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      editable={editable}
      className={`rounded-2xl border px-4 py-4 text-base text-slate-900 ${
        error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"
      } ${!editable ? "opacity-60" : ""}`}
      placeholderTextColor="#94a3b8"
    />
    {error ? <Text className="mt-2 text-sm text-rose-600">{error}</Text> : null}
    {!error && hint ? <Text className="mt-2 text-sm text-slate-500">{hint}</Text> : null}
  </View>
);
