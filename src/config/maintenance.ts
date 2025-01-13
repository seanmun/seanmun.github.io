export const maintenanceConfig = {
  isEnabled: true,
  password: process.env.NEXT_PUBLIC_MAINTENANCE_PASSWORD || 'default_password'
};