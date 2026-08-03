import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';

export type MainTabParamList = {
  DashboardTab: undefined;
  PaymentHistoryTab: undefined;
  ExpenseTab: undefined;
  ProfitTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  NewJob: undefined;
  JobDetail: { jobId: string };
};

export type DashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'DashboardTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type PaymentHistoryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'PaymentHistoryTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ProfitScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ProfitTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type NewJobScreenProps = NativeStackScreenProps<RootStackParamList, 'NewJob'>;
export type JobDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;
