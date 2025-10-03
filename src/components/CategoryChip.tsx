import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type CategoryChipProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
};

const CategoryChip = ({ label, icon, isActive, onPress }: CategoryChipProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={isActive ? "#FFFFFF" : "#000000"}
      />
      <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 16,
    marginHorizontal: 8,
    flex: 1,
  },
  chipActive: {
    backgroundColor: "#FF6810",
  },
  chipInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  label: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  labelActive: {
    color: "#FFFFFF",
  },
  labelInactive: {
    color: "#000000",
  },
});

export default CategoryChip;