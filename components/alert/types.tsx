export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons: AlertButton[];
  onClose: () => void;
}