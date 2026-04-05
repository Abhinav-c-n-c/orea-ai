import { IPermissions } from '../types';

export const hasPermission = (
  permissions: IPermissions | undefined,
  permission: keyof IPermissions
): boolean => {
  if (!permissions) return false;
  return permissions[permission] === true;
};

export const hasAnyPermission = (
  permissions: IPermissions | undefined,
  requiredPermissions: (keyof IPermissions)[]
): boolean => {
  if (!permissions) return false;
  return requiredPermissions.some((p) => permissions[p] === true);
};

export const hasAllPermissions = (
  permissions: IPermissions | undefined,
  requiredPermissions: (keyof IPermissions)[]
): boolean => {
  if (!permissions) return false;
  return requiredPermissions.every((p) => permissions[p] === true);
};
