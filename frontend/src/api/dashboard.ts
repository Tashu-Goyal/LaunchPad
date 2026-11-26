import { DashboardStats } from '../types';
import { apiRequest } from './client';

export function fetchDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>('/dashboard/stats');
}
