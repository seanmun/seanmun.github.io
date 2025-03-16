export const maintenanceConfig = {
  isEnabled: false,
  password: process.env.NEXT_PUBLIC_MAINTENANCE_PASSWORD || 'default_password'
};