import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../theme/colors';

interface PriceAlertFormProps {
  onSave: (alertData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PriceAlertForm: React.FC<PriceAlertFormProps> = ({ 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    targetPrice: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    } else if (formData.origin.length !== 3) {
      newErrors.origin = 'Use 3-letter airport code (e.g., NYC)';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    } else if (formData.destination.length !== 3) {
      newErrors.destination = 'Use 3-letter airport code (e.g., LAX)';
    }

    const price = parseFloat(formData.targetPrice);
    if (!formData.targetPrice) {
      newErrors.targetPrice = 'Target price is required';
    } else if (isNaN(price) || price <= 0) {
      newErrors.targetPrice = 'Enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSave({
      origin: formData.origin.toUpperCase(),
      destination: formData.destination.toUpperCase(),
      targetPrice: parseFloat(formData.targetPrice),
    });
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    autoCapitalize: 'none' | 'characters' = 'characters',
    maxLength?: number,
    error?: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Price Alert</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Icon name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.routeContainer}>
            <View style={styles.airportInput}>
              {renderInput(
                'From',
                formData.origin,
                (text) => setFormData({ ...formData, origin: text }),
                'NYC',
                'default',
                'characters',
                3,
                errors.origin
              )}
            </View>
            
            <View style={styles.arrowContainer}>
              <Icon name="arrow-forward" size={20} color={Colors.primary} />
            </View>
            
            <View style={styles.airportInput}>
              {renderInput(
                'To',
                formData.destination,
                (text) => setFormData({ ...formData, destination: text }),
                'LAX',
                'default',
                'characters',
                3,
                errors.destination
              )}
            </View>
          </View>

          <View style={styles.priceSection}>
            <Icon name="pricetag" size={20} color={Colors.primary} style={styles.priceIcon} />
            {renderInput(
              'Target Price (USD)',
              formData.targetPrice,
              (text) => setFormData({ ...formData, targetPrice: text }),
              '299',
              'numeric',
              'none',
              undefined,
              errors.targetPrice
            )}
          </View>

          <View style={styles.infoBox}>
            <Icon name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              We'll notify you instantly when flights drop to or below your target price. 
              Prices are checked every hour.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Icon name="notifications" size={20} color={Colors.white} />
                  <Text style={styles.saveButtonText}>Create Alert</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  airportInput: {
    flex: 1,
  },
  arrowContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  priceIcon: {
    marginRight: 12,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});