import { Linking } from 'react-native';
import { JobStatus, PaymentDetails } from '../types';

export function generateWhatsAppLink(
  phone: string,
  vehicleNumber: string,
  bikeModel: string,
  status: JobStatus,
  note = '',
  charges: number | null = null,
  payment: PaymentDetails | null = null
): string {
  const safeBikeModel = bikeModel || 'Bike';
  const safeVehicleNumber = vehicleNumber || 'N/A';

  let message = '';

  if (status === 'received') {
    message = `Hello! We have received your vehicle (${safeBikeModel} - ${safeVehicleNumber}) at Rana Motors.\n\nYour reported issues have been noted. We will start the work and update you soon!`;
  } else if (status === 'ready') {
    message = `Hello! Good news! The repair on your vehicle (${safeBikeModel} - ${safeVehicleNumber}) has been completed.\n\nTotal Repair Cost: Rs. ${charges || 0}\n\nYour vehicle is ready for pickup. Please visit Rana Motors to collect it.`;
  } else if (status === 'delivered') {
    message = `Hello! Your vehicle (${safeBikeModel} - ${safeVehicleNumber}) has been delivered.\n\nPayment Received: Rs. ${charges || 0}`;
    if (payment) {
      if (payment.mode === 'split') {
        message += `\n(Paid via GPay: Rs.${payment.gpay_amount}, Cash in Hand: Rs.${payment.cash_amount})`;
      } else if (payment.mode === 'gpay') {
        message += `\n(Paid via GPay / UPI)`;
      } else if (payment.mode === 'cash') {
        message += `\n(Paid via Cash in Hand)`;
      }
    }
    message += `\n\nThank you for choosing Rana Motors! Have a safe ride.`;
  } else {
    message = `Hello! Update on your vehicle (${safeBikeModel} - ${safeVehicleNumber}):\n\nStatus: ${status.toUpperCase()}`;
    if (note) message += `\nNote: ${note}`;
    if (charges) message += `\n\nTotal Charges: Rs.${charges}`;
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${phone || ''}?text=${encoded}`;
}

export function openWhatsApp(url: string) {
  Linking.openURL(url).catch(err => {
    console.error('Failed to open WhatsApp:', err);
  });
}
