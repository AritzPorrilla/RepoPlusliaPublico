import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Panel principal</Text>
      <Text style={styles.text}>Bienvenido a Pluslia Mobile. Aquí podrás ver tus cobros, pagos y movimientos.</Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Welcome')}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#020617',
    justifyContent: 'center',
  },
  heading: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },
  text: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
